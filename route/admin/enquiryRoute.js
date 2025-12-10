import express from 'express'
import { addEnquiry, deleteEnquiry, getAllEnquiries } from '../../controllers/adminController/enquiryController.js'
import { authMiddleware } from '../../middleware/authMiddleware.js'
import { authorizeRoles } from '../../middleware/authorizeRoles.js'
const enquiryRoute = express.Router()

enquiryRoute.get('/all-enquiries', authMiddleware,
    authorizeRoles("admin"), getAllEnquiries)
enquiryRoute.post('/create-enquiry', authMiddleware,
    authorizeRoles("admin"), addEnquiry)
enquiryRoute.delete("/delete-enquiry/:id", authMiddleware,
    authorizeRoles("admin"), deleteEnquiry)

export default enquiryRoute