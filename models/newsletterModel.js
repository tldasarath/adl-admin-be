import mongoose from "mongoose";

const newsletterSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    unique: true,
  },

  status: {
    type: String,
    enum: ["active", "unsubscribed", "bounced", "complained", "blocked"],
    default: "active",
  },

  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },


  blocked: { type: Boolean, default: false },
  blockedAt: { type: Date },
  blockedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  lastSentAt: { type: Date },

  unsubscribeToken: { type: String },

  unsubscribedAt: { type: Date },
unsubscribeIp: { type: String },
unsubscribeUserAgent: { type: String },
events: [
  {
    type: { type: String },
    at: { type: Date, default: Date.now },
    meta: { type: Object, default: {} },
  },
],
});


newsletterSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

newsletterSchema.index({ email: 1 });

export default mongoose.model("Newsletter", newsletterSchema);
