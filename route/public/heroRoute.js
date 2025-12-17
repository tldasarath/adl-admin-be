

import express from 'express'
import { getHeroSection } from '../../controllers/publicController/heroSectionController.js'
const heroRoute = express.Router()

heroRoute.get('/get-herosection', getHeroSection)


export default heroRoute