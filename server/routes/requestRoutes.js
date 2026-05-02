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
  setPickupAppointment,
  getMyAppointments,
  getAllAppointments,
} = require("../controllers/requestController");

const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

// ================= CITIZEN REQUEST ROUTES =================

// Submit new request with requirement file and optional payment proof
router.post(
  "/requests",
  verifyToken,
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "payment_proof", maxCount: 1 },
  ]),
  createRequest
);

// Get my own requests
router.get("/requests/my", verifyToken, getMyRequests);

// Backward compatibility if old frontend still uses /requests/user/:user_id
router.get("/requests/user/:user_id", verifyToken, getMyRequests);

// Get single request by ID
router.get("/requests/:id", verifyToken, getRequestById);

// ================= CITIZEN APPOINTMENT ROUTES =================

// Citizen sees own pickup schedule
router.get("/appointments/my", verifyToken, getMyAppointments);

// ================= ADMIN REQUEST ROUTES =================

// Get all requests
router.get("/admin/requests", verifyToken, verifyAdmin, getAllRequests);

// Update request status
router.put(
  "/admin/requests/:id/status",
  verifyToken,
  verifyAdmin,
  updateStatus
);

// Update payment info
router.put(
  "/admin/requests/:id/payment",
  verifyToken,
  verifyAdmin,
  updatePayment
);

// Admin sets pickup date and time
router.put(
  "/admin/requests/:id/appointment",
  verifyToken,
  verifyAdmin,
  setPickupAppointment
);

// Admin sees all appointment schedules
router.get(
  "/admin/appointments",
  verifyToken,
  verifyAdmin,
  getAllAppointments
);

// Upload released document or extra file for existing request
router.post(
  "/requests/:id/upload",
  verifyToken,
  upload.single("file"),
  uploadFile
);

module.exports = router;