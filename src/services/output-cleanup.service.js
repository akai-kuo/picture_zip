const fs = require("fs/promises");
const path = require("path");

const imageConfig = require("../config/image.config");

const OUTPUT_DIR = imageConfig.output.dir;
const TTL_MS = imageConfig.output.ttlMs;
const CLEANUP_INTERVAL_MS = imageConfig.output.cleanupIntervalMs;

let cleanupTimer = null;

/**
 * 刪除 OUTPUT_DIR 中超過 TTL 的檔案。
 */
async function cleanupExpiredFiles() {
  const now = Date.now();

  let entries;

  try {
    entries = await fs.readdir(OUTPUT_DIR, {
      withFileTypes: true,
    });
  } catch (error) {
    if (error.code === "ENOENT") {
      // output 資料夾尚不存在，不視為錯誤。
      return {
        scanned: 0,
        deleted: 0,
      };
    }

    throw error;
  }

  let scanned = 0;
  let deleted = 0;

  for (const entry of entries) {
    // 只處理一般檔案。
    if (!entry.isFile()) {
      continue;
    }

    scanned += 1;

    const filePath = path.join(OUTPUT_DIR, entry.name);

    try {
      const stat = await fs.stat(filePath);

      const ageMs = now - stat.mtimeMs;

      if (ageMs < TTL_MS) {
        continue;
      }

      await fs.rm(filePath, {
        force: true,
      });

      deleted += 1;

      console.log(`[cleanup] Deleted expired file: ${entry.name}`);
    } catch (error) {
      // 某一個檔案失敗不應中斷整批 Cleanup。
      console.error(`[cleanup] Failed to inspect/delete ${entry.name}:`, error.message);
    }
  }

  return {
    scanned,
    deleted,
  };
}

/**
 * 啟動定期 Cleanup。
 */
function startOutputCleanup() {
  if (cleanupTimer) {
    return cleanupTimer;
  }

  console.log(`[cleanup] Output TTL: ${Math.round(TTL_MS / 60000)} minutes`);

  console.log(`[cleanup] Scan interval: ${Math.round(CLEANUP_INTERVAL_MS / 60000)} minutes`);

  // 啟動時先清理一次，
  // 避免服務重新啟動後舊檔案一直留著。
  cleanupExpiredFiles()
    .then(({ scanned, deleted }) => {
      console.log(`[cleanup] Initial scan completed. scanned=${scanned}, deleted=${deleted}`);
    })
    .catch((error) => {
      console.error("[cleanup] Initial cleanup failed:", error);
    });

  cleanupTimer = setInterval(() => {
    cleanupExpiredFiles()
      .then(({ scanned, deleted }) => {
        if (deleted > 0) {
          console.log(`[cleanup] scanned=${scanned}, deleted=${deleted}`);
        }
      })
      .catch((error) => {
        console.error("[cleanup] Scheduled cleanup failed:", error);
      });
  }, CLEANUP_INTERVAL_MS);

  // 不讓這個 timer 單獨阻止 Node.js process 結束。
  cleanupTimer.unref?.();

  return cleanupTimer;
}

/**
 * Graceful shutdown 時停止 timer。
 */
function stopOutputCleanup() {
  if (!cleanupTimer) {
    return;
  }

  clearInterval(cleanupTimer);

  cleanupTimer = null;

  console.log("[cleanup] Output cleanup stopped.");
}

module.exports = {
  cleanupExpiredFiles,
  startOutputCleanup,
  stopOutputCleanup,
};
