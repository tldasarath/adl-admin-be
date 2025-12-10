import express from 'express'
import { addFAQ, deleteFAQ, editFAQOrder, getFAQs, homeFAQ, updateFAQ } from '../../controllers/adminController/faqController.js'
import { authMiddleware } from '../../middleware/authMiddleware.js'
import { authorizeRoles } from '../../middleware/authorizeRoles.js'
const faqRoute = express.Router()

faqRoute.get('/all-faqs', authMiddleware,
    authorizeRoles("admin"), getFAQs)
faqRoute.post('/create-faq', authMiddleware,
    authorizeRoles("admin"), addFAQ)
faqRoute.patch('/edit-faq/:id', authMiddleware,
    authorizeRoles("admin"), updateFAQ)
faqRoute.patch('/edit-home-faq/:id', authMiddleware,
    authorizeRoles("admin"), homeFAQ)
faqRoute.patch('/edit-faq-order/:id', authMiddleware,
    authorizeRoles("admin"), editFAQOrder)
faqRoute.delete("/delete-faq/:id", authMiddleware,
    authorizeRoles("admin"), deleteFAQ)

export default faqRoute 