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

// Whether open checklist items exist for the customer's current stage:
// open or blocked template tasks whose items belong to the template that
// triggers on that stage.
async function hasOpenChecklist(tx, customerId, stage) {
  const [template] = await tx
    .select()
    .from(taskTemplates)
    .where(
      and(eq(taskTemplates.triggerStage, stage), eq(taskTemplates.isActive, true))
    );
  if (!template) return false;
  const items = await tx
    .select({ id: templateItems.id })
    .from(templateItems)
    .where(eq(templateItems.templateId, template.id));
  if (!items.length) return false;
  const open = await tx
    .select({ id: tasks.id })
    .from(tasks)
    .where(
      and(
        eq(tasks.customerId, customerId),
        inArray(
          tasks.templateItemId,
          items.map((i) => i.id)
        ),
        inArray(tasks.status, ["open", "blocked"])
      )
    );
  return open.length > 0;
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
    const direction = classifyMove(fromStage, toStage);
    const skip = direction === "forward" && isSkip(fromStage, toStage);

    // A reason is required on any backward move, any skip ahead, and any
    // forward move that leaves open checklist items for the current stage.
    if (!reason) {
      const required =
        direction === "backward" ||
        skip ||
        (direction === "forward" &&
          (await hasOpenChecklist(tx, customer.id, fromStage)));
      if (required) throw new ReasonRequiredError();
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
      const [fromTemplate] = await tx
        .select()
        .from(taskTemplates)
        .where(eq(taskTemplates.triggerStage, fromStage));
      if (fromTemplate) {
        const items = await tx
          .select({ id: templateItems.id })
          .from(templateItems)
          .where(eq(templateItems.templateId, fromTemplate.id));
        const itemIds = items.map((i) => i.id);
        if (itemIds.length) {
          await tx
            .delete(tasks)
            .where(
              and(
                eq(tasks.customerId, customer.id),
                eq(tasks.source, "template"),
                inArray(tasks.templateItemId, itemIds),
                inArray(tasks.status, ["open", "blocked"])
              )
            );
        }
      }
      return updated;
    }

    // 10.1 step 4: look up an active template for the new stage.
    const [template] = await tx
      .select()
      .from(taskTemplates)
      .where(
        and(
          eq(taskTemplates.triggerStage, toStage),
          eq(taskTemplates.isActive, true)
        )
      );
    if (!template) return updated;

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

    // 10.1 step 5: the dedupe is on template_item_id scoped to this
    // customer, across every status. Not on title, not on open tasks only.
    const existing = await tx
      .select({ templateItemId: tasks.templateItemId })
      .from(tasks)
      .where(
        and(
          eq(tasks.customerId, customer.id),
          inArray(
            tasks.templateItemId,
            items.map((i) => i.id)
          )
        )
      );
    const existingItemIds = new Set(existing.map((t) => t.templateItemId));

    // 10.1 step 6: assignee resolution, three-step fallback.
    const activeUsers = await tx
      .select()
      .from(users)
      .where(eq(users.isActive, true));
    const owner = activeUsers.find((u) => u.id === updated.ownerUserId);
    function resolveAssignee(role) {
      if (owner && owner.role === role) return owner.id;
      const holders = activeUsers.filter((u) => u.role === role);
      if (holders.length === 1) return holders[0].id;
      return null;
    }

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
    if (newTasks.length) {
      await tx.insert(tasks).values(newTasks);
    }
    return updated;
  });
}
