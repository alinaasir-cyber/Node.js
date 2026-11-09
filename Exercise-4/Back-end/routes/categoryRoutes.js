import { Router } from "express";
import { listCategories } from "../controllers/categoryController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, listCategories);

export default router;
