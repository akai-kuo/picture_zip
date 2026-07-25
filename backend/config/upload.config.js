import multer from "multer";

const MB = 1024 * 1024;

export const uploadConfig = {
  fieldName: "image",
  maxFileSize: 15 * MB,
  maxFiles: 1,
  allowedClientMimeTypes: new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]),
};

const storage = multer.memoryStorage();

function fileFilter(req, file, callback) {
  const { allowedClientMimeTypes } = uploadConfig;

  if (!allowedClientMimeTypes.has(file.mimetype)) {
    const error = new multer.MulterError("LIMIT_UNEXPECTED_FILE");
    error.message = "僅支援 JPEG、PNG、WebP 與 AVIF 圖片。";
    error.appCode = "UNSUPPORTED_CLIENT_MIME_TYPE";

    return callback(error);
  }

  return callback(null, true);
}

export const uploadImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: uploadConfig.maxFileSize,
    files: uploadConfig.maxFiles,

    // 限制非檔案欄位數量，例如 format、quality。
    fields: 10,

    // 限制 multipart 總 parts 數量。
    parts: 12,

    // 避免異常長的欄位名稱。
    fieldNameSize: 100,
  },
});
