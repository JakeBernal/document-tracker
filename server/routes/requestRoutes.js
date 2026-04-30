const express = require("express");
const router = express.Router();
const {
  createRequest,
  getMyRequests,
  getRequestById,
  getAllRequests,
  updateStatus,
  updatePayment,
  uploadFile,
} = require("../controllers/requestController");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

// ================= CITIZEN ROUTES =================

// Submit new request (with file upload)
router.post("/requests", verifyToken, upload.single("file"), createRequest);

// Get my own requests — uses token to identify user, no user_id in URL
router.get("/requests/my", verifyToken, getMyRequests);

// Get single request by ID
router.get("/requests/:id", verifyToken, getRequestById);

// ================= ADMIN ROUTES =================

// Get ALL requests
router.get("/admin/requests", verifyToken, verifyAdmin, getAllRequests);

// Update request status  ← THIS is what admin.jsx calls
router.put("/admin/requests/:id/status", verifyToken, verifyAdmin, updateStatus);

// Update payment info   ← THIS is what admin.jsx calls
router.put("/admin/requests/:id/payment", verifyToken, verifyAdmin, updatePayment);

// Upload file for existing request
router.post("/requests/:id/upload", verifyToken, upload.single("file"), uploadFile);

module.exports = router;