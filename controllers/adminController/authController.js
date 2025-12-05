
import { validationResult } from "express-validator";
import { generateToken } from "../../utils/jwtToken.js";
import User from "../../models/userModel.js";

export const login = async (req, res) => {
  try {

    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ success: false, errors: errors.array() });

    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const matched = await user.matchPassword(password);
    if (!matched) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const token = generateToken({ id: user._id, role: user.role });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("login error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
