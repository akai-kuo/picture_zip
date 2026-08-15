const { Router } = require("express");
const { uploadImage, uploadConfig } = require("../config/upload.config");
const { validateUploadedImage } = require("../middlewares/validate-image.middleware");
const { inspectImage, processImage } = require("../controllers/image.controller");

const router = Router();

// 用來確認「新版 Router」是否真的掛載成功。
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "ok",
    router: "new-image-router",
  });
});

// 只做上傳與圖片驗證，不產生輸出檔案。
router.post(
  "/inspect",
  uploadImage.single(uploadConfig.fieldName),
  validateUploadedImage,
  inspectImage
);

// 完整流程：Multer → Magic Number → Sharp metadata → 壓縮/轉檔 → 回傳下載網址。
router.post(
  "/process",
  uploadImage.single(uploadConfig.fieldName),
  validateUploadedImage,
  processImage
);

module.exports = router;
