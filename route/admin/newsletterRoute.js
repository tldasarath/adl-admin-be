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
import { authorizeRoles } from "../../middleware/authorizeRoles.js";
import { authMiddleware } from "../../middleware/authMiddleware.js";
// import { protectAdmin } from "../../controllers/admin/authController.js";

const newsletterRoute = express.Router();


newsletterRoute.post(
  "/subscribe", authMiddleware,
      authorizeRoles("admin"),
  [body("email").isEmail().normalizeEmail()],
  subscribe
);
newsletterRoute.get(
  "/subscribers",
  // protect,
  // authorizeRoles("admin", "superadmin"),
  authMiddleware,
     authorizeRoles("admin") ,getAllSubscribers
);

newsletterRoute.get("/unsubscribe", authMiddleware,
     authorizeRoles("admin") , unsubscribe);
newsletterRoute.post("/unsubscribe", authMiddleware,
     authorizeRoles("admin") , unsubscribe);

// GET blocked subscribers (admin)
newsletterRoute.get("/blocked", 
  // protect, 
  // authorizeRoles("admin", "superadmin"), 
   authMiddleware,
     authorizeRoles("admin") ,getBlockedSubscribers);

// Block by email or id
newsletterRoute.post(
  "/block", authMiddleware,
     authorizeRoles("admin") ,
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
  "/unblock", authMiddleware,
     authorizeRoles("admin") ,
  // protect,
  // authorizeRoles("admin", "superadmin"),
  [body("email").optional().isEmail(), body("id").optional().isMongoId()],
  unblockEmail
);

newsletterRoute.delete('/:id', authMiddleware,
     authorizeRoles("admin") ,
  // protectAdmin,
  deleteSubscriber
);

newsletterRoute.patch('/:id', authMiddleware,
     authorizeRoles("admin") ,
  // protectAdmin,
  updateSubscriber
);

// Admin endpoints (protect with your admin auth middleware)
// router.get("/", protectAdmin, list); 
// router.post("/send", protectAdmin, sendBulk);



export default newsletterRoute;
