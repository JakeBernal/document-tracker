const db = require("../config/db");
const path = require("path");

// ================= CREATE REQUEST =================
exports.createRequest = (req, res) => {
  const userId = req.user.id; // from token — not from body (security)
  const { document_type_id, notes } = req.body;

  // File path if uploaded
  const filePath = req.file ? req.file.path.replaceAll("\\", "/") : null;

  const sql = `
    INSERT INTO requests (user_id, document_type_id, notes, form_data)
    VALUES (?, ?, ?, ?)
  `;

  // Parse notes as form_data JSON
  let formDataJson = null;
  try {
    formDataJson = notes ? JSON.stringify(JSON.parse(notes)) : null;
  } catch (e) {
    formDataJson = notes ? JSON.stringify({ raw: notes }) : null;
  }

  db.query(
    sql,
    [userId, document_type_id || null, null, formDataJson],
    (err, result) => {
      if (err) {
        console.error("CREATE REQUEST ERROR:", err);
        return res.status(500).json({ message: "Database error", error: err.message });
      }

      const requestId = result.insertId;

      // If file was uploaded, save to uploads table
      if (filePath) {
        db.query(
          "INSERT INTO uploads (request_id, file_path) VALUES (?, ?)",
          [requestId, filePath],
          (uploadErr) => {
            if (uploadErr) {
              console.error("UPLOAD INSERT ERROR:", uploadErr);
            }
          }
        );
      }

      res.status(201).json({ message: "Request submitted successfully!", requestId });
    }
  );
};

// ================= GET MY REQUESTS (CITIZEN) =================
// Uses token user id — no user_id in URL needed
exports.getMyRequests = (req, res) => {
  const userId = req.user.id;

  db.query(
    `SELECT r.*, dt.name AS document_name,
            u2.file_path
     FROM requests r
     LEFT JOIN document_types dt ON r.document_type_id = dt.id
     LEFT JOIN uploads u2 ON u2.request_id = r.id
     WHERE r.user_id = ?
     ORDER BY r.created_at DESC`,
    [userId],
    (err, results) => {
      if (err) {
        console.error("GET MY REQUESTS ERROR:", err);
        return res.status(500).json({ message: "Database error" });
      }

      const formatted = results.map((r) => {
        let docName = r.document_name;

        if (!docName && r.form_data) {
          try {
            const fd =
              typeof r.form_data === "string"
                ? JSON.parse(r.form_data)
                : r.form_data;
            docName = fd.document_name || fd.parent_document || null;
          } catch (e) {}
        }

        return {
          ...r,
          document_name: docName || "Document Request",
        };
      });

      return res.status(200).json({ requests: formatted });
    }
  );
};

// ================= GET SINGLE REQUEST =================
exports.getRequestById = (req, res) => {
  const requestId = req.params.id;

  db.query(
    `SELECT r.*, dt.name AS document_name, u2.file_path
     FROM requests r
     LEFT JOIN document_types dt ON r.document_type_id = dt.id
     LEFT JOIN uploads u2 ON u2.request_id = r.id
     WHERE r.id = ?`,
    [requestId],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Database error" });

      if (results.length === 0) {
        return res.status(404).json({ message: "Request not found" });
      }

      const r = results[0];

      // Only owner or admin can view
      if (
        req.user.id.toString() !== r.user_id.toString() &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({ message: "Unauthorized access" });
      }

      return res.status(200).json({ request: r });
    }
  );
};

// ================= GET ALL REQUESTS (ADMIN) =================
exports.getAllRequests = (req, res) => {
  db.query(
    `SELECT r.*,
            u.full_name AS citizen_name,
            u.email,
            dt.name AS document_name,
            up.file_path
     FROM requests r
     LEFT JOIN users u ON r.user_id = u.id
     LEFT JOIN document_types dt ON r.document_type_id = dt.id
     LEFT JOIN uploads up ON up.request_id = r.id
     ORDER BY r.created_at DESC`,
    (err, results) => {
      if (err) {
        console.error("GET ALL REQUESTS ERROR:", err);
        return res.status(500).json({ message: "Database error" });
      }

      return res.status(200).json({ requests: results });
    }
  );
};

// ================= UPDATE STATUS (ADMIN) =================
exports.updateStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = [
    "Pending",
    "Processing",
    "Needs More Info",
    "Rejected",
    "Approved",
    "Ready for Pickup",
    "Completed",
  ];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  db.query(
    "UPDATE requests SET status = ? WHERE id = ?",
    [status, id],
    (err, result) => {
      if (err) {
        console.error("UPDATE STATUS ERROR:", err);
        return res.status(500).json({ message: "Database error" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Request not found" });
      }

      return res.json({ message: "Status updated!" });
    }
  );
};

// ================= UPDATE PAYMENT (ADMIN) =================
exports.updatePayment = (req, res) => {
  const { id } = req.params;
  const { payment_status, payment_method, payment_reference, amount_due } = req.body;

  const validPaymentStatuses = ["Unpaid", "Paid", "Waived"];

  if (!validPaymentStatuses.includes(payment_status)) {
    return res.status(400).json({ message: "Invalid payment status" });
  }

  db.query(
    `UPDATE requests
     SET payment_status = ?,
         payment_method = ?,
         payment_reference = ?,
         amount_due = ?,
         paid_at = ?
     WHERE id = ?`,
    [
      payment_status,
      payment_method || "None",
      payment_reference || null,
      amount_due || 0,
      payment_status === "Paid" ? new Date() : null,
      id,
    ],
    (err, result) => {
      if (err) {
        console.error("UPDATE PAYMENT ERROR:", err);
        return res.status(500).json({ message: "Database error" });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Request not found" });
      }

      return res.json({ message: "Payment updated!" });
    }
  );
};

// ================= FILE UPLOAD FOR EXISTING REQUEST =================
exports.uploadFile = (req, res) => {
  const { id } = req.params;

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const filePath = req.file.path.replaceAll("\\", "/");

  db.query(
    "INSERT INTO uploads (request_id, file_path) VALUES (?, ?)",
    [id, filePath],
    (err) => {
      if (err) {
        console.error("FILE UPLOAD ERROR:", err);
        return res.status(500).json({ message: "Database error" });
      }

      return res.json({ message: "File uploaded successfully!", filePath });
    }
  );
};