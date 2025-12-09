import enquiryRoute from "./enquiryRoute.js"
import faqRoute from "./faqRoute.js"
import galleryRoute from "./galleryRoute.js"
import seoRoute from "./seoRoute.js"
import packagesRoute from "./packagesRoute.js"
import newsletterRoute from "./newsletterRoute.js"

import express from 'express'

const publicRoute =express.Router()

publicRoute.use('/seo',seoRoute)
publicRoute.use('/enquiry',enquiryRoute)
publicRoute.use('/gallery',galleryRoute)
publicRoute.use('/faq',faqRoute)
publicRoute.use('/packages',packagesRoute)
publicRoute.use('/newsletter',newsletterRoute)

export default publicRoute