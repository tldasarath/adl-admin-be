import express from "express";
import { createCategoryPackage, createCommonPackage, deleteCategoryPackage, deleteCommonPackage, getAllCommonPackages, getCategoryPackages, getCategoryPageCounts, getCommonPackageById, getCommonPackageCounts, updateCategoryPackage, updateCommonPackage } from "../../controllers/adminController/packagesController.js";


const packagesRoute = express.Router();

// ------- Common Packages -------
packagesRoute.post("/common", createCommonPackage);
packagesRoute.get("/common", getAllCommonPackages);
packagesRoute.get("/common/counts", getCommonPackageCounts);
packagesRoute.get("/common/:id", getCommonPackageById);
packagesRoute.put("/common/:id", updateCommonPackage);
packagesRoute.delete("/common/:id", deleteCommonPackage);

// ------- Category Packages -------
packagesRoute.post("/category", createCategoryPackage);
packagesRoute.get("/category", getCategoryPackages);
packagesRoute.get("/category/:categoryKey/counts", getCategoryPageCounts);

// Update / delete nested package
packagesRoute.put(
  "/category/:categoryKey/pages/:pageName/packages/:packageId",
  updateCategoryPackage
);
packagesRoute.delete(
  "/category/:categoryKey/pages/:pageName/packages/:packageId",
  deleteCategoryPackage
);

export default packagesRoute;
