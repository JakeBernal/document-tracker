const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const db = require("./db");
const requestRoutes = require('./routes/requestRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api', requestRoutes);

/* ================= AUTH ================= */

// REGISTER
app.post("/api/register", async (req, res) => {
  const { full_name, email, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  db.query(
    "INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)",
    [full_name, email, hashed],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "User registered!" });
    }
  );
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

/* ================= DOCUMENTS ================= */

// CREATE REQUEST
app.post("/api/request", (req, res) => {
  const { user_id, document_type } = req.body;

  db.query(
    "INSERT INTO requests (user_id, document_type) VALUES (?, ?)",
    [user_id, document_type],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Request submitted!" });
    }
  );
});

// GET USER REQUESTS
app.get("/api/requests/:user_id", (req, res) => {
  const user_id = req.params.user_id;

  db.query(
    "SELECT * FROM requests WHERE user_id = ?",
    [user_id],
    (err, results) => {
      if (err) return res.status(500).json(err);
      res.json(results);
    }
  );
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});