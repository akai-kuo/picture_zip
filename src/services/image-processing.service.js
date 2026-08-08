const fs = require("fs/promises");
const path = require("path");
const { randomUUID } = require("crypto");
const sharp = require("sharp");
const AppError = require("../errors/app-error");
const imageConfig = require("../config/image.config");

const OUTPUT_DIR = imageConfig.output.dir;
const ALLOWED_OUTPUT_FORMATS = imageConfig.output.allowedFormats;

async function processImageBuffer(inputBuffer, originalInfo, options = {}) {
  const format = normalizeFormat(options.format || imageConfig.output.defaultFormat);
  const quality = parseQuality(options.quality);
  const maxWidth = parseMaxWidth(options.maxWidth);

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const extension = format === "jpeg" ? "jpg" : format;
  const outputFilename = `${randomUUID()}.${extension}`;
  const outputPath = path.join(OUTPUT_DIR, outputFilename);

  try {
    // rotate() 無參數時會依 EXIF orientation 自動校正方向。
    let pipeline = sharp(inputBuffer, {
      limitInputPixels: imageConfig.validation.maxPixels,
      sequentialRead: true,
    }).rotate();

    if (maxWidth) {
      pipeline = pipeline.resize({
        width: maxWidth,
        withoutEnlargement: true,
      });
    }

    // JPEG 不支援透明背景；若原圖有 Alpha，先鋪白底。
    if (format === "jpeg" && originalInfo.hasAlpha) {
      pipeline = pipeline.flatten({ background: "#ffffff" });
    }

    pipeline = applyOutputFormat(pipeline, format, quality);
    await pipeline.toFile(outputPath);

    const stat = await fs.stat(outputPath);
    const originalSize = originalInfo.sizeBytes;
    const outputSize = stat.size;
    const savedBytes = originalSize - outputSize;
    const savedPercent = Number(((savedBytes / originalSize) * 100).toFixed(1));

    return {
      filename: outputFilename,
      originalSize,
      outputSize,
      savedBytes,
      savedPercent,
      sizeChanged: savedBytes > 0 ? "decreased" : savedBytes < 0 ? "increased" : "unchanged",
      format,
      previewUrl: `/downloads/${outputFilename}`,
      downloadUrl: `/downloads/${outputFilename}`,
    };
  } catch (error) {
    await fs.rm(outputPath, { force: true }).catch(() => {});

    if (error instanceof AppError) throw error;

    throw new AppError({
      statusCode: 500,
      code: "IMAGE_PROCESSING_FAILED",
      message: "圖片處理失敗，請稍後再試。",
      details:
        process.env.NODE_ENV === "development"
          ? { reason: error.message }
          : undefined,
    });
  }
}

function normalizeFormat(value) {
  const format = String(value).toLowerCase() === "jpg" ? "jpeg" : String(value).toLowerCase();
  if (!ALLOWED_OUTPUT_FORMATS.has(format)) {
    throw new AppError({
      statusCode: 400,
      code: "INVALID_OUTPUT_FORMAT",
      message: "輸出格式僅支援 jpeg、png、webp、avif。",
    });
  }
  return format;
}

function parseQuality(value) {
  const quality = value === undefined || value === "" ? imageConfig.output.defaultQuality : Number(value);
  if (!Number.isInteger(quality) || quality < 1 || quality > 100) {
    throw new AppError({
      statusCode: 400,
      code: "INVALID_QUALITY_VALUE",
      message: "圖片品質必須是 1 到 100 之間的整數。",
    });
  }
  return quality;
}

function parseMaxWidth(value) {
  if (value === undefined || value === "" || value === null) return null;
  const maxWidth = Number(value);
  if (!Number.isInteger(maxWidth) || maxWidth <= 0 || maxWidth > imageConfig.validation.maxWidth) {
    throw new AppError({
      statusCode: 400,
      code: "INVALID_MAX_WIDTH",
      message: `maxWidth 必須是 1 到 ${imageConfig.validation.maxWidth} 之間的整數。`,
    });
  }
  return maxWidth;
}

function applyOutputFormat(pipeline, format, quality) {
  switch (format) {
    case "jpeg":
      return pipeline.jpeg({ quality, progressive: true });
    case "png":
      // PNG 本身是無損格式，quality 主要影響 palette/量化行為；保留此介面以維持前端一致性。
      return pipeline.png({ quality, compressionLevel: 9 });
    case "webp":
      return pipeline.webp({ quality });
    case "avif":
      return pipeline.avif({ quality });
    default:
      return pipeline;
  }
}

module.exports = { processImageBuffer };
