const express = require('express');
const router = express.Router();

// Controllers
const {
  createRequest,
  getMyRequests,
  getRequestById,
  updateStatus,
  uploadFile
} = require('../controllers/requestController');

// Upload middleware
const upload = require('../middleware/upload');


// =========================
// 👤 CITIZEN ROUTES
// =========================

// Create new request
router.post('/requests', createRequest);

// Get all requests of a user
router.get('/requests/my/:user_id', getMyRequests);

// Get single request
router.get('/requests/:id', getRequestById);

// Upload file (linked to request)
router.post('/upload', upload.single('file'), uploadFile);


// =========================
// 🧑‍💼 ADMIN ROUTES
// =========================

// Update request status
router.put('/requests/:id/status', updateStatus);


module.exports = router;