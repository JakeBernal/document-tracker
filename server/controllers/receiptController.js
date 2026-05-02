const db = require("../config/db");

const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

const parseFormData = (value) => {
  if (!value) return {};

  if (typeof value === "object") return value;

  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

// ================= GET RECEIPT BY REQUEST ID =================
exports.getReceiptByRequestId = async (req, res) => {
  try {
    const { requestId } = req.params;

    const rows = await query(
      `SELECT
          rc.*,
          r.id AS request_id,
          r.user_id,
          r.status AS request_status,
          r.payment_status,
          r.form_data,
          r.created_at AS date_submitted,
          u.full_name AS citizen_name,
          u.email AS citizen_email,
          dt.name AS document_name
       FROM receipts rc
       LEFT JOIN requests r ON rc.request_id = r.id
       LEFT JOIN users u ON r.user_id = u.id
       LEFT JOIN document_types dt ON r.document_type_id = dt.id
       WHERE rc.request_id = ?
       LIMIT 1`,
      [requestId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: "Receipt not found.",
      });
    }

    const receipt = rows[0];

    const isOwner = req.user.id.toString() === receipt.user_id.toString();
    const isAdmin =
      req.user.role === "admin" || req.user.role === "superadmin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "Unauthorized access.",
      });
    }

    const parsedFormData = parseFormData(receipt.form_data);

    const cleanReceipt = {
      receipt_id: receipt.id,
      request_id: receipt.request_id,
      receipt_number: receipt.receipt_number,
      citizen_name: receipt.citizen_name || "Citizen",
      citizen_email: receipt.citizen_email || "",
      document_requested:
        receipt.document_name ||
        parsedFormData.document_name ||
        parsedFormData.parent_document ||
        "Document Request",
      document_fee: Number(receipt.document_fee || 0),
      system_fee: Number(receipt.system_fee || 0),
      discount_amount: Number(receipt.discount_amount || 0),
      total_amount: Number(receipt.total_amount || 0),
      payment_method: receipt.payment_method || "None",
      payment_reference: receipt.payment_reference || "N/A",
      date_submitted: receipt.date_submitted,
      issued_at: receipt.issued_at,
      payment_status: receipt.payment_status || "Unpaid",
      request_status: receipt.request_status || "Pending",
    };

    return res.json({
      receipt: cleanReceipt,
    });
  } catch (err) {
    console.error("GET RECEIPT ERROR:", err);

    return res.status(500).json({
      message: "Database error.",
      error: err.message,
    });
  }
};