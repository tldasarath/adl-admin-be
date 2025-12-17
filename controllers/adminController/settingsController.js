import { getDatabaseStorageStats } from "../../utils/dbStorage.js";

export const storageUsage = async (req, res) => {
  try {
    const stats = await getDatabaseStorageStats();

    return res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    console.error("Storage usage error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch storage usage"
    });
  }
};