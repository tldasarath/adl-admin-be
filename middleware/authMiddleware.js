
import User from "../models/userModel.js";
import { verifyToken } from "../utils/jwtToken.js";


export const protect = async (req, res, next) => {
  try {
    let token;

    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) token = authHeader.split(" ")[1];
    else if (req.cookies && req.cookies.token) token = req.cookies.token;

    if (!token) return res.status(401).json({ success: false, message: "Not authorized, token missing" });

    const payload = verifyToken(token);
    if (!payload || !payload.id) return res.status(401).json({ success: false, message: "Invalid or expired token" });

    const user = await User.findById(payload.id).select("-password");
    if (!user || !user.isActive) return res.status(401).json({ success: false, message: "User not found or disabled" });

    req.user = user;
    return next();
  } catch (err) {
    console.error("protect error:", err);
    return res.status(401).json({ success: false, message: "Not authorized" });
  }
};


export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role || !roles.includes(role)) {
      return res.status(403).json({ success: false, message: "Forbidden: insufficient permissions" });
    }
    next();
  };
};
