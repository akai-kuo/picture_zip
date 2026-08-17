const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const imageRoutes = require("./routes/image.routes");
const imageConfig = require("./config/image.config");
const { errorHandler, notFoundHandler } = require("./middlewares/error.middleware");

const app = express();

app.disable("x-powered-by");

// 1. Global middleware
const allowedOrigins = [
  process.env.FRONTEND_ORIGIN,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // curl / Postman / server-to-server
      // 通常沒有 Origin header
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      const error = new Error("Not allowed by CORS");

      error.statusCode = 403;

      return callback(error);
    },

    methods: ["GET", "POST", "OPTIONS"],

    allowedHeaders: ["Content-Type"],
  })
);
app.use(express.json({ limit: "100kb" }));

// 2. Frontend static files
app.use(express.static(path.join(__dirname, "..", "public")));

// 3. Processed image output
if (!fs.existsSync(imageConfig.output.dir)) {
  fs.mkdirSync(imageConfig.output.dir, { recursive: true });
}
app.use("/downloads", express.static(imageConfig.output.dir));

// 4. Health check
app.get("/health", (req, res) => {
  res.status(200).json({ success: true, status: "ok" });
});

// 5. Image API
app.use("/api/images", imageRoutes);

// 6. 404 and centralized error handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
