const express = require("express");
const router = express.Router();

const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const requestController = require("../controllers/requestController");

// ================= CITIZEN ROUTES =================
router.post(
  "/requests",
  verifyToken,
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "payment_proof", maxCount: 1 },
  ]),
  requestController.createRequest
);

router.get("/requests/my", verifyToken, requestController.getMyRequests);
router.get("/requests/:id", verifyToken, requestController.getRequestById);
router.delete("/requests/:id", verifyToken, requestController.cancelRequest);

router.put(
  "/requests/:id",
  verifyToken,
  upload.fields([
    { name: "uploaded_file", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ]),
  requestController.updateRequest
);

router.get("/appointments/my", verifyToken, requestController.getMyAppointments);

router.post(
  "/promo-codes/validate-senior",
  verifyToken,
  requestController.validateSeniorDiscountCode
);


// ================= ADMIN AND SUPERADMIN ROUTES =================
router.get(
  "/admin/requests",
  verifyToken,
  verifyAdmin,
  requestController.getAllRequests
);

router.put(
  "/admin/requests/:id/status",
  verifyToken,
  verifyAdmin,
  requestController.updateStatus
);

router.put(
  "/admin/requests/:id/payment",
  verifyToken,
  verifyAdmin,
  requestController.updatePayment
);

// Main backend route
router.put(
  "/admin/requests/:id/pickup",
  verifyToken,
  verifyAdmin,
  requestController.setPickupAppointment
);

// Compatibility route for your current Admin.jsx, which used /appointment
router.put(
  "/admin/requests/:id/appointment",
  verifyToken,
  verifyAdmin,
  requestController.setPickupAppointment
);

router.post(
  "/admin/requests/:id/upload",
  verifyToken,
  verifyAdmin,
  upload.single("file"),
  requestController.uploadFile
);

router.get(
  "/admin/appointments",
  verifyToken,
  verifyAdmin,
  requestController.getAllAppointments
);

module.exports = router;
