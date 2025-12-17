import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // ✅ 1. Check token exists
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const token = authHeader.split(" ")[1];

    // ✅ 2. Verify token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return res.status(401).json({ message: "Access token expired" });
        }

        return res.status(401).json({ message: "Invalid access token" });
      }

      // ✅ 3. Attach user to request
      req.user = decoded; // { id, role }
      next();
    });
  } catch (error) {
    return res.status(500).json({ message: "Auth middleware error" });
  }
};
