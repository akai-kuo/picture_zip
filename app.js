// app.js
// 組裝 middleware 與路由

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const imagesRouter = require("./routes/images");

const imageRoutes = require("./backend/routes/image.routes");
const { errorHandler, notFoundHandler } = require("./backend/middlewares/error.middleware");

const app = express();

app.disable("x-powered-by");

// ================================
// 1. 一般 Middleware
// ================================

// 跨網域請求支援
app.use(cors());

// 處理一般 JSON API 請求
// multipart/form-data 由 Multer 處理
app.use(
  express.json({
    limit: "100kb",
  })
);

// ================================
// 2. 靜態資源
// ================================

// 前台頁面
app.use(express.static(path.join(__dirname, "public")));

// 圖片輸出目錄
const OUTPUT_DIR = path.resolve(process.env.OUTPUT_DIR || "./output");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, {
    recursive: true,
  });
}

app.use("/downloads", express.static(OUTPUT_DIR));

// ================================
// 3. Health Check
// ================================

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
  });
});

// ================================
// 4. API Routes
// ================================

// 舊版圖片 API
app.use("/images", imagesRouter);

// 新版圖片 API
app.use("/api/images", imageRoutes);

// ================================
// 5. 404
// 必須放所有正常路由後面
// ================================

app.use(notFoundHandler);

// ================================
// 6. Error Handler
// 一定放最後
// ================================

app.use(errorHandler);

module.exports = app;
