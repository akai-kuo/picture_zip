// app.js
// 組裝 middleware 與路由

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const imagesRouter = require('./routes/images');

const app = express();

// 跨網域請求支援
app.use(cors());

// 前台操作頁面（public/index.html、frontend.js、style.css）
app.use(express.static(path.join(__dirname, 'public')));

// 處理完成的圖片下載 / 預覽，對應 /images/process 回傳的 previewUrl、downloadUrl
const OUTPUT_DIR = path.resolve(process.env.OUTPUT_DIR || './output');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
app.use('/downloads', express.static(OUTPUT_DIR));

// 圖片相關 API：GET /images/health、POST /images/process
app.use('/images', imagesRouter);

// 404：找不到路徑
app.use((req, res) => {
  res.status(404).json({ status: 'error', data: null, message: '找不到這個路徑' });
});

// 統一錯誤處理（例如 formidable 在 multipart 解析階段丟出的錯誤）
app.use((err, req, res, next) => {
  console.error(err);
  const statusCode = err.httpCode || 500;
  const message = statusCode === 413 ? '圖片太大，請上傳較小的檔案' : '伺服器發生錯誤';
  res.status(statusCode).json({ status: 'error', data: null, message });
});

module.exports = app;
