import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { findUserById } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const requireAuth = asyncHandler(async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    throw new AppError("A Bearer token is required", 401);
  }

  let payload;
  try {
    payload = jwt.verify(authorization.slice(7), env.JWT_SECRET);
  } catch {
    throw new AppError("Invalid or expired token", 401);
  }

  const user = await findUserById(payload.sub);
  if (!user) {
    throw new AppError("The account for this token no longer exists", 401);
  }

  req.user = user;
  next();
});

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return next(new AppError("Admin access is required", 403));
  }
  return next();
}
