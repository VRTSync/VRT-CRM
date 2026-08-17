import { randomBytes, timingSafeEqual } from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { eq } from "drizzle-orm";
import { db, pool } from "./db/index.js";
import { users } from "./db/schema.js";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

// Google's JWKS endpoint for ID token signature verification.
// createRemoteJWKSet caches the key set and re-fetches on cache miss.
const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs")
);

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

function allowedDomain() {
  return requiredEnv("GOOGLE_WORKSPACE_DOMAIN").toLowerCase();
}

function callbackUrl() {
  if (process.env.GOOGLE_OAUTH_CALLBACK_URL) {
    return process.env.GOOGLE_OAUTH_CALLBACK_URL;
  }
  if (process.env.REPLIT_DEV_DOMAIN) {
    return `https://${process.env.REPLIT_DEV_DOMAIN}/auth/google/callback`;
  }
  throw new Error("GOOGLE_OAUTH_CALLBACK_URL is not set");
}

// Validates a Google ID token using JWKS signature verification.
// Enforces: signature, issuer, audience (client_id), expiry, and email_verified.
// Throws if any check fails.
async function verifyGoogleIdToken(idToken) {
  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    issuer: "https://accounts.google.com",
    audience: requiredEnv("GOOGLE_CLIENT_ID"),
  });
  if (!payload.email_verified) {
    throw new Error("Google account email is not verified");
  }
  return payload;
}

// Timing-safe string comparison to prevent timing attacks on the state value.
function safeEqual(a, b) {
  try {
    const ab = Buffer.from(a, "utf8");
    const bb = Buffer.from(b, "utf8");
    if (ab.length !== bb.length) return false;
    return timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

export function sessionMiddleware() {
  const PgStore = connectPgSimple(session);
  return session({
    store: new PgStore({ pool, createTableIfMissing: true }),
    secret: requiredEnv("SESSION_SECRET"),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    },
  });
}

export async function currentUser(req) {
  if (!req.session || !req.session.userId) return null;
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.id, req.session.userId));
  const user = rows[0];
  if (!user || !user.isActive) return null;
  return user;
}

export function requireAuth(req, res, next) {
  currentUser(req)
    .then((user) => {
      if (!user) {
        return res.status(401).json({ error: "Not signed in" });
      }
      req.user = user;
      next();
    })
    .catch(next);
}

export function requireOwner(req, res, next) {
  if (!req.user || req.user.role !== "owner") {
    return res
      .status(403)
      .json({ error: "Only an owner can perform this action" });
  }
  next();
}

export function registerAuthRoutes(app) {
  // Step 1: redirect user to Google, storing a random state value in the
  // session to validate on return. The state is single-use: it is deleted
  // immediately after one validation attempt in the callback.
  app.get("/auth/google", (req, res) => {
    const state = randomBytes(32).toString("hex");
    req.session.oauthState = state;
    req.session.save((err) => {
      if (err) {
        return res.redirect("/login?error=oauth");
      }
      const params = new URLSearchParams({
        client_id: requiredEnv("GOOGLE_CLIENT_ID"),
        redirect_uri: callbackUrl(),
        response_type: "code",
        scope: "openid email profile",
        hd: allowedDomain(),
        prompt: "select_account",
        state,
      });
      res.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
    });
  });

  app.get("/auth/google/callback", async (req, res, next) => {
    try {
      const { code, state, error } = req.query;

      // Consume the stored state immediately so it cannot be replayed.
      const storedState = req.session.oauthState;
      delete req.session.oauthState;

      if (error || !code) {
        return res.redirect("/login?error=oauth");
      }

      // Reject missing, blank, or mismatched state -- login CSRF protection.
      if (
        !state ||
        !storedState ||
        !safeEqual(String(state), String(storedState))
      ) {
        return res.redirect("/login?error=oauth");
      }

      const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: requiredEnv("GOOGLE_CLIENT_ID"),
          client_secret: requiredEnv("GOOGLE_CLIENT_SECRET"),
          redirect_uri: callbackUrl(),
          grant_type: "authorization_code",
        }),
      });
      if (!tokenRes.ok) {
        return res.redirect("/login?error=oauth");
      }
      const tokens = await tokenRes.json();

      // Verify the ID token signature, issuer, audience, expiry, and
      // email_verified before trusting any claims. Throws on failure.
      let claims;
      try {
        claims = await verifyGoogleIdToken(tokens.id_token);
      } catch {
        return res.redirect("/login?error=oauth");
      }

      const email = (claims.email || "").toLowerCase();
      const domain = email.split("@")[1] || "";
      const hostedDomain = (claims.hd || "").toLowerCase();

      // Domain restriction is the access control. Reject before any
      // user record is created or updated.
      if (domain !== allowedDomain() || hostedDomain !== allowedDomain()) {
        return res.redirect("/login?error=domain");
      }

      const existing = await db
        .select()
        .from(users)
        .where(eq(users.googleSub, String(claims.sub)));

      let user = existing[0];
      if (!user) {
        // First successful sign-in creates the user with a null role.
        const inserted = await db
          .insert(users)
          .values({
            googleSub: String(claims.sub),
            email,
            name: String(claims.name || email),
            avatarUrl: claims.picture ? String(claims.picture) : null,
            role: null,
          })
          .returning();
        user = inserted[0];
      } else if (!user.isActive) {
        return res.redirect("/login?error=inactive");
      }

      req.session.userId = user.id;
      req.session.save(() => res.redirect("/"));
    } catch (err) {
      next(err);
    }
  });

  app.post("/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });

  app.get("/api/me", async (req, res, next) => {
    try {
      const user = await currentUser(req);
      if (!user) {
        return res.status(401).json({ error: "Not signed in" });
      }
      res.json(user);
    } catch (err) {
      next(err);
    }
  });
}
