// The stage change engine. All of spec section 10 lives here and nothing
// else. Everything below happens in one transaction: if the process dies
// midway, the database looks exactly as it did before the change started.
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  customers,
  notes,
  tasks,
  taskTemplates,
  templateItems,
  users,
} from "../db/schema.js";
import { classifyMove, isSkip } from "./stageOrder.js";

function todayPlus(offsetDays) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const STAGE_SENTENCE_LABELS = {
  lead: "Lead",
  discovery: "Discovery",
  proposal: "Proposal",
  signed: "Signed",
  mapping: "Property Mapping",
  data_load: "Data Load",
  training: "Training",
  live: "Live",
};

// Thrown when a required reason is missing. The route maps it to a 400.
export class ReasonRequiredError extends Error {
  constructor() {
    super("A reason is required for this move");
    this.reasonRequired = true;
  }
}

// Read-only checklist lookup. This intentionally uses all template items,
// including inactive ones, because an existing task can still reference an
// item that was later deactivated.
export async function getChecklistTasks(tx, customerId, stage, statuses) {
  const [template] = await tx
    .select()
    .from(taskTemplates)
    .where(
      and(eq(taskTemplates.triggerStage, stage), eq(taskTemplates.isActive, true))
    );
  if (!template) return { template: null, itemIds: [], tasks: [] };
  const items = await tx
    .select({ id: templateItems.id })
    .from(templateItems)
    .where(eq(templateItems.templateId, template.id));
  const itemIds = items.map((item) => item.id);
  if (!itemIds.length) return { template, itemIds, tasks: [] };
  const matchingTasks = await tx
    .select({ id: tasks.id })
    .from(tasks)
    .where(
      and(
        eq(tasks.customerId, customerId),
        inArray(tasks.templateItemId, itemIds),
        inArray(tasks.status, statuses)
      )
    );
  return { template, itemIds, tasks: matchingTasks };
}

export async function getForwardTaskPlan(tx, customer, toStage) {
  const [template] = await tx
    .select()
    .from(taskTemplates)
    .where(
      and(
        eq(taskTemplates.triggerStage, toStage),
        eq(taskTemplates.isActive, true)
      )
    );
  if (!template) return { tasks: [], assignees: [] };

  const items = await tx
    .select()
    .from(templateItems)
    .where(
      and(
        eq(templateItems.templateId, template.id),
        eq(templateItems.isActive, true)
      )
    )
    .orderBy(templateItems.sequence);
  if (!items.length) return { tasks: [], assignees: [] };

  // Dedupe is by customer and template item across every task status.
  const existing = await tx
    .select({ templateItemId: tasks.templateItemId })
    .from(tasks)
    .where(
      and(
        eq(tasks.customerId, customer.id),
        inArray(
          tasks.templateItemId,
          items.map((item) => item.id)
        )
      )
    );
  const existingItemIds = new Set(existing.map((task) => task.templateItemId));
  const activeUsers = await tx
    .select()
    .from(users)
    .where(eq(users.isActive, true));
  const owner = activeUsers.find((user) => user.id === customer.ownerUserId);
  const resolveAssignee = (role) => {
    if (owner && owner.role === role) return owner.id;
    const holders = activeUsers.filter((user) => user.role === role);
    return holders.length === 1 ? holders[0].id : null;
  };

  const newTasks = items
    .filter((item) => !existingItemIds.has(item.id))
    .map((item) => ({
      title: item.title,
      customerId: customer.id,
      role: item.role,
      assigneeUserId: resolveAssignee(item.role),
      dueDate: todayPlus(item.dueOffsetDays),
      status: "open",
      source: "template",
      templateItemId: item.id,
    }));
  const namesById = new Map(activeUsers.map((user) => [user.id, user.name]));
  const groupCounts = new Map();
  newTasks.forEach((task) => {
    const key = task.assigneeUserId || "unassigned";
    groupCounts.set(key, (groupCounts.get(key) || 0) + 1);
  });
  const assignees = [...groupCounts.entries()].map(([id, count]) => ({
    userId: id === "unassigned" ? null : id,
    name: id === "unassigned" ? "Unassigned" : namesById.get(id),
    count,
  }));
  return { tasks: newTasks, assignees };
}

export async function getBackwardTaskSummary(tx, customerId, fromStage) {
  const [template] = await tx
    .select()
    .from(taskTemplates)
    .where(eq(taskTemplates.triggerStage, fromStage));
  if (!template) return { itemIds: [], openDeleteCount: 0, completedKeepCount: 0 };
  const items = await tx
    .select({ id: templateItems.id })
    .from(templateItems)
    .where(eq(templateItems.templateId, template.id));
  const itemIds = items.map((item) => item.id);
  if (!itemIds.length) return { itemIds, openDeleteCount: 0, completedKeepCount: 0 };
  const matchingTasks = await tx
    .select({ status: tasks.status })
    .from(tasks)
    .where(
      and(
        eq(tasks.customerId, customerId),
        eq(tasks.source, "template"),
        inArray(tasks.templateItemId, itemIds)
      )
    );
  return {
    itemIds,
    openDeleteCount: matchingTasks.filter((task) =>
      ["open", "blocked"].includes(task.status)
    ).length,
    completedKeepCount: matchingTasks.filter((task) => task.status === "done").length,
  };
}

