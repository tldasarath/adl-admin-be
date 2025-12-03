import express from "express";
import { body } from "express-validator";
import {
  createUser,
  deleteUser,
  getUsers,
  updateUser,
  getUserById,
} from "../../controllers/adminController/userController.js";
import { protect, authorizeRoles } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/all-users",
  protect,
  authorizeRoles("admin", "superadmin"),
  getUsers
);

router.post(
  "/create-user",
  protect,
  authorizeRoles("superadmin", "admin"),
  [
    body("name").isString().notEmpty(),
    body("email").isEmail(),
    body("password").isLength({ min: 6 }),
    body("confirmPassword").exists(),
    body("role").optional().isIn(["admin", "superadmin"]),
  ],

  async (req, res, next) => {
    if (req.body.role === "superadmin" && req.user.role !== "superadmin") {
      return res
        .status(403)
        .json({
          success: false,
          message: "Only superadmin can create superadmin users",
        });
    }
    next();
  },
  createUser
);

router.get(
  "/user/:id",
  protect,
  authorizeRoles("admin", "superadmin"),
  getUserById
);

router.patch(
  "/edit-user/:id",
  protect,
  authorizeRoles("admin", "superadmin"),
  updateUser
);

router.delete(
  "/delete-user/:id",
  protect,
  authorizeRoles("superadmin"),
  deleteUser
);

export default router;
