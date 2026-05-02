const db = require("../config/db");

const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

// ================= SUBMIT FEEDBACK =================
exports.submitFeedback = async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;
    const { rating, comment } = req.body;

    const finalRating = Number(rating);

    if (!finalRating || finalRating < 1 || finalRating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5.",
      });
    }

    const requestRows = await query(
      `SELECT id, user_id, status
       FROM requests
       WHERE id = ?`,
      [requestId]
    );

    if (requestRows.length === 0) {
      return res.status(404).json({
        message: "Request not found.",
      });
    }

    const request = requestRows[0];

    if (request.user_id.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "You can only review your own request.",
      });
    }

    if (request.status !== "Completed") {
      return res.status(400).json({
        message: "Feedback is allowed only after the request is completed.",
      });
    }

    await query(
      `INSERT INTO feedback (request_id, user_id, rating, comment)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         rating = VALUES(rating),
         comment = VALUES(comment),
         created_at = CURRENT_TIMESTAMP`,
      [requestId, userId, finalRating, comment || null]
    );

    return res.status(201).json({
      message: "Feedback submitted successfully.",
    });
  } catch (err) {
    console.error("SUBMIT FEEDBACK ERROR:", err);

    return res.status(500).json({
      message: "Database error.",
      error: err.message,
    });
  }
};

// ================= GET MY FEEDBACK FOR REQUEST =================
exports.getMyFeedbackByRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;

    const rows = await query(
      `SELECT *
       FROM feedback
       WHERE request_id = ? AND user_id = ?
       LIMIT 1`,
      [requestId, userId]
    );

    return res.json({
      feedback: rows[0] || null,
    });
  } catch (err) {
    console.error("GET MY FEEDBACK ERROR:", err);

    return res.status(500).json({
      message: "Database error.",
      error: err.message,
    });
  }
};

// ================= GET ALL FEEDBACK FOR ADMIN =================
exports.getAllFeedback = async (req, res) => {
  try {
    const rows = await query(
      `SELECT
          f.id,
          f.request_id,
          f.user_id,
          f.rating,
          f.comment,
          f.created_at,
          u.full_name AS citizen_name,
          u.email AS citizen_email,
          r.status AS request_status,
          dt.name AS document_name
       FROM feedback f
       LEFT JOIN users u ON f.user_id = u.id
       LEFT JOIN requests r ON f.request_id = r.id
       LEFT JOIN document_types dt ON r.document_type_id = dt.id
       ORDER BY f.created_at DESC`
    );

    const summaryRows = await query(
      `SELECT
          COUNT(*) AS total_feedback,
          IFNULL(AVG(rating), 0) AS average_rating,
          SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) AS five_star_count,
          SUM(CASE WHEN rating <= 2 THEN 1 ELSE 0 END) AS low_rating_count
       FROM feedback`
    );

    return res.json({
      summary: {
        total_feedback: Number(summaryRows[0]?.total_feedback || 0),
        average_rating: Number(summaryRows[0]?.average_rating || 0),
        five_star_count: Number(summaryRows[0]?.five_star_count || 0),
        low_rating_count: Number(summaryRows[0]?.low_rating_count || 0),
      },
      feedback: rows,
    });
  } catch (err) {
    console.error("GET ALL FEEDBACK ERROR:", err);

    return res.status(500).json({
      message: "Database error.",
      error: err.message,
    });
  }
};