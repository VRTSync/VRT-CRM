import { Router } from "express";
import { eq, max, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { customers, customerLayers, notes } from "../db/schema.js";
import { requireAuth } from "../auth.js";
import { STAGE_ORDER } from "../lib/stageOrder.js";
import {
  changeStage,
  previewStageChange,
  ReasonRequiredError,
} from "../lib/stageEngine.js";

const router = Router();

// List. lastContact is the occurred_at of the most recent note per customer.
// nextStep is null in this slice, the column exists and renders empty.
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const lastContacts = db
      .select({
        customerId: notes.customerId,
        lastContact: max(notes.occurredAt).as("last_contact"),
      })
      .from(notes)
      .groupBy(notes.customerId)
      .as("last_contacts");

    const rows = await db
      .select({
        customer: customers,
        lastContact: lastContacts.lastContact,
      })
      .from(customers)
      .leftJoin(lastContacts, eq(lastContacts.customerId, customers.id))
      .orderBy(customers.name);

    res.json(
      rows.map(({ customer, lastContact }) => ({
        ...customer,
        lastContact,
        nextStep: null,
      }))
    );
  } catch (err) {
    next(err);
  }
});

// Single record with its four layers. Annual value is computed, never
// stored: the sum of annual_price across layers where in_scope is true.
router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid customer id" });
    }
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id));
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    const layers = await db
      .select()
      .from(customerLayers)
      .where(eq(customerLayers.customerId, id))
      .orderBy(
        sql`array_position(array['property','irrigation','trees','snow'], ${customerLayers.layer}::text)`
      );
    const annualValue = layers.reduce(
      (sum, l) => (l.inScope && l.annualPrice ? sum + Number(l.annualPrice) : sum),
      0
    );
    res.json({ ...customer, layers, annualValue });
  } catch (err) {
    next(err);
  }
});

// Stage change. The engine in server/lib/stageEngine.js runs all of spec
// section 10 in one transaction. A reason is required on any backward move,
// any forward move that skips a stage, and any forward move that leaves
// open checklist items for the current stage.
router.post("/:id/stage", requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid customer id" });
    }
    const { stage, reason } = req.body || {};
    if (!STAGE_ORDER.includes(stage)) {
      return res.status(400).json({ error: "Invalid stage" });
    }
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id));
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    if (customer.stage === stage) {
      return res
        .status(400)
        .json({ error: "Customer is already in that stage" });
    }
    const trimmedReason =
      typeof reason === "string" && reason.trim() ? reason.trim() : null;
    // The engine re-reads and locks the customer inside its transaction,
    // enforces the reason requirement there, and returns null when the
    // customer vanished or is already in the target stage.
    const updated = await changeStage({
      customerId: id,
      toStage: stage,
      reason: trimmedReason,
      authorUserId: req.user.id,
    });
    if (!updated) {
      return res
        .status(409)
        .json({ error: "Customer changed while processing, retry" });
    }
    res.json(updated);
  } catch (err) {
    if (err instanceof ReasonRequiredError) {
      return res.status(400).json({
        error: "A reason is required for this move",
        reasonRequired: true,
      });
    }
    next(err);
  }
});

// Stage preview. It validates the same input as the write route but only runs
// the shared read-only stage-engine calculation.
router.post("/:id/stage-preview", requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid customer id" });
    }
    const { stage } = req.body || {};
    if (!STAGE_ORDER.includes(stage)) {
      return res.status(400).json({ error: "Invalid stage" });
    }
    const preview = await previewStageChange({ customerId: id, toStage: stage });
    if (!preview) {
      const [customer] = await db
        .select()
        .from(customers)
        .where(eq(customers.id, id));
      return res.status(customer ? 400 : 404).json({
        error: customer
          ? "Customer is already in that stage"
          : "Customer not found",
      });
    }
    res.json(preview);
  } catch (err) {
    next(err);
  }
});

export default router;
