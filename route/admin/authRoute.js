
import express from "express";
import { body } from "express-validator";
import { login, logout, refreshAccessToken } from "../../controllers/adminController/authController.js";
// import rateLimit from 'express-rate-limit';

const router = express.Router();

// Optional: enable simple rate limiting for login
// const loginLimiter = rateLimit({ windowMs: 60*1000, max: 6, message: { success: false, message: "Too many login attempts" } });

router.post("/login",login);
router.post("/refresh",refreshAccessToken);
router.post("/logout",logout);

export default router;
