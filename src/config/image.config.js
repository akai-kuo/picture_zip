const path = require("path");

const MB = 1024 * 1024;
const MINUTE = 60 * 1000;

function positiveNumberFromEnv(value, fallback) {
  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    return fallback;
  }

  return number;
}

const outputTtlMinutes = positiveNumberFromEnv(process.env.OUTPUT_TTL_MINUTES, 30);

const cleanupIntervalMinutes = positiveNumberFromEnv(
  process.env.OUTPUT_CLEANUP_INTERVAL_MINUTES,
  5
);

const imageConfig = {
  upload: {
    fieldName: "image",
    maxFileSize: 15 * MB,
    maxFiles: 1,
    allowedClientMimeTypes: new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]),
  },
  validation: {
    maxWidth: 12_000,
    maxHeight: 12_000,
    maxPixels: 50_000_000,
    allowAnimated: false,
  },
  output: {
    dir: path.resolve(process.env.OUTPUT_DIR || "./storage/output"),
    defaultFormat: "webp",
    defaultQuality: 80,
    allowedFormats: new Set(["jpeg", "png", "webp", "avif"]),

    // 輸出圖片存活時間。
    ttlMs: outputTtlMinutes * MINUTE,

    // 每隔多久掃描一次過期圖片。
    cleanupIntervalMs: cleanupIntervalMinutes * MINUTE,
  },
};

module.exports = imageConfig;
