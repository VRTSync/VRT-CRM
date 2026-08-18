import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { notes, users } from "../db/schema.js";
import { requireAuth } from "../auth.js";

// The composer writes five kinds. system is written only by the stage
// change engine in a later slice.
const COMPOSER_KINDS = ["call", "email", "meeting", "site_visit", "note"];

const router = Router();

// Notes for a customer, newest first.
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const customerId = Number(req.query.customerId);
    if (!Number.isInteger(customerId)) {
      return res.status(400).json({ error: "customerId is required" });
    }
    const rows = await db
      .select({
        id: notes.id,
        customerId: notes.customerId,
        kind: notes.kind,
        body: notes.body,
        occurredAt: notes.occurredAt,
        createdAt: notes.createdAt,
        fromStage: notes.fromStage,
        toStage: notes.toStage,
        authorUserId: notes.authorUserId,
        authorName: users.name,
      })
      .from(notes)
      .leftJoin(users, eq(users.id, notes.authorUserId))
      .where(eq(notes.customerId, customerId))
      .orderBy(desc(notes.occurredAt), desc(notes.id));
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { customerId, kind, body, occurredAt } = req.body || {};
    if (!Number.isInteger(customerId)) {
      return res.status(400).json({ error: "customerId is required" });
    }
    if (!COMPOSER_KINDS.includes(kind)) {
      return res.status(400).json({
        error: "Kind must be call, email, meeting, site_visit, or note",
      });
    }
    if (typeof body !== "string" || !body.trim()) {
      return res.status(400).json({ error: "Body is required" });
    }
    const [created] = await db
      .insert(notes)
      .values({
        customerId,
        kind,
        body: body.trim(),
        occurredAt: occurredAt ? new Date(occurredAt) : new Date(),
        authorUserId: req.user.id,
      })
      .returning();
    res.status(201).json({ ...created, authorName: req.user.name });
  } catch (err) {
    next(err);
  }
});

export default router;
