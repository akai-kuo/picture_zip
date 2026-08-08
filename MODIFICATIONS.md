# 新版 Multer 圖片流程修改紀錄

## 1. app.js
- 移除舊版 `./routes/images` Router 的掛載。
- 目前圖片 API 統一掛在 `/api/images`。
- 保留 `/health` 作為整個 App 的 health check。
- 404 handler 放在所有正常 Router 後面。
- error handler 維持最後一層。

目前路由：
- `GET /health`
- `GET /api/images/health`
- `POST /api/images/inspect`
- `POST /api/images/process`

## 2. backend/routes/image.routes.js
- 新增 `GET /health`，可確認新版 Router 已掛載。
- 啟用 `POST /inspect`：只驗證圖片。
- 啟用 `POST /process`：完整圖片處理流程。
- `/inspect` 與 `/process` 都會依序經過：
  1. Multer memoryStorage
  2. fileFilter
  3. Magic Number 驗證
  4. Sharp metadata 驗證
  5. Controller

## 3. backend/controllers/image.controller.js
- 保留 `inspectImage`。
- 新增 `processImage`。
- `processImage` 將 `req.file.buffer`、`req.imageInfo`、`format / quality / maxWidth` 交給圖片處理 Service。

## 4. backend/services/image-processing.service.js（新增）
- 將舊 Router 中的 Sharp 壓縮/轉檔邏輯抽離成 Service。
- 支援 jpeg / png / webp / avif。
- quality 預設 80，限制 1~100。
- maxWidth 選填，限制 1~12000，且不放大原圖。
- JPEG 遇到透明背景時自動鋪白底。
- 使用 `crypto.randomUUID()` 產生輸出檔名。
- 計算 originalSize / outputSize / savedBytes / savedPercent / sizeChanged。
- 失敗時清除可能產生的不完整輸出檔。

## 5. backend/services/image-validation.service.js
- 修正 `AppError` 匯入方式：原本使用 `{ AppError }`，但模組實際是直接 export class。
- 修正 `file-type v22` 與 CommonJS 相容性：改成 `dynamic import()`。
- 維持三層驗證：client MIME → Magic Number → Sharp decoder。
- 維持尺寸與 50MP 像素限制。

## 6. backend/middlewares/error.middleware.js
- 修正 `AppError` 匯入方式。
- 統一輸出：`{ success: false, error: { code, message } }`。
- 保留 Multer 各種錯誤映射。

## 7. public/frontend.js
- API 路徑由 `/images/process` 改為 `/api/images/process`。
- 前端成功判斷由舊格式 `json.status` 改為 `json.success`。
- 錯誤訊息改讀 `json.error.message`。
- 成功資料改讀 `json.data.output`。

## 8. 舊版 routes/images.js
- 檔案暫時保留做為參考，但 `app.js` 已不再 require / mount，因此不會執行。
- 建議新版流程確認穩定後再正式刪除。

## 9. API 回應格式
### 成功
```json
{
  "success": true,
  "data": {
    "original": {},
    "output": {}
  }
}
```

### 失敗
```json
{
  "success": false,
  "error": {
    "code": "...",
    "message": "..."
  }
}
```

## 10. 驗證狀態與本機測試方式
本次已使用 `node --check` 對所有修改過的 JavaScript 檔案做語法檢查，結果通過。

此壓縮包未包含 `node_modules`，目前執行環境也無法從套件來源補齊依賴，因此未能在此環境真正啟動 Express 進行 HTTP 端對端測試。你在本機既有開發環境可依序測試：

```bash
npm install
npm run dev
```

接著：

```bash
curl.exe -i http://localhost:3000/health
curl.exe -i http://localhost:3000/api/images/health
curl.exe -i -X POST http://localhost:3000/api/images/inspect -F "image=@./218723.jpg"
curl.exe -i -X POST http://localhost:3000/api/images/process -F "image=@./218723.jpg" -F "format=webp" -F "quality=80"
```

預期前兩個 health check 為 HTTP 200；`/api/images/health` 回傳中會包含 `"router": "new-image-router"`。

## 11. package.json 中的 formidable
- 舊 Router 已經不再掛載，所以 `formidable` 在新版執行流程中不再使用。
- 為避免在無法正常存取 npm registry 的工作環境中修改 lockfile 造成依賴不一致，本次保留 `formidable` dependency。
- 你確認新版流程正常後，可在本機執行 `npm uninstall formidable` 清理舊依賴。
