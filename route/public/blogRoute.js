import express from 'express'
import { getBlog, getBlogs } from '../../controllers/publicController/blogController.js'
const blogRoute =express.Router()

blogRoute.get('/get-blogs',getBlogs)
blogRoute.get("/get-blog/:url",getBlog)


export default blogRoute