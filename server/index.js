import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import express from "express";
import { sessionMiddleware, registerAuthRoutes } from "./auth.js";
import usersRouter from "./routes/users.js";
import customersRouter from "./routes/customers.js";
import notesRouter from "./routes/notes.js";
import contactsRouter from "./routes/contacts.js";
import tasksRouter from "./routes/tasks.js";
import templatesRouter from "./routes/templates.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.set("trust proxy", 1);
app.use(express.json());
app.use(sessionMiddleware());

registerAuthRoutes(app);
app.use("/api/users", usersRouter);
app.use("/api/customers", customersRouter);
app.use("/api/notes", notesRouter);
app.use("/api/contacts", contactsRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api", templatesRouter);

// In production the Vite client is built ahead of time into client/dist.
// Express serves those static files and falls back to index.html for all
// non-API routes so the React router handles navigation.
if (process.env.NODE_ENV === "production") {
  const clientDist = path.join(__dirname, "../client/dist");
  if (existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get("*", (req, res) => {
      res.sendFile(path.join(clientDist, "index.html"));
    });
  } else {
    console.warn("client/dist not found; run pnpm build before deploying");
  }
} else {
  app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
  });
}

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`VRTSync CRM API listening on ${port}`);
});
