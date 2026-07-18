// routes/images.js
// 圖片上傳、壓縮、轉檔的路由與邏輯（對應 README 的 /images/health、/images/process）

const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { formidable } = require('formidable');
const sharp = require('sharp');

const router = express.Router();

// ---- 環境設定（對應 .env 的 UPLOAD_DIR / OUTPUT_DIR / MAX_FILE_SIZE_MB） ----
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || './uploads');
const OUTPUT_DIR = path.resolve(process.env.OUTPUT_DIR || './output');
const MAX_FILE_SIZE_MB = Number(process.env.MAX_FILE_SIZE_MB) || 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// 啟動時確保暫存區 / 輸出區存在，避免 formidable、sharp 寫檔時找不到資料夾
[UPLOAD_DIR, OUTPUT_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// README：支援 JPG / PNG / WebP 上傳；輸出格式可選 jpeg / png / webp
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_OUTPUT_FORMATS = ['jpeg', 'png', 'webp'];

// 統一回應格式（README 草案）：{ status, data, message }
function sendSuccess(res, data, message = '圖片處理成功') {
  return res.status(200).json({ status: 'success', data, message });
}
function sendError(res, statusCode, message) {
  return res.status(statusCode).json({ status: 'error', data: null, message });
}

// formidable 的欄位在某些情況下會是陣列（例如同名欄位出現多次），統一取第一個值
function firstValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

// 處理完就刪除暫存檔，忽略刪除失敗（檔案可能已經不存在）
function removeTempFile(filepath) {
  if (filepath) fs.unlink(filepath, () => {});
}

/**
 * GET /images/health
 * 確認服務是否正常啟動
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'image-optimizer' });
});

/**
 * POST /images/process
 * 上傳一張圖片，依照 format / quality / maxWidth 壓縮或轉檔，回傳處理結果
 */
router.post('/process', async (req, res) => {
  let tempFilePath = null;

  try {
    // 1. 用 formidable 解析 multipart/form-data
    const form = formidable({
      uploadDir: UPLOAD_DIR,
      keepExtensions: true,
      maxFileSize: MAX_FILE_SIZE_BYTES, // 超過會直接在 form.parse 階段丟出錯誤，於 catch 統一處理
    });
    const [fields, files] = await form.parse(req);

    const imageFile = firstValue(files.image);

    // 2. 沒有上傳圖片
    if (!imageFile) {
      return sendError(res, 400, '請上傳圖片');
    }
    tempFilePath = imageFile.filepath;

    // 3. 檔案格式必須是圖片（JPG / PNG / WebP）
    if (!ALLOWED_MIME_TYPES.includes(imageFile.mimetype)) {
      removeTempFile(tempFilePath);
      return sendError(res, 400, '只支援圖片檔案');
    }

    // 4. 保險再檢查一次檔案大小（formidable 理論上已經在 maxFileSize 擋掉）
    if (imageFile.size > MAX_FILE_SIZE_BYTES) {
      removeTempFile(tempFilePath);
      return sendError(res, 413, '圖片太大，請上傳較小的檔案');
    }

    // 5. 解析參數：format 預設 webp，quality 預設 80
    const format = firstValue(fields.format) || 'webp';
    if (!ALLOWED_OUTPUT_FORMATS.includes(format)) {
      removeTempFile(tempFilePath);
      return sendError(res, 400, '只支援輸出 jpeg / png / webp 格式');
    }

    const qualityRaw = firstValue(fields.quality);
    const quality = qualityRaw !== undefined && qualityRaw !== '' ? Number(qualityRaw) : 80;
    if (!Number.isFinite(quality) || quality < 1 || quality > 100) {
      removeTempFile(tempFilePath);
      return sendError(res, 400, '品質請輸入 1 到 100');
    }

    // maxWidth 為選填，沒帶就不做縮放
    const maxWidthRaw = firstValue(fields.maxWidth);
    let maxWidth = null;
    if (maxWidthRaw !== undefined && maxWidthRaw !== '') {
      maxWidth = Number(maxWidthRaw);
      if (!Number.isInteger(maxWidth) || maxWidth <= 0) {
        removeTempFile(tempFilePath);
        return sendError(res, 400, 'maxWidth 必須是正整數');
      }
    }

    // 6. 用 Sharp 壓縮 / 轉檔 / 縮放
    const originalSize = imageFile.size;
    const outputFilename = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${format}`;
    const outputPath = path.join(OUTPUT_DIR, outputFilename);

    let pipeline = sharp(tempFilePath);

    if (maxWidth) {
      // withoutEnlargement：原圖比 maxWidth 小時不放大，只單純縮小過大的圖
      pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true });
    }

    await pipeline.toFormat(format, { quality }).toFile(outputPath);

    // 7. 清除 formidable 的上傳暫存檔
    removeTempFile(tempFilePath);

    // 8. 計算節省比例並回傳統一格式的成功結果
    const outputSize = fs.statSync(outputPath).size;
    const savedPercent = Number(((1 - outputSize / originalSize) * 100).toFixed(1));

    return sendSuccess(res, {
      filename: outputFilename,
      originalSize,
      outputSize,
      savedPercent,
      format,
      previewUrl: `/downloads/${outputFilename}`,
      downloadUrl: `/downloads/${outputFilename}`,
    });
  } catch (err) {
    removeTempFile(tempFilePath);

    // formidable 超過 maxFileSize 時會丟出 code 1009 / httpCode 413 的錯誤
    if (err && (err.code === 1009 || err.httpCode === 413)) {
      return sendError(res, 413, '圖片太大，請上傳較小的檔案');
    }

    console.error('[POST /images/process] 圖片處理失敗:', err);
    return sendError(res, 500, '圖片處理失敗，請稍後再試');
  }
});

module.exports = router;
