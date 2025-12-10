import express from 'express'
import { createBlog, deleteBlog, getBlog, getBlogs, updateBlog } from '../../controllers/adminController/blogController.js'
import upload from '../../config/multer-cloudinary.js'
import { authMiddleware } from '../../middleware/authMiddleware.js'
import { authorizeRoles } from '../../middleware/authorizeRoles.js'
const blogRoute = express.Router()

blogRoute.post('/add-blog', authMiddleware,
    authorizeRoles("admin"), upload.single("image"), createBlog)
blogRoute.get('/get-blogs', authMiddleware,
    authorizeRoles("admin"), getBlogs)
blogRoute.get("/get-blog/:id", authMiddleware,
    authorizeRoles("admin"), getBlog)
blogRoute.put("/update-blog/:id", authMiddleware,
    authorizeRoles("admin"), upload.single("image"), updateBlog)
blogRoute.delete("/delete-blog/:id", authMiddleware,
    authorizeRoles("admin"), deleteBlog)

export default blogRoute