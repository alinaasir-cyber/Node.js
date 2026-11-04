require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");

const app = express();
const port = process.env.PORT || 3000;

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is required. Add it to your .env file.");
}

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET is required and must be at least 32 characters long.");
}

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "JWT role-based authentication API is running." });
});

app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found." });
});

app.use((err, _req, res, _next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ message: "Request body must be valid JSON." });
  }

  console.error(err);
  return res.status(500).json({ message: "An unexpected server error occurred." });
});

async function start() {
  await mongoose.connect(process.env.MONGODB_URI);
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

start().catch((err) => {
  console.error("Failed to start the API:", err);
  process.exitCode = 1;
});
