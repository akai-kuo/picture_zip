# 圖片壓縮與轉檔工具

使用者可以上傳一張圖片，選擇要壓縮或轉成指定格式，系統處理後回傳新圖片，並顯示原始大小、處理後大小與節省比例。

## 技術棧

- Node.js + Express — API server
- multer — 接收檔案上傳
- sharp — 圖片壓縮、縮放、轉檔
- file-type — 以檔案真實二進位內容（magic number）驗證格式，不只信任副檔名
- dotenv — 管理環境變數
- cors — 跨網域請求支援

## 專案結構

```text
.
├─ src/
│  ├─ app.js
│  ├─ server.js
│  ├─ config/
│  │  ├─ image.config.js       # 檔案大小、允許格式、輸出預設值
│  │  └─ upload.config.js      # multer 設定
│  ├─ routes/image.routes.js
│  ├─ controllers/image.controller.js
│  ├─ middlewares/
│  ├─ services/                # 格式驗證、壓縮轉檔邏輯
│  └─ errors/
├─ public/                     # 前台頁面（index.html、style.css、frontend.js）
├─ storage/
│  ├─ output/                  # 處理後圖片
│  └─ temp/
├─ tests/fixtures/
├─ docs/                       # ARCHITECTURE.md、API.md、DEMO_SCRIPT.md
├─ .env.example
├─ package.json
└─ README.md
```

詳細架構見 `docs/ARCHITECTURE.md`，API 規格見 `docs/API.md`，Demo 流程見 `docs/DEMO_SCRIPT.md`。

## 安裝與啟動

```bash
npm install
npm run dev
```

預設服務：`http://localhost:3000`

## 環境變數說明（.env）

```
PORT=3000                     # 伺服器埠號，預設 3000
OUTPUT_DIR=./storage/output    # 處理結果目錄
NODE_ENV=development
```

## API

### GET /health

```json
{ "success": true, "status": "ok" }
```

### POST /api/images/process

`multipart/form-data`：

| 欄位 | 類型 | 必填 | 說明 |
|---|---|---|---|
| `image` | file | ✅ | 上傳的圖片（支援 JPG / PNG / WebP，限 15MB） |
| `format` | string | 否 | 輸出格式，預設 `webp`，可選 `jpeg` / `png` / `webp` |
| `quality` | number | 否 | 壓縮品質，1-100，預設 `80` |
| `maxWidth` | number | 否 | 最大寬度，超過才縮小，最大 12000 |

成功回應範例：

```json
{
  "success": true,
  "data": {
    "original": {
      "originalName": "photo.jpg",
      "format": "jpeg",
      "width": 800,
      "height": 600,
      "sizeBytes": 204800
    },
    "output": {
      "filename": "1af434c1-701d-4fd1-ba95-9261f6c2aa14.webp",
      "originalSize": 204800,
      "outputSize": 61440,
      "savedBytes": 143360,
      "savedPercent": 70.0,
      "sizeChanged": "decreased",
      "format": "webp",
      "previewUrl": "/downloads/1af434c1-701d-4fd1-ba95-9261f6c2aa14.webp",
      "downloadUrl": "/downloads/1af434c1-701d-4fd1-ba95-9261f6c2aa14.webp"
    }
  }
}
```

`savedPercent` 公式：`(1 - outputSize / originalSize) * 100`
`sizeChanged` 標示壓縮後大小變化：`decreased`（變小）/ `increased`（反而變大）/ `unchanged`（不變）

錯誤回應範例：

```json
{
  "success": false,
  "error": { "code": "FILE_TOO_LARGE", "message": "上傳圖片超過檔案大小限制。" }
}
```

測試指令：

```bash
curl -X POST http://localhost:3000/api/images/process \
  -F "image=@./tests/fixtures/sample.jpg" -F "format=webp" -F "quality=80"
```

## 常見錯誤

