const { processImageBuffer } = require("../services/image-processing.service");

async function inspectImage(req, res, next) {
  try {
    return res.status(200).json({
      success: true,
      data: { image: req.imageInfo },
    });
  } catch (error) {
    return next(error);
  }
}

async function processImage(req, res, next) {
  try {
    const result = await processImageBuffer(req.file.buffer, req.imageInfo, {
      format: req.body.format,
      quality: req.body.quality,
      maxWidth: req.body.maxWidth,
    });

    return res.status(200).json({
      success: true,
      data: {
        original: req.imageInfo,
        output: result,
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { inspectImage, processImage };
