import multer from "multer";
import { AppError } from "../errors/app-error.js";

export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: {
      code: "ROUTE_NOT_FOUND",
      message: "找不到指定的 API 路徑。",
    },
  });
}

// Express 錯誤 middleware 必須保留四個參數。
export function errorHandler(error, req, res, next) {
  if (error instanceof multer.MulterError) {
    return handleMulterError(error, res);
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
    });
  }

  console.error(error);

  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: "伺服器處理圖片時發生錯誤。",
    },
  });
}

function handleMulterError(error, res) {
  const errorMap = {
    LIMIT_FILE_SIZE: {
      statusCode: 413,
      code: "FILE_TOO_LARGE",
      message: "上傳圖片超過檔案大小限制。",
    },
    LIMIT_FILE_COUNT: {
      statusCode: 400,
      code: "TOO_MANY_FILES",
      message: "一次只能上傳一張圖片。",
    },
    LIMIT_UNEXPECTED_FILE: {
      statusCode: 400,
      code: error.appCode ?? "UNEXPECTED_FILE",
      message: error.message || "圖片欄位名稱不正確或格式不支援。",
    },
    LIMIT_FIELD_COUNT: {
      statusCode: 400,
      code: "TOO_MANY_FIELDS",
      message: "請求包含過多欄位。",
    },
    LIMIT_PART_COUNT: {
      statusCode: 400,
      code: "TOO_MANY_MULTIPART_PARTS",
      message: "上傳請求包含過多資料區段。",
    },
    LIMIT_FIELD_KEY: {
      statusCode: 400,
      code: "FIELD_NAME_TOO_LONG",
      message: "上傳欄位名稱過長。",
    },
  };

  const mapped = errorMap[error.code] ?? {
    statusCode: 400,
    code: "UPLOAD_ERROR",
    message: "檔案上傳失敗。",
  };

  return res.status(mapped.statusCode).json({
    success: false,
    error: {
      code: mapped.code,
      message: mapped.message,
    },
  });
}
