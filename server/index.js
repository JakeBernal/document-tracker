require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const db = require("./config/db");
const requestRoutes = require("./routes/requestRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const receiptRoutes = require("./routes/receiptRoutes");
const reportRoutes = require("./routes/reportRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const superadminRoutes = require("./routes/superadminRoutes");

const app = express();
const PORT = process.env.PORT || 5001;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ================= UPLOAD DIRECTORY =================
const uploadsDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// ================= SIMPLE SECURITY HEADERS =================
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// ================= VALIDATION HELPERS =================
const cleanText = (value) => {
  return String(value || "").trim();
};

const cleanEmail = (value) => {
  return String(value || "").trim().toLowerCase();
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  return emailRegex.test(cleanEmail(email));
};

const isStrongPassword = (password) => {
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;

  return passwordRegex.test(password);
};

const isValidName = (name) => {
  return name.length >= 2 && name.length <= 100;
};

const buildSafeUser = (user) => {
  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    auth_provider: user.auth_provider || "local",
  };
};

const createSystemToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );
};

// ================= SIMPLE LOGIN ATTEMPT LIMITER =================
const loginAttempts = new Map();

const getLoginAttempt = (email) => {
  return (
    loginAttempts.get(email) || {
      count: 0,
      lockedUntil: 0,
    }
  );
};

const recordFailedLogin = (email) => {
  const current = getLoginAttempt(email);
  const nextCount = current.count + 1;

  const lockedUntil =
    nextCount >= 5 ? Date.now() + 5 * 60 * 1000 : current.lockedUntil;

  loginAttempts.set(email, {
    count: nextCount,
    lockedUntil,
  });
};

const resetLoginAttempt = (email) => {
  loginAttempts.delete(email);
};

const isLoginLocked = (email) => {
  const current = getLoginAttempt(email);

  if (!current.lockedUntil) {
    return false;
  }

  if (Date.now() > current.lockedUntil) {
    loginAttempts.delete(email);
    return false;
  }

  return true;
};

// ================= CORS =================
const corsOptions = {
  origin: CLIENT_URL,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));

// ================= BODY PARSER =================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ================= SERVE UPLOADED FILES =================
// NOTE: For MVP, this works. Later, protect sensitive upload files through a secured route.
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
    message: "Server is running.",
    port: PORT,
  });
});

// ================= AUTH RULES =================
app.get("/api/auth-rules", (req, res) => {
  return res.status(200).json({
    message: "Authentication rules loaded.",
    email_rules: [
      "Email must contain a username.",
      "Email must contain @.",
      "Email must contain a domain name.",
      "Email must contain a domain extension.",
    ],
    email_examples: [
      "jesse@gmail.com",
      "admin@outlook.com",
      "superadmin@papertrail.com",
    ],
    password_rules: [
      "At least 8 characters.",
      "At least 1 uppercase letter.",
      "At least 1 lowercase letter.",
      "At least 1 number.",
      "At least 1 special character.",
    ],
    password_example: "Jessezero2.",
  });
});

// Backward-compatible endpoint if frontend already uses it
app.get("/api/password-rules", (req, res) => {
  return res.status(200).json({
    message: "Password rules loaded.",
    rules: [
      "At least 8 characters.",
      "At least 1 uppercase letter.",
      "At least 1 lowercase letter.",
      "At least 1 number.",
      "At least 1 special character.",
    ],
    example: "Jessezero2.",
  });
});

// ================= AUTH ROUTES =================

