const express = require("express");
const router = express.Router();

const {
  createRequest,
  getMyRequests,
  getRequestById,
  updateStatus,
  uploadFile
} = require("../controllers/requestController");

const upload = require("../middleware/upload");

// CREATE REQUEST
router.post("/requests", createRequest);

// GET USER REQUESTS
router.get("/requests/my/:user_id", getMyRequests);

// GET SINGLE REQUEST
router.get("/requests/:id", getRequestById);

// UPLOAD FILE
router.post("/upload", upload.single("file"), uploadFile);

// UPDATE STATUS (ADMIN)
router.put("/requests/:id/status", updateStatus);

module.exports = router;