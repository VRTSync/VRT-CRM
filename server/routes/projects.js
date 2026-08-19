import { Router } from "express";
import { asc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { customers, projects, users } from "../db/schema.js";
import { requireAuth } from "../auth.js";

const router = Router();
const PROJECT_STATUSES = ["backlog", "in_progress", "blocked", "done"];

function projectSelection() {
  return {
    id: projects.id,
    name: projects.name,
    description: projects.description,
    status: projects.status,
    customerId: projects.customerId,
    customerName: customers.name,
    leadUserId: projects.leadUserId,
    leadName: users.name,
    leadAvatarUrl: users.avatarUrl,
    targetDate: projects.targetDate,
    createdAt: projects.createdAt,
  };
}

function projectQuery() {
  return db
    .select(projectSelection())
    .from(projects)
    .leftJoin(customers, eq(projects.customerId, customers.id))
    .leftJoin(users, eq(projects.leadUserId, users.id));
}

async function validCustomer(customerId) {
  const [customer] = await db
    .select({ id: customers.id })
    .from(customers)
    .where(eq(customers.id, customerId));
  return Boolean(customer);
}

async function validLead(leadUserId) {
  const [lead] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, leadUserId));
  return Boolean(lead);
}

router.get("/", requireAuth, async (_req, res, next) => {
  try {
    const rows = await projectQuery().orderBy(asc(projects.name));
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid project id" });
    }
    const [project] = await projectQuery().where(eq(projects.id, id));
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json(project);
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const {
      name,
      description,
      customerId,
      leadUserId,
      targetDate,
      status,
    } = req.body || {};
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Project name is required" });
    }
    if (status !== undefined && !PROJECT_STATUSES.includes(status)) {
      return res.status(400).json({ error: "Invalid project status" });
    }
    if (customerId !== undefined && customerId !== null) {
      if (!Number.isInteger(customerId) || !(await validCustomer(customerId))) {
        return res.status(400).json({ error: "Customer not found" });
      }
    }
    const leadId = leadUserId ?? req.user.id;
    if (!Number.isInteger(leadId) || !(await validLead(leadId))) {
      return res.status(400).json({ error: "Project lead not found" });
    }
    const [created] = await db
      .insert(projects)
      .values({
        name: name.trim(),
        description: typeof description === "string" && description.trim()
          ? description.trim()
          : null,
        customerId: customerId ?? null,
        leadUserId: leadId,
        targetDate: targetDate || null,
        status: status || "backlog",
      })
      .returning({ id: projects.id });
    const [project] = await projectQuery().where(eq(projects.id, created.id));
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid project id" });
    }
    const { status } = req.body || {};
    if (!PROJECT_STATUSES.includes(status)) {
      return res.status(400).json({ error: "Invalid project status" });
    }
    const [updated] = await db
      .update(projects)
      .set({ status })
      .where(eq(projects.id, id))
      .returning({ id: projects.id });
    if (!updated) {
      return res.status(404).json({ error: "Project not found" });
    }
    const [project] = await projectQuery().where(eq(projects.id, id));
    res.json(project);
  } catch (err) {
    next(err);
  }
});

export default router;