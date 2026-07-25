import { inspectAndValidateImage } from "../services/image-validation.service.js";

export async function validateUploadedImage(req, res, next) {
  try {
    const imageInfo = await inspectAndValidateImage(req.file);

    req.imageInfo = imageInfo;

    next();
  } catch (error) {
    next(error);
  }
}
