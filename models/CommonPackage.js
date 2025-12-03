const mongoose = require('mongoose');

const PointSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true }
}, { _id: false });

const CommonPackageSchema = new mongoose.Schema({
  iconUrl: { type: String }, // store image URL or path
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  points: {
    type: [PointSchema],
    validate: {
      validator: v => Array.isArray(v) && v.length > 0 && v.length <= 4,
      message: 'Points must be 1 to 4 items.'
    }
  },
  amount: { type: Number, required: true, min: 0 }, // amount required
  is_home: { type: Boolean, default: false },
  is_freezone: { type: Boolean, default: false },
  // metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

CommonPackageSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('CommonPackage', CommonPackageSchema);
