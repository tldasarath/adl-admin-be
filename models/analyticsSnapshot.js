import mongooseInstance from "../config/mongooseInstance.js";




const AnalyticsSnapshotSchema = new mongooseInstance.Schema(
  {
    bucket: {
      type: String,
      enum: ['hourly', 'daily'],
      required: true
    },

    // Bucket start time (ex: 2025-12-10T09:00:00Z)
    ts: {
      type: Date,
      required: true,
      index: true
    },

    // Small aggregated metrics
    // example: { activeUsers: 10, sessions: 20, pageviews: 200 }
    metrics: {
      type: Object,
      required: true
    },

    // Top N pages snapshot
    topPages: [
      {
        path: { type: String },
        views: { type: Number }
      }
    ]
  },
  {
    timestamps: true,
    collection: 'analyticsSnapshots'
  }
);

/**
 * TTL INDEX
 * - Keeps data automatically cleaned
 * - 30 days retention for hourly snapshots
 * - MongoDB handles cleanup safely in background
 */
AnalyticsSnapshotSchema.index(
  { ts: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 30 } // 30 days
);

/**
 * IMPORTANT:
 * - Prevents "OverwriteModelError"
 * - Prevents "mongoose already declared"
 * - Safe for PM2 restarts & cluster mode
 */
const AnalyticsSnapshot =
  mongooseInstance.models.AnalyticsSnapshot ||
  mongooseInstance.model('AnalyticsSnapshot', AnalyticsSnapshotSchema);

export default AnalyticsSnapshot;
