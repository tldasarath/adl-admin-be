
import express from 'express';
import {
  createCategoryPackage,
  createCommonPackage,
  deleteCategoryPackage,
  deleteCommonPackage,
  getAllCommonPackages,
  
  getCategoryPackages,
  
  getCommonPackageById,
  getCommonPackageCounts,
  updateCategoryPackage,
  updateCommonPackage
} from '../../controllers/adminController/packagesController.js';

import { uploadPackageImage } from '../../config/multer-cloudinary.js';
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { authorizeRoles } from '../../middleware/authorizeRoles.js';

const packagesRoute = express.Router();

// Common (image field name: 'icon')
packagesRoute.post('/common', authMiddleware,
  authorizeRoles("admin"), uploadPackageImage.single('image'), createCommonPackage);
packagesRoute.put('/common/:id', authMiddleware,
  authorizeRoles("admin"), uploadPackageImage.single('image'), updateCommonPackage);
packagesRoute.get('/common', authMiddleware,
  authorizeRoles("admin"), getAllCommonPackages);
packagesRoute.get('/common/counts', authMiddleware,
  authorizeRoles("admin"), getCommonPackageCounts);
packagesRoute.get('/common/:id', authMiddleware,
  authorizeRoles("admin"), getCommonPackageById);
packagesRoute.delete('/common/:id', authMiddleware,
  authorizeRoles("admin"), deleteCommonPackage);

// Category (no images)
packagesRoute.post('/category', authMiddleware,
  authorizeRoles("admin"),uploadPackageImage.single('image'), createCategoryPackage);
packagesRoute.get('/category',
 getCategoryPackages);
// packagesRoute.get('/category/:categoryKey/counts', authMiddleware,
//   authorizeRoles("admin"), getCategoryPageCounts);
packagesRoute.put('/category/update-package/:packageId', authMiddleware,
  authorizeRoles("admin"),uploadPackageImage.single('image'),updateCategoryPackage);
packagesRoute.delete('/category/delete-package', authMiddleware,
  authorizeRoles("admin"), deleteCategoryPackage);

export default packagesRoute;
