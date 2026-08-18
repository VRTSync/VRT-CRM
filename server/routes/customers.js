import { Router } from "express";
import { eq, max, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { customers, customerLayers, notes } from "../db/schema.js";
import { requireAuth } from "../auth.js";

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

export default router;
