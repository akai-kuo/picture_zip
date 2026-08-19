require("dotenv").config();
const app = require("./app");

const { startOutputCleanup, stopOutputCleanup } = require("./services/output-cleanup.service");

const PORT = Number(process.env.PORT) || 3000;

const HOST = "0.0.0.0";

const server = app.listen(PORT, HOST, () => {
  console.log(`✅ Server running on ${HOST}:${PORT}`);

  // Express 啟動成功後啟動 TTL Cleanup。
  startOutputCleanup();
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down.`);
  stopOutputCleanup();

  server.close((error) => {
    if (error) {
      console.error(error);
      process.exit(1);
    }
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
