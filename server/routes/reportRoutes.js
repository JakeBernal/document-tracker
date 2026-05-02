const express = require("express");
const router = express.Router();

const { getAdminReportSummary } = require("../controllers/reportController");
const { verifyToken, verifyAdmin } = require("../middleware/authMiddleware");

// Admin and Superadmin report summary
router.get("/admin/reports/summary", verifyToken, verifyAdmin, getAdminReportSummary);

module.exports = router;