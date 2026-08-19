import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { customers, notes, projects, users } from "../db/schema.js";
import { requireAuth } from "../auth.js";

// The composer writes five kinds. system is written only by the stage
// change engine in a later slice.
const COMPOSER_KINDS = ["call", "email", "meeting", "site_visit", "note"];

const router = Router();

function contextFromQuery(query) {
  const hasCustomer = query.customerId !== undefined;
  const hasProject = query.projectId !== undefined;
  if (hasCustomer === hasProject) return null;
  const id = Number(hasCustomer ? query.customerId : query.projectId);
  if (!Number.isInteger(id)) return null;
  return hasCustomer ? { customerId: id } : { projectId: id };
}

// Notes for one customer or project context, newest first.
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const context = contextFromQuery(req.query);
    if (!context) {
      return res.status(400).json({
        error: "Provide exactly one of customerId or projectId",
      });
    }
    const rows = await db
      .select({
        id: notes.id,
        customerId: notes.customerId,
        projectId: notes.projectId,
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
        .where(
          context.customerId
            ? eq(notes.customerId, context.customerId)
            : eq(notes.projectId, context.projectId)
        )
      .orderBy(desc(notes.occurredAt), desc(notes.id));
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { customerId, projectId, kind, body, occurredAt } = req.body || {};
    const hasCustomer = customerId !== undefined && customerId !== null;
    const hasProject = projectId !== undefined && projectId !== null;
    if (hasCustomer === hasProject) {
      return res.status(400).json({
        error: "Provide exactly one of customerId or projectId",
      });
    }
    if (hasCustomer && !Number.isInteger(customerId)) {
      return res.status(400).json({ error: "Invalid customerId" });
    }
    if (hasProject && !Number.isInteger(projectId)) {
      return res.status(400).json({ error: "Invalid projectId" });
    }
    const parentTable = hasCustomer ? customers : projects;
    const parentColumn = hasCustomer ? customers.id : projects.id;
    const parentId = hasCustomer ? customerId : projectId;
    const [parent] = await db
      .select({ id: parentColumn })
      .from(parentTable)
      .where(eq(parentColumn, parentId));
    if (!parent) {
      return res.status(400).json({
        error: hasCustomer ? "Customer not found" : "Project not found",
      });
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
        customerId: hasCustomer ? customerId : null,
        projectId: hasProject ? projectId : null,
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