// A shared, read-only calculation used by the preview endpoint and by the
// write transaction. Keeping it here prevents the two paths from drifting in
// template, dedupe, active-user, and assignee fallback behavior.
export async function buildStageChangePreview(tx, customer, toStage) {
  const direction = classifyMove(customer.stage, toStage);
  const skip = direction === "forward" && isSkip(customer.stage, toStage);
  const carryForward =
    direction === "forward"
      ? await getChecklistTasks(tx, customer.id, customer.stage, ["open", "blocked"])
      : { tasks: [] };
  const forward =
    direction === "forward"
      ? await getForwardTaskPlan(tx, customer, toStage)
      : { tasks: [], assignees: [] };
  const backward =
    direction === "backward"
      ? await getBackwardTaskSummary(tx, customer.id, customer.stage)
      : { openDeleteCount: 0, completedKeepCount: 0 };

  return {
    fromStage: customer.stage,
    toStage,
    direction,
    skip,
    reasonRequired:
      direction === "backward" || skip || carryForward.tasks.length > 0,
    carryForwardCount: carryForward.tasks.length,
    forward: {
      taskCount: forward.tasks.length,
      assigneeCount: forward.assignees.length,
      assignees: forward.assignees,
      newTasks: forward.tasks,
    },
    backward,
  };
}

// A non-mutating public entry point for the customer preview route.
export async function previewStageChange({ customerId, toStage }) {
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, customerId));
  if (!customer || customer.stage === toStage) return null;
  const preview = await buildStageChangePreview(db, customer, toStage);
  return {
    fromStage: preview.fromStage,
    toStage: preview.toStage,
    direction: preview.direction,
    skip: preview.skip,
    reasonRequired: preview.reasonRequired,
    carryForwardCount: preview.carryForwardCount,
    forward: {
      taskCount: preview.forward.taskCount,
      assigneeCount: preview.forward.assigneeCount,
      assignees: preview.forward.assignees,
    },
    backward: {
      openDeleteCount: preview.backward.openDeleteCount,
      completedKeepCount: preview.backward.completedKeepCount,
    },
  };
}

// Runs a full stage change per spec 10.1 and 10.2, in one transaction.
// The customer row is re-read and locked inside the transaction so the
// reason requirement, the note, the stage update, and all task work are
// decided against one consistent state, even under concurrent requests.
// Throws ReasonRequiredError when a required reason is missing.
// Returns the updated customer row, or null when the customer is gone or
// already in the target stage.
export async function changeStage({ customerId, toStage, reason, authorUserId }) {
  return db.transaction(async (tx) => {
    const [customer] = await tx
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .for("update");
    if (!customer || customer.stage === toStage) return null;

    const fromStage = customer.stage;
    const preview = await buildStageChangePreview(tx, customer, toStage);
    const { direction, skip } = preview;

    // A reason is required on any backward move, any skip ahead, and any
    // forward move that leaves open checklist items for the current stage.
    if (!reason) {
      if (preview.reasonRequired) throw new ReasonRequiredError();
    }

    // 10.1 step 1: one note with kind = system, both stage columns set.
    // Body is the typed reason on a backward move or skip ahead, a
    // generated sentence on an ordinary forward move.
    const body =
      direction === "backward" || skip
        ? reason
        : `Advanced from ${STAGE_SENTENCE_LABELS[fromStage]} to ${STAGE_SENTENCE_LABELS[toStage]}.`;
    await tx.insert(notes).values({
      customerId: customer.id,
      authorUserId,
      kind: "system",
      body,
      fromStage,
      toStage,
    });

    // 10.1 step 2: update stage and stage_entered_at.
    const [updated] = await tx
      .update(customers)
      .set({ stage: toStage, stageEnteredAt: new Date() })
      .where(eq(customers.id, customer.id))
      .returning();

    if (direction === "backward") {
      // 10.2: delete open tasks belonging to the stage being abandoned,
      // meaning tasks whose template_item_id maps to the template for
      // from_stage and whose status is open or blocked. Completed tasks
      // stay, manual tasks are never touched, and templates do not fire.
      // Cleanup applies whether or not the template is still active: the
      // tasks exist, so they are abandoned either way.
      if (preview.backward.itemIds.length) {
        await tx
          .delete(tasks)
          .where(
            and(
              eq(tasks.customerId, customer.id),
              eq(tasks.source, "template"),
              inArray(tasks.templateItemId, preview.backward.itemIds),
              inArray(tasks.status, ["open", "blocked"])
            )
          );
      }
      return updated;
    }

    if (preview.forward.newTasks.length) {
      await tx.insert(tasks).values(preview.forward.newTasks);
    }
    return updated;
  });
}
