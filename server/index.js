require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const db = require("./config/db");
const requestRoutes = require("./routes/requestRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const receiptRoutes = require("./routes/receiptRoutes");
const reportRoutes = require("./routes/reportRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");

const app = express();
const PORT = process.env.PORT || 5001;

// ================= UPLOAD DIRECTORY =================
const uploadsDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ================= CORS =================
const corsOptions = {
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));

// ================= BODY PARSER =================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= SERVE UPLOADED FILES =================
app.use("/uploads", express.static(uploadsDir));
app.use("/server/uploads", express.static(uploadsDir));

// ================= LOGGING =================
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ================= HEALTH CHECK =================
app.get("/api/health", (req, res) => {
  return res.status(200).json({
    message: "Server is running",
    port: PORT,
  });
});

// ================= AUTH ROUTES =================

// REGISTER
app.post("/api/register", async (req, res) => {
  const { full_name, email, password } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({
      message: "Please fill in all fields.",
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      "INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)",
      [full_name, email, hashedPassword, "citizen"],
      (err, result) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(400).json({
              message: "Email already exists.",
            });
          }

          console.error("REGISTER DATABASE ERROR:", err);

          return res.status(500).json({
            message: "Database error.",
            error: err.message,
          });
        }

        return res.status(201).json({
          message: "User registered successfully.",
          userId: result.insertId,
        });
      }
    );
  } catch (err) {
    console.error("REGISTER SERVER ERROR:", err);

    return res.status(500).json({
      message: "Server error.",
      error: err.message,
    });
  }
});

// LOGIN
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required.",
    });
  }

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) {
      console.error("LOGIN DATABASE ERROR:", err);

      return res.status(500).json({
        message: "Database error.",
        error: err.message,
      });
    }

    if (results.length === 0) {
      return res.status(401).json({
        message: "User not found.",
      });
    }

    try {
      const user = results[0];
      const passwordMatched = await bcrypt.compare(password, user.password);

      if (!passwordMatched) {
        return res.status(401).json({
          message: "Wrong password.",
        });
      }

      if (!process.env.JWT_SECRET) {
        return res.status(500).json({
          message: "JWT secret is not configured.",
        });
      }

      const token = jwt.sign(
        {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "2h" }
      );

      return res.status(200).json({
        message: "Login success.",
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
        },
        token,
      });
    } catch (compareErr) {
      console.error("BCRYPT COMPARE ERROR:", compareErr);

      return res.status(500).json({
        message: "Server error.",
        error: compareErr.message,
      });
    }
  });
});

// ================= API ROUTES =================
app.use("/api", requestRoutes);
app.use("/api", notificationRoutes);
app.use("/api", receiptRoutes);
app.use("/api", reportRoutes);
app.use("/api", feedbackRoutes);

// ================= 404 HANDLER =================
app.use((req, res) => {
  return res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
  });
});

// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error("UNCAUGHT ERROR:", err);

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({
      message: `Unexpected file field: ${err.field}`,
    });
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      message: "Uploaded file is too large.",
    });
  }

  return res.status(500).json({
    message: "Internal server error.",
    error: err.message,
  });
});

// ================= START SERVER =================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Uploads served at http://localhost:${PORT}/uploads`);
});