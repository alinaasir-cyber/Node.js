import { Router } from "express";
import { getAdminOverview } from "../controllers/adminController.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/overview", requireAuth, requireAdmin, getAdminOverview);

export default router;
