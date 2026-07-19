# 圖片壓縮與轉檔工具

使用者上傳一張圖片，選擇要壓縮或轉成指定格式，系統處理後回傳新圖片，並顯示原始大小、處理後大小與節省比例。

## 技術棧

- Node.js + Express — API server
- multer — 接收檔案上傳
- sharp — 圖片壓縮、縮放、轉檔
- dotenv — 管理環境變數
- cors — 跨網域請求支援

## 安裝

```bash
npm install
```

## 啟動

```bash
# 複製環境變數設定檔
cp .env.example .env

# 開發模式（檔案變更自動重啟）
npm run dev

# 一般模式
npm start
```

啟動後開瀏覽器輸入 `http://localhost:3000`

> ⚠️ 請直接在網址列輸入，不要用「開啟檔案」的方式打開 `index.html`，否則前端會找不到後端 API。

## 專案結構

```
image-optimizer/
├── server.js           # 啟動伺服器
├── app.js              # 組裝 middleware 與路由
├── routes/
│   └── images.js       # 圖片上傳、壓縮、轉檔的路由與邏輯
├── public/
│   └── index.html      # 前台操作頁面
├── uploads/            # multer 暫存區（處理完自動刪除）
├── output/             # 處理完成的圖片
└── .env.example        # 環境變數範本
```

## 環境變數說明（.env） 待其他組員完成，以下為暫定

```
PORT=3000                 # 伺服器埠號，預設 3000
UPLOAD_DIR=./uploads      # 上傳暫存目錄
OUTPUT_DIR=./output       # 處理結果目錄
MAX_FILE_SIZE_MB=5        # 最大上傳檔案大小（MB），預設 5
```

## API

### GET /images/health

確認服務是否正常啟動。

```bash
curl http://localhost:3000/images/health
```

回應：

```json
{
  "status": "ok",
  "service": "image-optimizer"
}
```

---

### POST /images/process

上傳圖片並進行壓縮或轉檔，使用 `multipart/form-data`。

| 欄位 | 類型 | 必填 | 說明 |
|---|---|---|---|
| `image` | file | ✅ | 上傳的圖片（支援 JPG / PNG / WebP / AVIF，限 15MB） |
| `format` | string | ❌ | 輸出格式，預設 `webp`，可選 `jpeg` / `png` |
| `quality` | number | ❌ | 壓縮品質 1-100，預設 `80` |
| `maxWidth` | number | ❌ | 最大寬度（px），原圖較小時不會放大 |

**測試一條主流程（curl）：**

```bash
curl -X POST http://localhost:3000/images/process \
  -F "image=@你的圖片.jpg" \
  -F "format=webp" \
  -F "quality=70"
```

> ⚠️ **回應格式（草案，待後端確認）**：目前統一包成 `{ status, data, message }`，尚未跟負責後端的組員對過，實作進度確認後可能會調整，請以最新版本為準。

成功回應範例：

```json
{
  "status": "success",
  "data": {
    "filename": "1719999999999-a1b2c3d4.webp",
    "originalSize": 204800,
    "outputSize": 61440,
    "savedPercent": 70.0,
    "format": "webp",
    "previewUrl": "/downloads/1719999999999-a1b2c3d4.webp",
    "downloadUrl": "/downloads/1719999999999-a1b2c3d4.webp"
  },
  "message": "圖片處理成功"
}
```

`savedPercent` 公式：`(1 - 處理後大小 / 原始大小) * 100`

錯誤回應範例：

```json
{
  "status": "error",
  "data": null,
  "message": "圖片太大，請上傳較小的檔案"
}
```

## 常見錯誤

> ⚠️ 以下「檔案大小」「格式驗證」相關的錯誤（前 4 項）已對照負責上傳驗證的組員實際程式碼確認；「品質」「maxWidth」「圖片處理失敗」屬於壓縮功能，該功能尚未實作，數值待確認。

| 情境 | 狀態碼 | 錯誤代碼（error.code） | 錯誤訊息（error.message） |
|---|---|---|---|
| 沒有上傳圖片 | 400 | `FILE_REQUIRED` | 請上傳一張圖片。 |
| 上傳格式不支援（副檔名/MIME 層級） | 400 | `UNSUPPORTED_CLIENT_MIME_TYPE` | 僅支援 JPEG、PNG、WebP 與 AVIF 圖片。 |
| 上傳格式不支援（實際二進位內容層級） | 415 | `UNSUPPORTED_IMAGE_FORMAT` | 目前僅支援 JPEG、PNG、WebP 與 AVIF。 |
| 檔案超過 15MB | 413 | `FILE_TOO_LARGE` | 上傳圖片超過檔案大小限制。 |
| quality 超出 1-100 | 400 | 待確認 | 品質請輸入 1 到 100（壓縮功能尚未實作） |
| maxWidth 非正整數 | 400 | 待確認 | maxWidth 必須是正整數（壓縮功能尚未實作） |
| 圖片處理失敗 | 500 | 待確認 | 圖片處理失敗，請稍後再試（壓縮功能尚未實作） |

> 回應格式已對照上傳驗證層實際程式碼確認：成功 `{ success: true, data: {...} }`，失敗 `{ success: false, error: { code, message } }`。

## 產品用心點

### 批次上傳體驗（主打）

大部分同類工具一次只能處理一張圖，但使用者常見的情境是「我有一整個資料夾的圖要壓縮」，一張一張上傳很浪費時間。我們讓使用者一次最多選 20 張圖，每張圖獨立顯示處理狀態（等待中 / 處理中 / 完成 / 失敗），就算其中幾張失敗（例如格式不對），也不會影響其他張的處理，最後還會統計「這批圖總共省下多少空間」。

這個設計背後的重點是：批次操作不代表使用者要失去對「單張圖片狀態」的掌握。每張圖失敗的原因也會用清楚的中文訊息呈現（例如「圖片太大，請上傳較小的檔案」而不是系統丟出的技術性錯誤代碼），讓使用者不需要懂技術也知道下一步該怎麼做。

### 免存檔的貼上上傳（次要亮點）

使用者常見的情境是螢幕截圖後想直接壓縮，但要先存成檔案才能上傳，多了一個不必要的步驟。我們支援直接 `Ctrl+V` 貼上剪貼簿裡的圖片，省去存檔這一步。這是一個小細節，但反映我們在設計時有站在「使用者實際會怎麼用」的角度想，而不是只滿足規格書上寫的功能。

## AI 協作說明

> 請小組依照實際情況填寫以下內容：

- **使用的 AI 服務**： Claude
- **AI 加速了哪些環節**： 專案架構規劃、前端網路頁面設計與架構、錯誤處理邏輯
- **小組自己判斷的地方**：（例如：選擇 multer 而非 formidable、資料夾結構的調整、前台 UI 設計）
- **最有幫助的一次對話**：（用一句話描述）
