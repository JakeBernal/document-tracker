const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: "JWT secret is not configured.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    console.error("VERIFY TOKEN ERROR:", error.message);

    return res.status(401).json({
      message: "Invalid or expired token.",
    });
  }
};

const verifyAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Unauthorized.",
    });
  }

  if (req.user.role !== "admin" && req.user.role !== "superadmin") {
    return res.status(403).json({
      message: "Admin access only.",
    });
  }

  next();
};

const verifySuperadmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Unauthorized.",
    });
  }

  if (req.user.role !== "superadmin") {
    return res.status(403).json({
      message: "Superadmin access only.",
    });
  }

  next();
};

module.exports = {
  verifyToken,
  verifyAdmin,
  verifySuperadmin,
};