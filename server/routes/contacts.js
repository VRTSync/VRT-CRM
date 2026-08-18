import { Router } from "express";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { contacts } from "../db/schema.js";
import { requireAuth } from "../auth.js";

const router = Router();

// All contacts for a customer. Primary contacts first, then by name.
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const customerId = Number(req.query.customerId);
    if (!Number.isInteger(customerId)) {
      return res.status(400).json({ error: "customerId is required" });
    }
    const rows = await db
      .select()
      .from(contacts)
      .where(eq(contacts.customerId, customerId))
      .orderBy(desc(contacts.isPrimary), asc(contacts.name));
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
