const express = require("express");
const router = express.Router();

const {
  submitFeedback,
  getMyFeedbackByRequest,
  getAllFeedback,
} = require("../controllers/feedbackController");

const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

// Citizen submits feedback after request is completed
router.post("/requests/:requestId/feedback", verifyToken, submitFeedback);

// Citizen checks own feedback for one request
router.get(
  "/requests/:requestId/feedback/my",
  verifyToken,
  getMyFeedbackByRequest
);

// Admin/Superadmin views all feedback
router.get("/admin/feedback", verifyToken, verifyAdmin, getAllFeedback);

module.exports = router;