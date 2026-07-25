export async function inspectImage(req, res, next) {
  try {
    res.status(200).json({
      success: true,
      data: {
        image: req.imageInfo,
      },
    });
  } catch (error) {
    next(error);
  }
}

// export async function processImage(req, res, next) {
//   try {
//     const inputBuffer = req.file.buffer;
//     const originalInfo = req.imageInfo;

// 接下來交給圖片壓縮／轉檔 Service。
// const result = await imageProcessingService.process(...);

//     res.status(200).json({
//       success: true,
//       data: {
//         original: originalInfo
//       }
//     });
//   } catch (error) {
//     next(error);
//   }
// }
