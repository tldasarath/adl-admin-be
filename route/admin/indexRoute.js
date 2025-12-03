import express from 'express'
import userRoute from './userRoute.js'
import authRoute from './authRoute.js'
import faqRoute from './faqRoute.js'
import enquiryRoute from './enquiryRoute.js'
import blogRoute from './blogRoute.js'
import newsletterRoute from './newsletterRoute.js'
import packagesRoute from './packagesRoutes.js'

const adminroute =express.Router()
adminroute.use('/user',userRoute)
adminroute.use('/auth',authRoute)
adminroute.use('/faq',faqRoute)
adminroute.use('/enquiry',enquiryRoute)
adminroute.use('/blog',blogRoute)
adminroute.use('/newsletter',newsletterRoute)
adminroute.use('/packages',packagesRoute)
export default adminroute