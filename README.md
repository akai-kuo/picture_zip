# 圖片壓縮與轉檔工具

Node.js + Express + Multer + Sharp 圖片處理工具。使用者可上傳單張 JPEG、PNG、WebP 或 AVIF，檢查圖片、壓縮／轉檔，並取得處理後圖片及容量變化。

## 專案結構

```text
.
├─ src/
│  ├─ app.js
│  ├─ server.js
│  ├─ config/
│  │  ├─ image.config.js
│  │  └─ upload.config.js
│  ├─ routes/image.routes.js
│  ├─ controllers/image.controller.js
│  ├─ middlewares/
│  ├─ services/
│  └─ errors/
├─ public/
├─ storage/
│  ├─ output/
│  └─ temp/
├─ tests/fixtures/
├─ docs/
├─ .env.example
├─ package.json
└─ README.md
```

詳細流程見 `docs/ARCHITECTURE.md`，API 規格見 `docs/API.md`，本次整理內容見 `REFACTORING.md`。

## 安裝與啟動

```bash
npm install
npm run dev
```

預設服務：`http://localhost:3000`

## Health Check

```text
GET /health
GET /api/images/health
```

新版 Router 正常時 `/api/images/health` 會回傳：

```json
{
  "success": true,
  "status": "ok",
  "router": "new-image-router"
}
```

## Inspect

```bash
curl.exe -X POST http://localhost:3000/api/images/inspect -F "image=@./tests/fixtures/sample.jpg"
```

## Process

```bash
curl.exe -X POST http://localhost:3000/api/images/process -F "image=@./tests/fixtures/sample.jpg" -F "format=webp" -F "quality=80"
```

輸出圖片會寫入 `storage/output/`，並透過 `/downloads/<filename>` 提供預覽／下載。
