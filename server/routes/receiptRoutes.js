const express = require("express");
const router = express.Router();

const { getReceiptByRequestId } = require("../controllers/receiptController");
const { verifyToken } = require("../middleware/authMiddleware");

// Get receipt using request ID
router.get("/receipts/request/:requestId", verifyToken, getReceiptByRequestId);

module.exports = router;    