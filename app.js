// app.js
// 組裝 middleware 與路由

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

// [MODIFIED] 僅掛載新版 Multer Router；舊 routes/images.js 不再進入執行流程。
const imageRoutes = require("./backend/routes/image.routes");
const { errorHandler, notFoundHandler } = require("./backend/middlewares/error.middleware");

const app = express();

app.disable("x-powered-by");

// 1. 一般 Middleware
app.use(cors());
app.use(express.json({ limit: "100kb" }));

// 2. 靜態資源
app.use(express.static(path.join(__dirname, "public")));

const OUTPUT_DIR = path.resolve(process.env.OUTPUT_DIR || "./output");
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
app.use("/downloads", express.static(OUTPUT_DIR));

// 3. App Health Check
app.get("/health", (req, res) => {
  res.status(200).json({ success: true, status: "ok" });
});

// 4. 新版圖片 API
// GET  /api/images/health
// POST /api/images/inspect
// POST /api/images/process
app.use("/api/images", imageRoutes);

// 5. 所有正常路由之後才處理 404
app.use(notFoundHandler);

// 6. Error Handler 一定放最後
app.use(errorHandler);

module.exports = app;