// REGISTER
app.post("/api/register", async (req, res) => {
  const fullName = cleanText(req.body.full_name);
  const email = cleanEmail(req.body.email);
  const password = String(req.body.password || "");

  if (!fullName || !email || !password) {
    return res.status(400).json({
      message: "Please fill in all fields.",
    });
  }

  if (!isValidName(fullName)) {
    return res.status(400).json({
      message: "Full name must be from 2 to 100 characters.",
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      message: "Please enter a valid email address. Example: jesse@gmail.com",
    });
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({
      message:
        "Password must be at least 8 characters and include uppercase, lowercase, number, and special character. Example: Jessezero2.",
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 12);

    db.query(
      `INSERT INTO users
       (full_name, email, password, role, auth_provider)
       VALUES (?, ?, ?, ?, 'local')`,
      [fullName, email, hashedPassword, "citizen"],
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
  const email = cleanEmail(req.body.email);
  const password = String(req.body.password || "");

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required.",
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({
      message: "Please enter a valid email address. Example: jesse@gmail.com",
    });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      message: "JWT secret is not configured.",
    });
  }

  if (isLoginLocked(email)) {
    return res.status(429).json({
      message:
        "Too many failed login attempts. Please try again after 5 minutes.",
    });
  }

  db.query(
    "SELECT * FROM users WHERE email = ? LIMIT 1",
    [email],
    async (err, results) => {
      if (err) {
        console.error("LOGIN DATABASE ERROR:", err);

        return res.status(500).json({
          message: "Database error.",
          error: err.message,
        });
      }

      if (results.length === 0) {
        recordFailedLogin(email);

        return res.status(401).json({
          message: "Invalid email or password.",
        });
      }

      try {
        const user = results[0];

        if (!user.password) {
          recordFailedLogin(email);

          return res.status(400).json({
            message:
              "This account uses Google Sign-In. Please continue with Google.",
          });
        }

        const passwordMatched = await bcrypt.compare(password, user.password);

        if (!passwordMatched) {
          recordFailedLogin(email);

          return res.status(401).json({
            message: "Invalid email or password.",
          });
        }

        resetLoginAttempt(email);

        const token = createSystemToken(user);

        return res.status(200).json({
          message: "Login success.",
          user: buildSafeUser(user),
          token,
        });
      } catch (compareErr) {
        console.error("BCRYPT COMPARE ERROR:", compareErr);

        return res.status(500).json({
          message: "Server error.",
          error: compareErr.message,
        });
      }
    }
  );
});

// GOOGLE LOGIN
app.post("/api/google-login", async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({
      message: "Google credential is required.",
    });
  }

  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(500).json({
      message: "Google Client ID is not configured.",
    });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      message: "JWT secret is not configured.",
    });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email || !payload.sub) {
      return res.status(401).json({
        message: "Invalid Google account.",
      });
    }

    if (!payload.email_verified) {
      return res.status(401).json({
        message: "Google email is not verified.",
      });
    }

    const googleId = payload.sub;
    const email = cleanEmail(payload.email);
    const fullName = cleanText(payload.name) || email.split("@")[0];

    db.query(
      "SELECT * FROM users WHERE email = ? OR google_id = ? LIMIT 1",
      [email, googleId],
      (findErr, users) => {
        if (findErr) {
          console.error("GOOGLE FIND USER ERROR:", findErr);

          return res.status(500).json({
            message: "Database error while checking Google account.",
            error: findErr.message,
          });
        }

        if (users.length > 0) {
          const user = users[0];

          const finishLogin = (updatedUser) => {
            const token = createSystemToken(updatedUser);

            return res.status(200).json({
              message: "Google login success.",
              user: buildSafeUser(updatedUser),
              token,
            });
          };

          if (!user.google_id) {
            db.query(
              `UPDATE users
               SET google_id = ?
               WHERE id = ?`,
              [googleId, user.id],
              (updateErr) => {
                if (updateErr) {
                  console.error("GOOGLE LINK ACCOUNT ERROR:", updateErr);

                  return res.status(500).json({
                    message: "Database error while linking Google account.",
                    error: updateErr.message,
                  });
                }

                return finishLogin({
                  ...user,
                  google_id: googleId,
                });
              }
            );

            return;
          }

          return finishLogin(user);
        }

        db.query(
          `INSERT INTO users
           (full_name, email, password, role, google_id, auth_provider)
           VALUES (?, ?, NULL, 'citizen', ?, 'google')`,
          [fullName, email, googleId],
          (insertErr, result) => {
            if (insertErr) {
              console.error("GOOGLE CREATE USER ERROR:", insertErr);

              return res.status(500).json({
                message: "Database error while creating Google account.",
                error: insertErr.message,
              });
            }

            const newUser = {
              id: result.insertId,
              full_name: fullName,
              email,
              role: "citizen",
              google_id: googleId,
              auth_provider: "google",
            };

            const token = createSystemToken(newUser);

            return res.status(201).json({
              message: "Google account created and logged in.",
              user: buildSafeUser(newUser),
              token,
            });
          }
        );
      }
    );
  } catch (err) {
    console.error("GOOGLE LOGIN ERROR:", err);

    return res.status(401).json({
      message: "Google sign-in verification failed.",
      error: err.message,
    });
  }
});

// ================= API ROUTES =================
app.use("/api", requestRoutes);
app.use("/api", notificationRoutes);
app.use("/api", receiptRoutes);
app.use("/api", reportRoutes);
app.use("/api", feedbackRoutes);
app.use("/api", superadminRoutes);

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