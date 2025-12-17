
import mongoose from 'mongoose';


const PagePackageSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  page: { type: String, required: true},
  description: { type: String, required: true},
  image: { type: String, required: true},
  points:{type:[String],required:true},
  innerPage: { type: String, required: true},
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})



export const categoryPackage = mongoose.model('categoryPackage', PagePackageSchema);
