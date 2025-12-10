import express from "express";
import { body } from "express-validator";
import { createUser, deleteUser, getUsers, updateUser } from "../../controllers/adminController/userController.js";
import { authMiddleware } from "../../middleware/authMiddleware.js";
import { authorizeRoles } from "../../middleware/authorizeRoles.js";


const router = express.Router();

router.get("/all-users", getUsers);

router.post(
  "/create-user",
  authMiddleware,
  authorizeRoles("admin"),
  createUser
);

// router.get(
//   "/user/:id",
//   protect,
//   authorizeRoles("admin", "superadmin"),
//   getUserById
// );

router.patch(
  "/edit-user/:id",
  authMiddleware,
  authorizeRoles("admin"),

  updateUser
);

router.delete(
  "/delete-user/:id",
  authMiddleware,
  authorizeRoles("admin"),

  deleteUser
);

export default router;
