const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Access denied. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: "Server authentication configuration is missing.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.id || decoded.user_id,
      role: decoded.role,
      email: decoded.email || null,
    };

    if (!req.user.id || !req.user.role) {
      return res.status(401).json({
        message: "Invalid token payload.",
      });
    }

    next();
  } catch (error) {
    console.error("VERIFY TOKEN ERROR:", error.message);

    return res.status(401).json({
      message: "Invalid or expired token.",
    });
  }
};

const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized. Please log in first.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied. You are not allowed to perform this action.",
      });
    }

    next();
  };
};

const verifyCitizen = (req, res, next) => {
  return allowRoles("citizen")(req, res, next);
};

const verifyAdmin = (req, res, next) => {
  return allowRoles("admin", "superadmin")(req, res, next);
};

const verifySuperadmin = (req, res, next) => {
  return allowRoles("superadmin")(req, res, next);
};

module.exports = {
  verifyToken,
  allowRoles,
  verifyCitizen,
  verifyAdmin,
  verifySuperadmin,
};