const express = require("express");
const router = express.Router();

const {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} = require("../controllers/notificationController");

const { verifyToken } = require("../middleware/authMiddleware");

// Get logged-in user's notifications
router.get("/notifications", verifyToken, getMyNotifications);

// Mark one notification as read
router.put("/notifications/:id/read", verifyToken, markNotificationAsRead);

// Mark all notifications as read
router.put("/notifications/read-all", verifyToken, markAllNotificationsAsRead);

// Delete one notification
router.delete("/notifications/:id", verifyToken, deleteNotification);

module.exports = router;