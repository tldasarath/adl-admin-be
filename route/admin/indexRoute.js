import express from 'express'
import userRoute from './userRoute.js'
import authRoute from './authRoute.js'
import faqRoute from './faqRoute.js'
import enquiryRoute from './enquiryRoute.js'
import blogRoute from './blogRoute.js'
import newsletterRoute from './newsletterRoute.js'
import packagesRoute from './packagesRoutes.js'
import analyticsRoute from './analyticsRoute.js'
import settingsRoute from './settingsRoute.js'

import seoRoute from './seoRoute.js'
import galleryRoute from './galleryRoute.js'
import heroRoute from './heroRoute.js'
const adminroute =express.Router()
adminroute.use('/user',userRoute)
adminroute.use('/auth',authRoute)
adminroute.use('/faq',faqRoute)
adminroute.use('/enquiry',enquiryRoute)
adminroute.use('/blog',blogRoute)
adminroute.use('/newsletter',newsletterRoute)
adminroute.use('/packages',packagesRoute)
adminroute.use('/seo',seoRoute)
adminroute.use('/gallery',galleryRoute)
adminroute.use('/herosection',heroRoute)
adminroute.use('/analytics', analyticsRoute);
adminroute.use('/settings', settingsRoute);
export default adminroute