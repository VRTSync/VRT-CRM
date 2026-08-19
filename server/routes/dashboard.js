import { Router } from "express";
import { requireAuth } from "../auth.js";
import { getDashboardData } from "../lib/dashboard.js";

const router = Router();

router.get("/", requireAuth, async (req, res, next) => {
  try {
    res.json(await getDashboardData(req.user.id));
  } catch (err) {
    next(err);
  }
});

export default router;