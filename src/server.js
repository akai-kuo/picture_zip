require("dotenv").config();
const app = require("./app");

const PORT = Number(process.env.PORT) || 3000;

const HOST = "0.0.0.0";

const server = app.listen(PORT, HOST, () => {
  console.log(`✅ Server running on ${HOST}:${PORT}`);
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down.`);

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
