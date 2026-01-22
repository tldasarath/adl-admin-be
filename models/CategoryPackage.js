
import mongooseInstance from "../config/mongooseInstance.js";



const PagePackageSchema = new mongooseInstance.Schema({
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



const CategoryPackage =
  mongooseInstance.models.CategoryPackage ||
  mongooseInstance.model('CategoryPackage', PagePackageSchema);

export default CategoryPackage;

