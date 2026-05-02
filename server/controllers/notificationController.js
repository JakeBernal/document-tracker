const db = require("../config/db");

const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

// ================= GET MY NOTIFICATIONS =================
exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await query(
      `SELECT *
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 30`,
      [userId]
    );

    const unreadResult = await query(
      `SELECT COUNT(*) AS unread_count
       FROM notifications
       WHERE user_id = ? AND is_read = FALSE`,
      [userId]
    );

    return res.json({
      notifications,
      unread_count: unreadResult[0]?.unread_count || 0,
    });
  } catch (err) {
    console.error("GET NOTIFICATIONS ERROR:", err);
    return res.status(500).json({
      message: "Database error",
    });
  }
};

// ================= MARK ONE AS READ =================
exports.markNotificationAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Notification not found.",
      });
    }

    return res.json({
      message: "Notification marked as read.",
    });
  } catch (err) {
    console.error("MARK NOTIFICATION READ ERROR:", err);
    return res.status(500).json({
      message: "Database error",
    });
  }
};

// ================= MARK ALL AS READ =================
exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE user_id = ?`,
      [userId]
    );

    return res.json({
      message: "All notifications marked as read.",
    });
  } catch (err) {
    console.error("MARK ALL NOTIFICATIONS READ ERROR:", err);
    return res.status(500).json({
      message: "Database error",
    });
  }
};

// ================= DELETE NOTIFICATION =================
exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await query(
      `DELETE FROM notifications
       WHERE id = ? AND user_id = ?`,
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Notification not found.",
      });
    }

    return res.json({
      message: "Notification deleted.",
    });
  } catch (err) {
    console.error("DELETE NOTIFICATION ERROR:", err);
    return res.status(500).json({
      message: "Database error",
    });
  }
};