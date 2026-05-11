const db = require("../config/db");

const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

// ================= ADMIN / SUPERADMIN REPORT SUMMARY =================
exports.getAdminReportSummary = async (req, res) => {
  try {
    const summaryRows = await query(`
      SELECT
        COUNT(*) AS total_requests,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending_requests,
        SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) AS approved_requests,
        SUM(CASE WHEN status = 'Ready for Pickup' THEN 1 ELSE 0 END) AS ready_for_pickup_requests,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) AS completed_requests,
        IFNULL(SUM(CASE
          WHEN payment_status = 'Paid'
          THEN total_amount
          ELSE 0
        END), 0) AS total_payment_collected,
        IFNULL(SUM(CASE
          WHEN payment_status = 'Paid'
          THEN system_fee
          ELSE 0
        END), 0) AS total_system_fee_revenue
      FROM requests
    `);

    const mostRequestedDocuments = await query(`
      SELECT
        COALESCE(dt.name, 'Document Request') AS document_name,
        COUNT(r.id) AS total_requests
      FROM requests r
      LEFT JOIN document_types dt ON r.document_type_id = dt.id
      GROUP BY COALESCE(dt.name, 'Document Request')
      ORDER BY total_requests DESC
      LIMIT 5
    `);

    const statusBreakdown = await query(`
      SELECT
        status,
        COUNT(*) AS total
      FROM requests
      GROUP BY status
      ORDER BY total DESC
    `);

    const paymentBreakdown = await query(`
      SELECT
        payment_status,
        COUNT(*) AS total
      FROM requests
      GROUP BY payment_status
      ORDER BY total DESC
    `);

    const summary = summaryRows[0] || {};

    return res.json({
      summary: {
        total_requests: Number(summary.total_requests || 0),
        pending_requests: Number(summary.pending_requests || 0),
        approved_requests: Number(summary.approved_requests || 0),
        ready_for_pickup_requests: Number(summary.ready_for_pickup_requests || 0),
        completed_requests: Number(summary.completed_requests || 0),
        total_payment_collected: Number(summary.total_payment_collected || 0),
        total_system_fee_revenue: Number(summary.total_system_fee_revenue || 0),
      },
      most_requested_documents: mostRequestedDocuments,
      status_breakdown: statusBreakdown,
      payment_breakdown: paymentBreakdown,
    });
  } catch (err) {
    console.error("GET ADMIN REPORT SUMMARY ERROR:", err);

    return res.status(500).json({
      message: "Database error.",
      error: err.message,
    });
  }
};
