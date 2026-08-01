const { Router } = require("express");
const { uploadImage, uploadConfig } = require("../config/upload.config");
const { validateUploadedImage } = require("../middlewares/validate-image.middleware");
const { inspectImage } = require("../controllers/image.controller");
// import { inspectImage, processImage } from "../controllers/image.controller.js";

const router = Router();

router.post(
  "/inspect",
  uploadImage.single(uploadConfig.fieldName),
  validateUploadedImage,
  inspectImage
);

//  router.post(
//    "/process",
//    uploadImage.single(uploadConfig.fieldName),
//    validateUploadedImage
//  processImage
//  );

module.exports = router;
