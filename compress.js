const sharp = require('sharp');
const fs = require('fs');

async function compressImage(inputPath, outputPath, quality = 80, width) { 
  // 步驟1: 取得原始檔案大小
  const originalStats = fs.statSync(inputPath); // 取得檔案資訊
  const originalSize = originalStats.size; // 取得檔案大小 (bytes)

  // 步驟2: 用 sharp 讀取 + 壓縮 + (可能)縮放 + 轉 webp
  let imageProcess = sharp(inputPath); // 讀取圖片檔案
  if (width) { 
    const metadata = await imageProcess.metadata(); // 先讀取圖片原始資訊
    if (metadata.width > width) {                   // 只有原圖比目標寬度「更寬」才執行縮放
        imageProcess = imageProcess.resize(width);  // 如果原圖本來就比目標窄,就完全不動它,直接往下走壓縮流程
    }
  }
  await imageProcess
    .webp({ quality: quality }) // 設定壓縮品質
    .toFile(outputPath); // 壓縮後存檔

  // 步驟3: 取得壓縮後檔案大小
  const compressedStats = fs.statSync(outputPath); // 取得壓縮後檔案資訊
  const compressedSize = compressedStats.size; // 取得壓縮後檔案大小 (bytes)

  // 計算節省的百分比
  const savedPercent = ((originalSize - compressedSize) / originalSize) * 100;

  return {
    outputPath: outputPath,
    originalSize: originalSize,
    compressedSize: compressedSize,
    savedPercent: savedPercent.toFixed(1) // .toFixed(1) 保留一位小數
  };
}
module.exports = compressImage; // 匯出 compressImage 函式，讓其他檔案可以使用