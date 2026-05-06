const express = require("express");
const router = express.Router();

const { registerUser, loginUser } = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/me", verifyToken, (req, res) => {
  return res.status(200).json({
    message: "Authenticated user fetched successfully.",
    user: req.user,
  });
});

module.exports = router;