import "dotenv/config";

import app from "./app.js";
import env from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";

let server;

const shutdown = async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await disconnectDatabase();
  process.exit(0);
};

const start = async () => {
  await connectDatabase();
  server = app.listen(env.port, env.host, () => {
    console.log("HTTP server started", { port: env.port });
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

start().catch((error) => {
  console.error("Application startup failed", error);
  process.exit(1);
});
