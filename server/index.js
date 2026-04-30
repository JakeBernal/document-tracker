require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("./config/db");
const requestRoutes = require("./routes/requestRoutes");

const app = express();
const PORT = process.env.PORT || 5001;

// ================= CORS =================
const corsOptions = {
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// ================= SERVE UPLOADS =================
// This makes uploaded files accessible at http://localhost:5001/uploads/filename
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ================= LOGGING =================
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ================= AUTH ROUTES =================

// REGISTER
app.post("/api/register", async (req, res) => {
  const { full_name, email, password } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({ message: "Please fill in all fields" });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);

    db.query(
      "INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)",
      [full_name, email, hashed, "citizen"],
      (err, result) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ message: "Email already exists" });
          }
          console.error("REGISTER ERROR:", err);
          return res.status(500).json({ message: "Database error" });
        }

        res.status(201).json({
          message: "User registered successfully",
          userId: result.insertId,
        });
      }
    );
  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// LOGIN
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, results) => {
      if (err) {
        console.error("LOGIN ERROR:", err);
        return res.status(500).json({ message: "Database error" });
      }

      if (results.length === 0) {
        return res.status(401).json({ message: "User not found" });
      }

      try {
        const user = results[0];
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
          return res.status(401).json({ message: "Wrong password" });
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

        res.status(200).json({
          message: "Login success",
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
        res.status(500).json({ message: "Server error" });
      }
    }
  );
});

// ================= REQUEST ROUTES =================
app.use("/api", requestRoutes);

// ================= 404 HANDLER =================
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error("UNCAUGHT ERROR:", err);
  res.status(500).json({ message: "Internal server error" });
});

// ================= START SERVER =================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});