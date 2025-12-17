import mongoose from "mongoose";

export async function getDatabaseStorageStats() {
  const stats = await mongoose.connection.db.stats();

  const usedBytes = stats.storageSize + stats.indexSize;

  const FREE_TIER_LIMIT_BYTES = 512 * 1024 * 1024; // 512 MB

  const usedMB = usedBytes / (1024 * 1024);
  const usedGB = usedMB / 1024;

  // Decide unit dynamically
  const display =
    usedMB < 1024
      ? {
          value: Number(usedMB.toFixed(2)),
          unit: "MB",
        }
      : {
          value: Number(usedGB.toFixed(2)),
          unit: "GB",
        };

  const percentage = Math.min(
    Number(((usedBytes / FREE_TIER_LIMIT_BYTES) * 100).toFixed(2)),
    100
  );

  return {
    usedBytes,
    usedMB: Number(usedMB.toFixed(2)),
    usedGB: Number(usedGB.toFixed(2)),
    limitMB: 512,
    limitGB: 0.5,
    display,
    percentage,
    source: "estimated", // important for transparency
  };
}
