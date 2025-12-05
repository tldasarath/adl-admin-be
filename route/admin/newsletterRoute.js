import express from "express";
import { body } from "express-validator";
import {
  blockEmail,
  deleteSubscriber,
  getAllSubscribers,
  getBlockedSubscribers,
  subscribe,
  unblockEmail,
  unsubscribe,
  updateSubscriber,
  // list,
  // sendBulk,
} from "../../controllers/adminController/newsletterController.js";
// import { protectAdmin } from "../../controllers/admin/authController.js";

const newsletterRoute = express.Router();


newsletterRoute.post(
  "/subscribe",
  [body("email").isEmail().normalizeEmail()],
  subscribe
);
newsletterRoute.get(
  "/subscribers",
  // protect,
  // authorizeRoles("admin", "superadmin"),
  getAllSubscribers
);

newsletterRoute.get("/unsubscribe", unsubscribe);
newsletterRoute.post("/unsubscribe", unsubscribe);

// GET blocked subscribers (admin)
newsletterRoute.get("/blocked", 
  // protect, 
  // authorizeRoles("admin", "superadmin"), 
  getBlockedSubscribers);

// Block by email or id
newsletterRoute.post(
  "/block",
  // protect,
  // authorizeRoles("admin", "superadmin"),
  [
    // either email or id required — validator can't easily require one-of, so keep basic
    body("email").optional().isEmail().withMessage("Invalid email"),
    body("id").optional().isMongoId().withMessage("Invalid id"),
    body("reason").optional().isString().trim().isLength({ max: 500 }),
  ],
  blockEmail
);

// Unblock
newsletterRoute.post(
  "/unblock",
  // protect,
  // authorizeRoles("admin", "superadmin"),
  [body("email").optional().isEmail(), body("id").optional().isMongoId()],
  unblockEmail
);

newsletterRoute.delete('/:id',
  // protectAdmin,
  deleteSubscriber
);

newsletterRoute.patch('/:id',
  // protectAdmin,
  updateSubscriber
);

// Admin endpoints (protect with your admin auth middleware)
// router.get("/", protectAdmin, list); 
// router.post("/send", protectAdmin, sendBulk);



export default newsletterRoute;
