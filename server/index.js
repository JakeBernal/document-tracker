const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const db = require("./config/db");

const requestRoutes = require("./routes/requestRoutes");

const app = express();

/* ================= MIDDLEWARE ================= */

app.use((req, res, next) => {
  console.log("🔥 HIT:", req.method, req.url);
  next();
});

// CORS
app.use(cors());
app.use(express.json());

/* ================= AUTH ROUTES ================= */

// REGISTER
app.post("/api/register", async (req, res) => {
  const { full_name, email, password } = req.body;

  try {
    const hashed = await bcrypt.hash(password, 10);

    db.query(
      "INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)",
      [full_name, email, hashed],
      (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "User registered successfully" });
      }
    );
  } catch (err) {
    res.status(500).json({ message: "Server error", err });
  }
});

// LOGIN
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, results) => {
      if (err) return res.status(500).json(err);
      if (results.length === 0)
        return res.status(401).json({ message: "User not found" });

      const user = results[0];
      const match = await bcrypt.compare(password, user.password);

      if (!match)
        return res.status(401).json({ message: "Wrong password" });

      res.json({ message: "Login success", user });
    }
  );
});

/* ================= REQUEST ROUTES ================= */

app.use("/api", requestRoutes);

/* ================= START SERVER ================= */

app.listen(5000, () => {
  console.log("Server running on port 5000");
});