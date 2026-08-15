const multer = require("multer");
const imageConfig = require("./image.config");

const { upload } = imageConfig;
const storage = multer.memoryStorage();

function fileFilter(req, file, callback) {
  if (!upload.allowedClientMimeTypes.has(file.mimetype)) {
    const error = new multer.MulterError("LIMIT_UNEXPECTED_FILE");
    error.message = "僅支援 JPEG、PNG、WebP 與 AVIF 圖片。";
    error.appCode = "UNSUPPORTED_CLIENT_MIME_TYPE";
    return callback(error);
  }

  return callback(null, true);
}

const uploadImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: upload.maxFileSize,
    files: upload.maxFiles,
    fields: 10,
    parts: 12,
    fieldNameSize: 100,
  },
});

module.exports = {
  uploadImage,
  uploadConfig: upload,
};
