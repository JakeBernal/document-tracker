const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const db = require("./config/db");
const requestRoutes = require("./routes/requestRoutes");

const app = express();
const PORT = process.env.PORT || 5001;

const corsOptions = {
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

/* ================= MIDDLEWARE ================= */
app.use(cors(corsOptions));
app.use(express.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:5173");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

app.use((req, res, next) => {
  console.log("HIT:", req.method, req.url);
  next();
});

/* ================= AUTH ROUTES ================= */

// REGISTER
app.post("/api/register", async (req, res) => {
  console.log("REGISTER BODY:", req.body);

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
          console.log("REGISTER ERROR:", err);

          if (err.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ message: "Email already exists" });
          }

          return res.status(500).json({ message: "Database error" });
        }

        return res.status(201).json({
          message: "User registered successfully",
          userId: result.insertId,
        });
      }
    );
  } catch (err) {
    console.log("SERVER ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// LOGIN
app.post("/api/login", (req, res) => {
  console.log("LOGIN BODY:", req.body);

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, results) => {
      if (err) {
        console.log("LOGIN ERROR:", err);
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

        return res.status(200).json({
          message: "Login success",
          user: {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
          },
        });
      } catch (compareErr) {
        console.log("BCRYPT COMPARE ERROR:", compareErr);
        return res.status(500).json({ message: "Server error" });
      }
    }
  );
});

/* ================= OTHER ROUTES ================= */
app.use("/api", requestRoutes);

/* ================= 404 HANDLER ================= */
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

/* ================= START SERVER ================= */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});