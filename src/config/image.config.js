const path = require("path");

const MB = 1024 * 1024;

const imageConfig = {
  upload: {
    fieldName: "image",
    maxFileSize: 15 * MB,
    maxFiles: 1,
    allowedClientMimeTypes: new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
    ]),
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
  },
};

module.exports = imageConfig;
