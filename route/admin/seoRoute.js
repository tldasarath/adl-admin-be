import express from 'express'
import { getSeo, saveSeo } from '../../controllers/adminController/seoController.js'
import { authMiddleware } from '../../middleware/authMiddleware.js'
import { authorizeRoles } from '../../middleware/authorizeRoles.js'
const seoRoute = express.Router()

seoRoute.post('/add-seo', authMiddleware,
    authorizeRoles("admin"), saveSeo)
seoRoute.get('/get-seo', authMiddleware,
    authorizeRoles("admin"), getSeo)

export default seoRoute