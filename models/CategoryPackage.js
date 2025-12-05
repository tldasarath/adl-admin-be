const mongoose = require('mongoose');

const PointSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true }
}, { _id: false });

const PagePackageSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  points: {
    type: [PointSchema],
    validate: {
      validator: v => Array.isArray(v) && v.length > 0 && v.length <= 4,
      message: 'Points must be 1 to 4 items.'
    }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { _id: true });

const PageSchema = new mongoose.Schema({
  pageName: { type: String, required: true, trim: true }, // e.g. 'JAFZA'
  packages: {
    type: [PagePackageSchema],
    validate: {
      validator: v => Array.isArray(v) && v.length <= 4,
      message: 'Max 4 packages per page.'
    }
  }
}, { _id: true });

const CategorySchema = new mongoose.Schema({
  categoryKey: { type: String, required: true, unique: true }, // e.g. 'dubai_freezones'
  categoryTitle: { type: String, required: true }, // e.g. 'Dubai Freezones'
  pages: { type: [PageSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CategoryPackage', CategorySchema);