| 情境 | 狀態碼 | 錯誤代碼（error.code） | 錯誤訊息（error.message） |
|---|---|---|---|
| 沒有上傳圖片 | 400 | `FILE_REQUIRED` | 請上傳一張圖片。 |
| 圖片內容為空 | 400 | `EMPTY_FILE` | 上傳的圖片內容為空。 |
| 上傳格式不支援（MIME 層級） | 400 | `UNSUPPORTED_CLIENT_MIME_TYPE` | 僅支援 JPEG、PNG、WebP 與 AVIF 圖片。 |
| 無法辨識檔案真實格式 | 415 | `UNKNOWN_FILE_TYPE` | 無法辨識上傳檔案的真實格式。 |
| 上傳格式不支援（實際內容層級） | 415 | `UNSUPPORTED_IMAGE_FORMAT` | 目前僅支援 JPEG、PNG、WebP 與 AVIF。 |
| 檔案超過 15MB | 413 | `FILE_TOO_LARGE` | 上傳圖片超過檔案大小限制。 |
| 圖片寬高超過上限 | 413 | `IMAGE_DIMENSIONS_TOO_LARGE` | 圖片寬高不得超過 12000 × 12000 像素。 |
| 圖片已損壞或無法解析 | 422 | `INVALID_IMAGE_FILE` | 圖片已損壞、內容不完整或尺寸超出限制。 |
| 動畫 / 多頁圖片 | 422 | `ANIMATED_IMAGE_NOT_SUPPORTED` | 目前不支援動畫或多頁圖片。 |
| 輸出格式不支援 | 400 | `INVALID_OUTPUT_FORMAT` | 輸出格式僅支援 jpeg、png、webp、avif。 |
| quality 超出範圍 | 400 | `INVALID_QUALITY_VALUE` | 圖片品質必須是 1 到 100 之間的整數。 |
| maxWidth 超出範圍 | 400 | `INVALID_MAX_WIDTH` | maxWidth 必須是 1 到 12000 之間的整數。 |
| 圖片處理失敗 | 500 | `IMAGE_PROCESSING_FAILED` | 圖片處理失敗，請稍後再試。 |

## 產品用心點

### 批次上傳體驗（主打）

大部分同類工具一次只能處理一張圖，但使用者常見的情境是「我有一整個資料夾的圖要壓縮」，一張一張上傳很浪費時間。我們讓使用者一次最多選 20 張圖，每張圖獨立顯示處理狀態（等待中 / 處理中 / 完成 / 失敗），就算其中幾張失敗，也不會影響其他張的處理，最後還會統計「這批圖總共省下多少空間」。

每張圖失敗的原因也會用清楚的中文訊息呈現，讓使用者不需要懂技術也知道下一步該怎麼做。

### 免存檔的貼上上傳（次要亮點）

使用者常見的情境是螢幕截圖後想直接壓縮，但要先存成檔案才能上傳。我們支援直接 `Ctrl+V` 貼上剪貼簿裡的圖片，省去存檔這一步。

### 只縮小、不放大

使用者設定 `maxWidth` 後，我們只在原圖「比 `maxWidth` 寬」時才縮小；如果原圖本來就比 `maxWidth` 窄，就維持原尺寸，只做壓縮不做放大處理，避免放大導致畫質變差。

## AI 協作說明

- 使用工具：ChatGPT Codex、Claude
- 加速的地方：協助規劃 API route 架構、查 `multer` / `sharp` 用法、整理 README 範例及 Demo Script 檔案文件的內容架構和設計；最主要是請 AI 協助對接前端和後端功能、進行 Debug 除錯，並依照 README 裡規劃的內容，逐一設計對應的路由 API
- 小組自己的判斷：以圖片上傳功能層面，決定使用 multer 套件而非 formidable 套件去優化程式邏輯，最後決定最大可上傳檔案為 15MB 而非 5MB，以及一次可上傳檔案為 20 個檔案，藉此優化使用者體驗
- 最有幫助的 prompt：請 AI 協助將各組員負責各功能的程式碼對接，並以 sharp 套件為基準，依序將圖片上傳、API 串接和設計整合至前端程式碼，以確保程式碼盡可能不大幅度改變的情況下，保持程式碼架構和功能運作正常
