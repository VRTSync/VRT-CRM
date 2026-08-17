import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { requireAuth, requireOwner } from "../auth.js";

const VALID_ROLES = ["sales", "mapping", "admin", "owner", null];

const router = Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const rows = await db.select().from(users).orderBy(users.name);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// One endpoint to set a user's role, callable only by an owner.
router.patch("/:id/role", requireAuth, requireOwner, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }
    const { role } = req.body || {};
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({
        error: "Role must be sales, mapping, admin, owner, or null",
      });
    }
    const updated = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, id))
      .returning();
    if (!updated[0]) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(updated[0]);
  } catch (err) {
    next(err);
  }
});

export default router;
