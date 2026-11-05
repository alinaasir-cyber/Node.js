import { env } from "../config/env.js";

export function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

export function errorHandler(error, req, res, next) {
  let statusCode = error.statusCode || 500;
  let message = error.message || "Internal server error";

  if (error.name === "ValidationError" || error.name === "CastError") {
    statusCode = 400;
    message = error.message;
  } else if (error.code === 11000) {
    statusCode = 409;
    message = "A record with that value already exists";
  } else if (error.name === "MulterError") {
    statusCode = 400;
    message = error.message;
  }

  if (statusCode >= 500) {
    console.error(error);
    if (env.NODE_ENV === "production") message = "Internal server error";
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(env.NODE_ENV !== "production" && error.stack ? { stack: error.stack } : {})
  });
}
