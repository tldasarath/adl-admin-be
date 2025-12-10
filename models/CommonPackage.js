
import mongoose from 'mongoose';



const CommonPackageSchema = new mongoose.Schema({
  iconUrl: { type: String },
  iconPublicId: { type: String },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
points: {
  type: [String],
  validate: {
    validator: v => Array.isArray(v) && v.length >= 1 && v.length <= 4,
    message: 'Points must contain 1 to 4 items.'
  }
},
  amount: { type: Number, required: true, min: 0 },
  is_home: { type: Boolean, default: false },
  is_freezone: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

CommonPackageSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.models.CommonPackage || mongoose.model('CommonPackage', CommonPackageSchema);
