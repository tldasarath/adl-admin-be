
import express from "express";
import { body } from "express-validator";
import { login } from "../../controllers/adminController/authController.js";
// import rateLimit from 'express-rate-limit';

const router = express.Router();

// Optional: enable simple rate limiting for login
// const loginLimiter = rateLimit({ windowMs: 60*1000, max: 6, message: { success: false, message: "Too many login attempts" } });

router.post(
  "/login",
  // loginLimiter, // uncomment if you installed express-rate-limit
  [body("email").isEmail().withMessage("Valid email required"), body("password").isString().notEmpty()],
  login
);

export default router;
