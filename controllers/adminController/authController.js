
import { validationResult } from "express-validator";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwtToken.js";
import User from "../../models/userModel.js";
import jwt from "jsonwebtoken";


export const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    const matched = await user.matchPassword(password);
    if (!matched) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const accessToken = generateAccessToken({
      id: user._id,
      role: user.role,
    });

    const refreshToken = generateRefreshToken({
      id: user._id,
    });

    user.refreshToken = refreshToken;
    await user.save();    
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      // secure: process.env.NODE_ENV === "production", // true on HTTPS
      secure: false,               // ✅ MUST be false on localhost
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });    
    return res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("login error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const refreshAccessToken = async (req, res) => {
  try {
    
    const refreshToken = req.cookies.refreshToken;

    // ✅ 1. No cookie → Unauthorized
    if (!refreshToken) {
      return res.status(401).json({ message: "No refresh token" });
    }

    // ✅ 2. Find user by refresh token in DB
    const user = await User.findOne({ refreshToken });

    if (!user) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // ✅ 3. Verify refresh token cryptographically
    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      (err, decoded) => {
        if (err) {
          return res.status(403).json({ message: "Refresh token expired" });
        }

        // ✅ 4. Generate new access token
        const newAccessToken = generateAccessToken({
          id: user._id,
          role: user.role,
        });

        return res.status(200).json({
           accessToken: newAccessToken,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        });
      }
    );
  } catch (error) {
    console.error("Refresh error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      const user = await User.findOne({ refreshToken });

      if (user) {
        user.refreshToken = null; // ✅ Kill session in DB
        await user.save();
      }
    }

    // ✅ Clear refresh token cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: false,     // ✅ localhost (true in production)
      sameSite: "lax",   // ✅ localhost ("strict" in production)
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};