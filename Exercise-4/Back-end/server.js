import app from "./app.js";
import { closeDatabase, connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";

let server;

async function start() {
  await connectDatabase();
  server = app.listen(env.PORT, () => {
    console.log(`API listening on port ${env.PORT}`);
  });
}

async function shutdown(signal) {
  console.log(`${signal} received; shutting down`);
  if (server) {
    server.close(async (error) => {
      if (error) {
        console.error("HTTP server shutdown failed", error);
        process.exitCode = 1;
      }
      await closeDatabase();
    });
  } else {
    await closeDatabase();
    process.exitCode = 1;
  }
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

start().catch((error) => {
  console.error("API startup failed", error);
  process.exitCode = 1;
});
