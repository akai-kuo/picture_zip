import { Router } from "express";
import { uploadImage, uploadConfig } from "../config/upload.config.js";
import { validateUploadedImage } from "../middlewares/validate-image.middleware.js";
import { inspectImage } from "../controllers/image.controller.js";
// import { inspectImage, processImage } from "../controllers/image.controller.js";

const router = Router();

router.post(
  "/inspect",
  uploadImage.single(uploadConfig.fieldName),
  validateUploadedImage,
  inspectImage
);

router.post(
  "/process",
  uploadImage.single(uploadConfig.fieldName),
  validateUploadedImage
  //  processImage
);

export default router;
