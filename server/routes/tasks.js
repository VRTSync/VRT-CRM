import { Router } from "express";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../db/index.js";
import { tasks, customers, projects, users } from "../db/schema.js";
import { requireAuth } from "../auth.js";

const router = Router();

const TASK_ROLES = ["sales", "mapping", "admin"];
const TASK_STATUSES = ["open", "done", "blocked"];

// A task assignee must be an existing, active user with a non-null role.
// Null-role users can sign in and read but cannot be assigned tasks.
// Returns an error string, or null when the assignee is valid.
async function validateAssignee(assigneeUserId) {
  if (!Number.isInteger(assigneeUserId)) {
    return "Invalid assigneeUserId";
  }
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, assigneeUserId));
  if (!user) return "Assignee not found";
  if (!user.isActive) return "Assignee is deactivated";
  if (!user.role) return "Assignee has no role and cannot be assigned tasks";
  return null;
}

// List with optional filters. Joined names ride along so the client does
// not need extra lookups for the row meta line.
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { customerId, projectId, assigneeUserId, role, status, unassigned } = req.query;
    const conditions = [];
    if (customerId !== undefined) {
      const id = Number(customerId);
      if (!Number.isInteger(id)) {
        return res.status(400).json({ error: "Invalid customerId" });
      }
      conditions.push(eq(tasks.customerId, id));
    }
    if (projectId !== undefined) {
      const id = Number(projectId);
      if (!Number.isInteger(id)) {
        return res.status(400).json({ error: "Invalid projectId" });
      }
      conditions.push(eq(tasks.projectId, id));
    }
    if (assigneeUserId !== undefined) {
      const id = Number(assigneeUserId);
      if (!Number.isInteger(id)) {
        return res.status(400).json({ error: "Invalid assigneeUserId" });
      }
      conditions.push(eq(tasks.assigneeUserId, id));
    }
    if (role !== undefined) {
      if (!TASK_ROLES.includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      conditions.push(eq(tasks.role, role));
    }
    if (status !== undefined) {
      if (!TASK_STATUSES.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      conditions.push(eq(tasks.status, status));
    }
    if (unassigned === "true") {
      conditions.push(isNull(tasks.assigneeUserId));
    }

    const rows = await db
      .select({
        task: tasks,
        customerName: customers.name,
        projectName: projects.name,
        assigneeName: users.name,
      })
      .from(tasks)
      .leftJoin(customers, eq(tasks.customerId, customers.id))
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .leftJoin(users, eq(tasks.assigneeUserId, users.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(tasks.dueDate, tasks.id);

    res.json(
      rows.map(({ task, customerName, projectName, assigneeName }) => ({
        ...task,
        customerName,
        projectName,
        assigneeName,
      }))
    );
  } catch (err) {
    next(err);
  }
});

// Manual creation only. Template and meeting sources belong to later slices.
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const {
      title,
      description,
      customerId,
      projectId,
      role,
      assigneeUserId,
      dueDate,
      source,
    } = req.body || {};
    if (source === "template" || source === "meeting") {
      return res
        .status(400)
        .json({ error: "Only manual tasks can be created here" });
    }
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: "Title is required" });
    }
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
    if (role !== undefined && role !== null && !TASK_ROLES.includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }
    if (assigneeUserId !== undefined && assigneeUserId !== null) {
      const problem = await validateAssignee(assigneeUserId);
      if (problem) return res.status(400).json({ error: problem });
    }
    const [created] = await db
      .insert(tasks)
      .values({
        title: String(title).trim(),
        description: description || null,
        customerId: hasCustomer ? customerId : null,
        projectId: hasProject ? projectId : null,
        role: role || null,
        assigneeUserId: assigneeUserId ?? null,
        dueDate: dueDate || null,
        status: "open",
        source: "manual",
      })
      .returning();
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

// Patch status, assignee, due date, or title. Completion time is owned
// here: done sets it, open or blocked clears it.
router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid task id" });
    }
    const patch = {};
    const { status, assigneeUserId, dueDate, title } = req.body || {};
    if (status !== undefined) {
      if (!TASK_STATUSES.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      patch.status = status;
      patch.completedAt = status === "done" ? new Date() : null;
    }
    if (assigneeUserId !== undefined) {
      if (assigneeUserId !== null) {
        const problem = await validateAssignee(assigneeUserId);
        if (problem) return res.status(400).json({ error: problem });
      }
      patch.assigneeUserId = assigneeUserId;
    }
    if (dueDate !== undefined) {
      patch.dueDate = dueDate;
    }
    if (title !== undefined) {
      if (!String(title).trim()) {
        return res.status(400).json({ error: "Title cannot be empty" });
      }
      patch.title = String(title).trim();
    }
    if (Object.keys(patch).length === 0) {
      return res.status(400).json({ error: "Nothing to update" });
    }
    const [updated] = await db
      .update(tasks)
      .set(patch)
      .where(eq(tasks.id, id))
      .returning();
    if (!updated) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
