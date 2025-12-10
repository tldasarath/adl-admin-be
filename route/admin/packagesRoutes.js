
import express from 'express';
import {
  createCategoryPackage,
  createCommonPackage,
  deleteCategoryPackage,
  deleteCommonPackage,
  getAllCommonPackages,
  getCategoryPackages,
  getCategoryPageCounts,
  getCommonPackageById,
  getCommonPackageCounts,
  updateCategoryPackage,
  updateCommonPackage
} from '../../controllers/adminController/packagesController.js';

import { uploadPackageImage } from '../../config/multer-cloudinary.js';

const packagesRoute = express.Router();

// Common (image field name: 'icon')
packagesRoute.post('/common', uploadPackageImage.single('image'), createCommonPackage);
packagesRoute.put('/common/:id', uploadPackageImage.single('image'), updateCommonPackage);
packagesRoute.get('/common', getAllCommonPackages);
packagesRoute.get('/common/counts', getCommonPackageCounts);
packagesRoute.get('/common/:id', getCommonPackageById);
packagesRoute.delete('/common/:id', deleteCommonPackage);

// Category (no images)
packagesRoute.post('/category', createCategoryPackage);
packagesRoute.get('/category', getCategoryPackages);
packagesRoute.get('/category/:categoryKey/counts', getCategoryPageCounts);
packagesRoute.put('/category/:categoryKey/pages/:pageName/packages/:packageId', updateCategoryPackage);
packagesRoute.delete('/category/:categoryKey/pages/:pageName/packages/:packageId', deleteCategoryPackage);

export default packagesRoute;
