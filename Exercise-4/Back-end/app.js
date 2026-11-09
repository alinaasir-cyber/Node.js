import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env.js";
import { openApiSpec } from "./docs/openapi.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { AppError } from "./utils/AppError.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import financeRoutes from "./routes/financeRoutes.js";

const app = express();
const allowedOrigins = env.CLIENT_ORIGIN.split(",").map((origin) => origin.trim());
const frontendDirectory = fileURLToPath(new URL("../Front-end/dist", import.meta.url));
const frontendEntry = path.join(frontendDirectory, "index.html");

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new AppError("Origin is not allowed by CORS", 403));
  }
}));
app.use(express.json({ limit: "1.1mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: "draft-7", legacyHeaders: false }));
app.use("/api/v1/auth", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false
}));

app.get("/health", (req, res) => res.json({ success: true, status: "ok" }));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1", financeRoutes);
app.use("/api/v1/transactions", transactionRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/upload", uploadRoutes);
app.use("/api/v1/admin", adminRoutes);
if (env.NODE_ENV === "production") {
  app.use(express.static(frontendDirectory));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(frontendEntry, (error) => {
      if (error) next(error);
    });
  });
}
app.use(notFound);
app.use(errorHandler);

export default app;
