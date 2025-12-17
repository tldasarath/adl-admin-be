

import express from 'express'
import { authMiddleware } from '../../middleware/authMiddleware.js';
import { authorizeRoles } from '../../middleware/authorizeRoles.js';
import { getHeroSection, updateHeroSection } from '../../controllers/adminController/heroSectionController.js';
const heroRoute = express.Router()

heroRoute.put("/save-herosection", authMiddleware,
    authorizeRoles(""), updateHeroSection);
heroRoute.get('/get-herosection', authMiddleware,
    authorizeRoles(""), getHeroSection)


export default heroRoute