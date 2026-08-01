const { inspectAndValidateImage } = require("../services/image-validation.service");

module.exports = {
  validateUploadedImage: async function (req, res, next) {
    try {
      const imageInfo = await inspectAndValidateImage(req.file);

      req.imageInfo = imageInfo;

      next();
    } catch (error) {
      next(error);
    }
  },
};
