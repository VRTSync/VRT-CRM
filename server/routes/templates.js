import { Router } from "express";
import { and, asc, count, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { taskTemplates, tasks, templateItems } from "../db/schema.js";
import { requireAuth } from "../auth.js";

const TASK_ROLES = ["sales", "mapping", "admin"];

const router = Router();

// List all templates with item counts.
router.get("/templates", requireAuth, async (req, res, next) => {
  try {
    const rows = await db
      .select({
        template: taskTemplates,
        itemCount: count(templateItems.id),
      })
      .from(taskTemplates)
      .leftJoin(
        templateItems,
        and(
          eq(templateItems.templateId, taskTemplates.id),
          eq(templateItems.isActive, true)
        )
      )
      .groupBy(taskTemplates.id)
      .orderBy(taskTemplates.id);
    res.json(rows.map(({ template, itemCount }) => ({ ...template, itemCount })));
  } catch (err) {
    next(err);
  }
});

// One template with its items in sequence order.
router.get("/templates/:id", requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid template id" });
    }
    const [template] = await db
      .select()
      .from(taskTemplates)
      .where(eq(taskTemplates.id, id));
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }
    const items = await db
      .select()
      .from(templateItems)
      .where(and(eq(templateItems.templateId, id), eq(templateItems.isActive, true)))
      .orderBy(asc(templateItems.sequence), asc(templateItems.id));
    res.json({ ...template, items });
  } catch (err) {
    next(err);
  }
});

// Add a row to a template. Sequence defaults to the end.
router.post("/templates/:id/items", requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid template id" });
    }
    const [template] = await db
      .select()
      .from(taskTemplates)
      .where(eq(taskTemplates.id, id));
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }
    const { title, role, dueOffsetDays, sequence } = req.body || {};
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: "Title is required" });
    }
    if (!TASK_ROLES.includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    if (!Number.isInteger(dueOffsetDays) || dueOffsetDays < 0) {
      return res.status(400).json({ error: "Invalid dueOffsetDays" });
    }
    let seq = sequence;
    if (!Number.isInteger(seq)) {
      const existing = await db
        .select({ sequence: templateItems.sequence })
        .from(templateItems)
        .where(eq(templateItems.templateId, id));
      seq = existing.reduce((m, r) => Math.max(m, r.sequence), 0) + 1;
    }
    const [created] = await db
      .insert(templateItems)
      .values({
        templateId: id,
        sequence: seq,
        title: String(title).trim(),
        role,
        dueOffsetDays,
      })
      .returning();
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// Patch a template item: title, role, due offset, sequence.
router.patch("/template-items/:id", requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid item id" });
    }
    const { title, role, dueOffsetDays, sequence } = req.body || {};
    const patch = {};
    if (title !== undefined) {
      if (!String(title).trim()) {
        return res.status(400).json({ error: "Title cannot be empty" });
      }
      patch.title = String(title).trim();
    }
    if (role !== undefined) {
      if (!TASK_ROLES.includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      patch.role = role;
    }
    if (dueOffsetDays !== undefined) {
      if (!Number.isInteger(dueOffsetDays) || dueOffsetDays < 0) {
        return res.status(400).json({ error: "Invalid dueOffsetDays" });
      }
      patch.dueOffsetDays = dueOffsetDays;
    }
    if (sequence !== undefined) {
      if (!Number.isInteger(sequence) || sequence < 1) {
        return res.status(400).json({ error: "Invalid sequence" });
      }
      patch.sequence = sequence;
    }
    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ error: "Nothing to update" });
    }
    const [updated] = await db
      .update(templateItems)
      .set(patch)
      .where(eq(templateItems.id, id))
      .returning();
    if (!updated) {
      return res.status(404).json({ error: "Template item not found" });
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Delete a template item. One of the three destructive actions in spec 8:
// the confirmation gate requires confirm: true in the body.
router.delete("/template-items/:id", requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid item id" });
    }
    if (!(req.body && req.body.confirm === true)) {
      return res
        .status(400)
        .json({ error: "Deleting a template row requires confirmation" });
    }
    const [item] = await db
      .select()
      .from(templateItems)
      .where(and(eq(templateItems.id, id), eq(templateItems.isActive, true)));
    if (!item) {
      return res.status(404).json({ error: "Template item not found" });
    }
    // If any task references this row, deactivate instead of deleting so
    // backward-move cleanup can still map those tasks to their stage.
    const [referenced] = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(eq(tasks.templateItemId, id))
      .limit(1);
    if (referenced) {
      await db
        .update(templateItems)
        .set({ isActive: false })
        .where(eq(templateItems.id, id));
    } else {
      await db.delete(templateItems).where(eq(templateItems.id, id));
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
