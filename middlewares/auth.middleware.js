const { verifyToken } = require("../utils/auth");

const authMiddleware = () => {
  return async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Token bulunamadı" });
    }

    try {
      const decoded = verifyToken(token);
      req.user = {
        userId: decoded.id,
        role: decoded.role
      };
      next();
    } catch (error) {
      console.error("Token verification error:", error);
      res.status(401).json({ message: "Geçersiz token", error: error.message });
    }
  };
};

module.exports = authMiddleware;
