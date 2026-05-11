const express = require("express");
const router = express.Router();

const { verifyToken, verifySuperadmin } = require("../middleware/authMiddleware");

const {
  getStats,
  getUsers,
  createAdminUser,
  updateUserRole,
  deleteUser,
  getRequests,
  updateRequestOverride,
  deleteRequestOverride,
  getDocumentTypes,
  createDocumentType,
  updateDocumentType,
  deleteDocumentType,
  getPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
} = require("../controllers/superadminController");

// ================= OVERVIEW =================
router.get("/superadmin/stats", verifyToken, verifySuperadmin, getStats);

// ================= USERS =================
router.get("/superadmin/users", verifyToken, verifySuperadmin, getUsers);
router.post("/superadmin/users/create-admin", verifyToken, verifySuperadmin, createAdminUser);
router.put("/superadmin/users/:id/role", verifyToken, verifySuperadmin, updateUserRole);
router.delete("/superadmin/users/:id", verifyToken, verifySuperadmin, deleteUser);

// ================= REQUEST MANAGEMENT AND OVERRIDE DATA ONLY =================
// Files are read-only for admin and superadmin. Wrong files must be corrected by the citizen after status is set to Needs More Info.
router.get("/superadmin/requests", verifyToken, verifySuperadmin, getRequests);

router.put(
  "/superadmin/requests/:id",
  verifyToken,
  verifySuperadmin,
  updateRequestOverride
);

router.delete(
  "/superadmin/requests/:id",
  verifyToken,
  verifySuperadmin,
  deleteRequestOverride
);

// ================= DOCUMENT TYPES =================
router.get("/superadmin/document-types", verifyToken, verifySuperadmin, getDocumentTypes);
router.post("/superadmin/document-types", verifyToken, verifySuperadmin, createDocumentType);
router.put("/superadmin/document-types/:id", verifyToken, verifySuperadmin, updateDocumentType);
router.delete("/superadmin/document-types/:id", verifyToken, verifySuperadmin, deleteDocumentType);

// ================= PROMO CODES =================
router.get("/superadmin/promo-codes", verifyToken, verifySuperadmin, getPromoCodes);
router.post("/superadmin/promo-codes", verifyToken, verifySuperadmin, createPromoCode);
router.put("/superadmin/promo-codes/:id", verifyToken, verifySuperadmin, updatePromoCode);
router.delete("/superadmin/promo-codes/:id", verifyToken, verifySuperadmin, deletePromoCode);

module.exports = router;
