const sharp = require("sharp");
const AppError = require("../errors/app-error");

const allowedDetectedTypes = new Map([
  ["image/jpeg", "jpeg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
]);

const MAX_WIDTH = 12_000;
const MAX_HEIGHT = 12_000;
const MAX_PIXELS = 50_000_000;

// file-type v22 是 ESM 套件；本專案是 CommonJS，因此使用 dynamic import。
let fileTypeModulePromise;
function getFileTypeModule() {
  if (!fileTypeModulePromise) {
    fileTypeModulePromise = import("file-type");
  }
  return fileTypeModulePromise;
}

async function inspectAndValidateImage(file) {
  if (!file) {
    throw new AppError({
      statusCode: 400,
      code: "FILE_REQUIRED",
      message: "請上傳一張圖片。",
    });
  }

  if (!Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
    throw new AppError({
      statusCode: 400,
      code: "EMPTY_FILE",
      message: "上傳的圖片內容為空。",
    });
  }

  // 第二層驗證：依 Magic Number 判斷真實檔案格式，不只信任副檔名與 client MIME。
  const { fileTypeFromBuffer } = await getFileTypeModule();
  const detectedType = await fileTypeFromBuffer(file.buffer);

  if (!detectedType) {
    throw new AppError({
      statusCode: 415,
      code: "UNKNOWN_FILE_TYPE",
      message: "無法辨識上傳檔案的真實格式。",
    });
  }

  const detectedFormat = allowedDetectedTypes.get(detectedType.mime);

  if (!detectedFormat) {
    throw new AppError({
      statusCode: 415,
      code: "UNSUPPORTED_IMAGE_FORMAT",
      message: "目前僅支援 JPEG、PNG、WebP 與 AVIF。",
      details: {
        detectedMimeType: detectedType.mime,
        detectedExtension: detectedType.ext,
      },
    });
  }

  const mimeTypeMismatch = file.mimetype !== detectedType.mime;
  let metadata;

  try {
    // 第三層驗證：讓真正的圖片解碼器解析，並限制總像素數。
    metadata = await sharp(file.buffer, {
      failOn: "warning",
      limitInputPixels: MAX_PIXELS,
      sequentialRead: true,
      pages: 1,
    }).metadata();
  } catch (error) {
    throw new AppError({
      statusCode: 422,
      code: "INVALID_IMAGE_FILE",
      message: "圖片已損壞、內容不完整或尺寸超出限制。",
      details:
        process.env.NODE_ENV === "development"
          ? { reason: error.message }
          : undefined,
    });
  }

  if (!metadata.width || !metadata.height || !metadata.format) {
    throw new AppError({
      statusCode: 422,
      code: "INVALID_IMAGE_METADATA",
      message: "無法取得有效的圖片尺寸或格式資訊。",
    });
  }

  const totalPixels = metadata.width * metadata.height;

  if (metadata.width > MAX_WIDTH || metadata.height > MAX_HEIGHT) {
    throw new AppError({
      statusCode: 413,
      code: "IMAGE_DIMENSIONS_TOO_LARGE",
      message: `圖片寬高不得超過 ${MAX_WIDTH} × ${MAX_HEIGHT} 像素。`,
      details: { width: metadata.width, height: metadata.height },
    });
  }

  if (totalPixels > MAX_PIXELS) {
    throw new AppError({
      statusCode: 413,
      code: "IMAGE_PIXEL_COUNT_TOO_LARGE",
      message: "圖片總像素數超過允許上限。",
      details: {
        width: metadata.width,
        height: metadata.height,
        totalPixels,
        maxPixels: MAX_PIXELS,
      },
    });
  }

  if (metadata.format !== detectedFormat) {
    throw new AppError({
      statusCode: 422,
      code: "IMAGE_FORMAT_MISMATCH",
      message: "檔案格式驗證結果不一致，無法處理此圖片。",
      details: {
        magicNumberFormat: detectedFormat,
        decoderFormat: metadata.format,
      },
    });
  }

  const pageCount = metadata.pages ?? 1;
  if (pageCount > 1) {
    throw new AppError({
      statusCode: 422,
      code: "ANIMATED_IMAGE_NOT_SUPPORTED",
      message: "目前不支援動畫或多頁圖片。",
      details: { pages: pageCount },
    });
  }

  return {
    originalName: sanitizeDisplayFileName(file.originalname),
    clientMimeType: file.mimetype,
    detectedMimeType: detectedType.mime,
    detectedExtension: detectedType.ext,
    mimeTypeMismatch,
    format: metadata.format,
    width: metadata.width,
    height: metadata.height,
    totalPixels,
    channels: metadata.channels,
    hasAlpha: Boolean(metadata.hasAlpha),
    orientation: metadata.orientation ?? null,
    pages: pageCount,
    sizeBytes: file.size,
  };
}

function sanitizeDisplayFileName(originalName = "image") {
  return originalName
    .normalize("NFKC")
    .replace(/[\/\\\0\r\n\t]/g, "_")
    .replace(/[<>:"|?*]/g, "_")
    .slice(0, 150);
}

module.exports = { inspectAndValidateImage };
