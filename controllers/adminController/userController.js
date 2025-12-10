
import { validationResult } from "express-validator";
import User from "../../models/userModel.js";

/**
 * Create a new user
 * - expects: { name, email, password, confirmPassword, role }
 * - password hashing handled by User model pre-save
 */
export const createUser = async (req, res) => {
  try {
  
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });

    const { name, email, password, confirmPassword, role } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    // Prevent non-superadmin from creating superadmin (enforced by route)
    // Create user; password will be hashed by pre-save
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || "admin",
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("createUser error:", error);
    return res.status(500).json({ success: false, message: "Failed to create user", error: error.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    
    return res.status(200).json({ success: true, message: "Users fetched successfully", data: users });
  } catch (error) {
    console.error("getUsers error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch users", error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.status(200).json({ success: true, message: "User fetched successfully", data: user });
  } catch (error) {
    console.error("getUserById error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch user", error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    // don't allow updating password here (add dedicated endpoint to change password)
    const allowed = ["name", "email", "role", "isActive", "verify"];
    const updates = {};
    for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.status(200).json({ success: true, message: "User updated successfully", data: user });
  } catch (error) {
    console.error("updateUser error:", error);
    return res.status(400).json({ success: false, message: "Failed to update user", error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    // Consider soft-delete: here we permanently delete
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("deleteUser error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete user", error: error.message });
  }
};
