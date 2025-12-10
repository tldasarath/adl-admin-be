import express from 'express'
import { addGalleryImage, deleteGalleryImage, getGalleryImages } from '../../controllers/adminController/galleryController.js'
import { uploadGalleryImage } from '../../config/multer-cloudinary.js'
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { authorizeRoles } from '../../middleware/authorizeRoles.js';
const galleryRoute = express.Router()

galleryRoute.post("/add-image", authMiddleware,
    authorizeRoles("admin"), uploadGalleryImage.single("image"), addGalleryImage);
galleryRoute.get('/get-images', authMiddleware,
    authorizeRoles("admin"), getGalleryImages)
galleryRoute.delete('/delete-image/:id', authMiddleware,
    authorizeRoles("admin"), deleteGalleryImage)

export default galleryRoute