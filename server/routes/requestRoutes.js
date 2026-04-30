const express = require("express");
const router = express.Router();

const requestController = require("../controllers/requestController");

router.post("/requests", requestController.createRequest);
router.get("/requests/user/:user_id", requestController.getMyRequests);
router.get("/requests/:id", requestController.getRequestById);
router.put("/requests/:id/status", requestController.updateStatus);
router.post("/requests/:id/upload", requestController.uploadFile);

module.exports = router;