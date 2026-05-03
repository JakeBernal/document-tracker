const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");
const { verifyToken, verifySuperadmin } = require("../middleware/authMiddleware");

const {
  getUsers,
  updateUserRole,
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

// ================= USERS =================
router.get("/superadmin/users", verifyToken, verifySuperadmin, getUsers);
router.put("/superadmin/users/:id/role", verifyToken, verifySuperadmin, updateUserRole);

// ================= REQUEST OVERRIDE =================
router.put(
  "/superadmin/requests/:id",
  verifyToken,
  verifySuperadmin,
  upload.fields([
    { name: "requirement_file", maxCount: 1 },
    { name: "uploaded_file", maxCount: 1 },
    { name: "file", maxCount: 1 },
    { name: "payment_proof", maxCount: 1 },
  ]),
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
