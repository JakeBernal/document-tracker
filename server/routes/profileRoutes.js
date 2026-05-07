const express = require("express");
const router = express.Router();

const { verifyToken } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const profileController = require("../controllers/profileController");

router.get("/profile", verifyToken, profileController.getMyProfile);

router.post(
  "/profile",
  verifyToken,
  upload.single("valid_id"),
  profileController.saveMyProfile
);

router.put(
  "/profile",
  verifyToken,
  upload.single("valid_id"),
  profileController.saveMyProfile
);

module.exports = router;
