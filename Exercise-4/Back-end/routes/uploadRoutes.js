import { Router } from "express";
import multer from "multer";
import { uploadProfilePicture } from "../controllers/uploadController.js";
import { requireAuth } from "../middleware/auth.js";
import { AppError } from "../utils/AppError.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(req, file, callback) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      return callback(new AppError("Only JPEG, PNG, and WebP images are allowed", 400));
    }
    return callback(null, true);
  }
});

router.post("/profile-picture", requireAuth, upload.single("image"), uploadProfilePicture);

export default router;
