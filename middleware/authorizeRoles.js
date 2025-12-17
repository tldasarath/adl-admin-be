export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }    
    // ✅ superadmin can access EVERYTHING
    if (req.user.role === "superadmin") {
      return next();
    }

    // ✅ admin can access ONLY allowed routes
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Forbidden: You don't have permission",
      });
    }

    next();
  };
};
