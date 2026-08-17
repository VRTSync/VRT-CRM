import { Router } from "express";
import { db } from "../db/index.js";
import { customers } from "../db/schema.js";
import { requireAuth } from "../auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const rows = await db.select().from(customers).orderBy(customers.name);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
