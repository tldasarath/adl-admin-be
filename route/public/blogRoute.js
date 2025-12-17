import express from 'express'
import { getBlog, getBlogs, getInnerPageBlog } from '../../controllers/publicController/blogController.js'
const blogRoute =express.Router()

blogRoute.get('/get-blogs',getBlogs)
blogRoute.get("/get-blog/:url",getBlog)
blogRoute.get("/get-innerPage-blog/:subcategory",getInnerPageBlog)


export default blogRoute