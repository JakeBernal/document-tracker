const db = require("../config/db");

const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

const allowedRoles = ["citizen", "admin", "superadmin"];
const allowedStatuses = [
  "Pending",
  "Processing",
  "Needs More Info",
  "Rejected",
  "Approved",
  "Ready for Pickup",
  "Completed",
];
const allowedPaymentStatuses = ["Unpaid", "Paid", "Waived"];
const allowedPaymentMethods = [
  "None",
  "Cash",
  "GCash",
  "PayMaya",
  "Bank Transfer",
  "Other",
];

const normalizePath = (file) => {
  if (!file) return null;

  if (file.filename) {
    return `uploads/${file.filename}`;
  }

  const rawPath = String(file.path || "").replaceAll("\\", "/");
  const uploadsIndex = rawPath.indexOf("uploads/");

  if (uploadsIndex !== -1) {
    return rawPath.substring(uploadsIndex);
  }

  return rawPath;
};

const safeJsonParse = (value) => {
  if (!value) return {};
  if (typeof value === "object") return value;

  try {
    return JSON.parse(value);
  } catch {
    return { raw: value };
  }
};

const getFirstUploadedFile = (req, fieldName) => {
  if (req.files && req.files[fieldName] && req.files[fieldName][0]) {
    return req.files[fieldName][0];
  }

  if (fieldName === "file" && req.file) {
    return req.file;
  }

  return null;
};

const cleanNullable = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (String(value).trim() === "") return null;
  return value;
};

const cleanNumber = (value, fallback = 0) => {
  if (value === undefined || value === null || value === "") return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const createNotification = async (userId, requestId, title, message) => {
  try {
    await query(
      `INSERT INTO notifications (user_id, request_id, title, message)
       VALUES (?, ?, ?, ?)`,
      [userId, requestId, title, message]
    );
  } catch (err) {
    console.error("SUPERADMIN NOTIFICATION ERROR:", err.message);
  }
};

// ================= SUPERADMIN: USERS =================
exports.getUsers = async (req, res) => {
  try {
    const users = await query(`
      SELECT
        u.id,
        u.full_name,
        u.email,
        u.role,
        u.created_at,
        COUNT(r.id) AS total_requests
      FROM users u
      LEFT JOIN requests r ON r.user_id = u.id
      GROUP BY u.id, u.full_name, u.email, u.role, u.created_at
      ORDER BY u.created_at DESC
    `);

    return res.json({ users });
  } catch (err) {
    console.error("SUPERADMIN GET USERS ERROR:", err);
    return res.status(500).json({
      message: "Database error.",
      error: err.message,
    });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role." });
    }

    const userRows = await query("SELECT id, role FROM users WHERE id = ?", [id]);

    if (userRows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const targetUser = userRows[0];

    if (targetUser.role === "superadmin" && role !== "superadmin") {
      const countRows = await query(
        "SELECT COUNT(*) AS total_superadmins FROM users WHERE role = 'superadmin'"
      );

      if (Number(countRows[0]?.total_superadmins || 0) <= 1) {
        return res.status(400).json({
          message: "You cannot remove the last superadmin account.",
        });
      }
    }

    await query("UPDATE users SET role = ? WHERE id = ?", [role, id]);

    return res.json({ message: "User role updated successfully." });
  } catch (err) {
    console.error("SUPERADMIN UPDATE USER ROLE ERROR:", err);
    return res.status(500).json({
      message: "Database error.",
      error: err.message,
    });
  }
};

// ================= SUPERADMIN: REQUEST OVERRIDE =================
exports.updateRequestOverride = async (req, res) => {
  try {
    const { id } = req.params;

    const requestRows = await query("SELECT * FROM requests WHERE id = ? LIMIT 1", [id]);

    if (requestRows.length === 0) {
      return res.status(404).json({ message: "Request not found." });
    }

    const existing = requestRows[0];
    const updates = [];
    const params = [];

    const addUpdate = (column, value) => {
      if (value !== undefined) {
        updates.push(`${column} = ?`);
        params.push(value);
      }
    };

    if (req.body.form_data !== undefined) {
      const parsedFormData = safeJsonParse(req.body.form_data);
      addUpdate("form_data", JSON.stringify(parsedFormData));
      addUpdate("notes", req.body.notes !== undefined ? req.body.notes : JSON.stringify(parsedFormData));
    } else if (req.body.notes !== undefined) {
      addUpdate("notes", cleanNullable(req.body.notes));
    }

    if (req.body.document_type_id !== undefined) {
      addUpdate("document_type_id", cleanNullable(req.body.document_type_id));
    }

    if (req.body.status !== undefined) {
      if (!allowedStatuses.includes(req.body.status)) {
        return res.status(400).json({ message: "Invalid status value." });
      }

      addUpdate("status", req.body.status);
    }

    if (req.body.payment_status !== undefined) {
      if (!allowedPaymentStatuses.includes(req.body.payment_status)) {
        return res.status(400).json({ message: "Invalid payment status." });
      }

      addUpdate("payment_status", req.body.payment_status);
      addUpdate("paid_at", req.body.payment_status === "Paid" ? new Date() : null);
    }

    if (req.body.payment_method !== undefined) {
      const paymentMethod = allowedPaymentMethods.includes(req.body.payment_method)
        ? req.body.payment_method
        : "Other";

      addUpdate("payment_method", paymentMethod);
    }

    if (req.body.payment_reference !== undefined) {
      addUpdate("payment_reference", cleanNullable(req.body.payment_reference));
    }

    if (req.body.amount_due !== undefined) {
      addUpdate("amount_due", cleanNumber(req.body.amount_due));
    }

    if (req.body.document_fee !== undefined) {
      addUpdate("document_fee", cleanNumber(req.body.document_fee));
    }

    if (req.body.system_fee !== undefined) {
      addUpdate("system_fee", cleanNumber(req.body.system_fee));
    }

    if (req.body.discount_amount !== undefined) {
      addUpdate("discount_amount", cleanNumber(req.body.discount_amount));
    }

    if (req.body.total_amount !== undefined) {
      addUpdate("total_amount", cleanNumber(req.body.total_amount));
    }

    const requirementFile =
      getFirstUploadedFile(req, "requirement_file") ||
      getFirstUploadedFile(req, "uploaded_file") ||
      getFirstUploadedFile(req, "file");

    const paymentProofFile = getFirstUploadedFile(req, "payment_proof");

    if (paymentProofFile) {
      const paymentProofPath = normalizePath(paymentProofFile);
      addUpdate("payment_proof_path", paymentProofPath);
    }

    if (updates.length > 0) {
      params.push(id);

      await query(
        `UPDATE requests
         SET ${updates.join(", ")}
         WHERE id = ?`,
        params
      );
    }

    if (requirementFile) {
      const requirementPath = normalizePath(requirementFile);

      await query(
        `INSERT INTO uploads (request_id, file_path, upload_type)
         VALUES (?, ?, 'requirement')`,
        [id, requirementPath]
      );
    }

    if (paymentProofFile) {
      const paymentProofPath = normalizePath(paymentProofFile);

      await query(
        `INSERT INTO uploads (request_id, file_path, upload_type)
         VALUES (?, ?, 'payment_proof')`,
        [id, paymentProofPath]
      );
    }

    const updatedRows = await query("SELECT * FROM requests WHERE id = ? LIMIT 1", [id]);
    const updated = updatedRows[0] || existing;

    await query(
      `UPDATE receipts
       SET document_fee = ?,
           system_fee = ?,
           discount_amount = ?,
           total_amount = ?,
           payment_method = ?,
           payment_reference = ?
       WHERE request_id = ?`,
      [
        updated.document_fee || 0,
        updated.system_fee || 0,
        updated.discount_amount || 0,
        updated.total_amount || 0,
        updated.payment_method || "None",
        updated.payment_reference || null,
        id,
      ]
    );

    await createNotification(
      existing.user_id,
      id,
      "Request Updated by Superadmin",
      "Your document request was reviewed and updated by the superadmin."
    );

    return res.json({
      message: "Request updated by superadmin successfully.",
    });
  } catch (err) {
    console.error("SUPERADMIN UPDATE REQUEST ERROR:", err);
    return res.status(500).json({
      message: "Database error.",
      error: err.message,
    });
  }
};

exports.deleteRequestOverride = async (req, res) => {
  try {
    const { id } = req.params;

    const requestRows = await query("SELECT * FROM requests WHERE id = ? LIMIT 1", [id]);

    if (requestRows.length === 0) {
      return res.status(404).json({ message: "Request not found." });
    }

    await query("DELETE FROM feedback WHERE request_id = ?", [id]);
    await query("DELETE FROM request_messages WHERE request_id = ?", [id]);
    await query("DELETE FROM appointments WHERE request_id = ?", [id]);
    await query("DELETE FROM receipts WHERE request_id = ?", [id]);
    await query("DELETE FROM uploads WHERE request_id = ?", [id]);
    await query("DELETE FROM notifications WHERE request_id = ?", [id]);
    await query("DELETE FROM requests WHERE id = ?", [id]);

    return res.json({ message: "Request deleted successfully." });
  } catch (err) {
    console.error("SUPERADMIN DELETE REQUEST ERROR:", err);
    return res.status(500).json({
      message: "Database error.",
      error: err.message,
    });
  }
};

// ================= SUPERADMIN: DOCUMENT TYPES =================
exports.getDocumentTypes = async (req, res) => {
  try {
    const documentTypes = await query(
      "SELECT * FROM document_types ORDER BY name ASC"
    );

    return res.json({ document_types: documentTypes });
  } catch (err) {
    console.error("SUPERADMIN GET DOCUMENT TYPES ERROR:", err);
    return res.status(500).json({ message: "Database error.", error: err.message });
  }
};

exports.createDocumentType = async (req, res) => {
  try {
    const { name, fee, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Document name is required." });
    }

    const result = await query(
      "INSERT INTO document_types (name, fee, description) VALUES (?, ?, ?)",
      [name, cleanNumber(fee), description || null]
    );

    return res.status(201).json({
      message: "Document type created successfully.",
      id: result.insertId,
    });
  } catch (err) {
    console.error("SUPERADMIN CREATE DOCUMENT TYPE ERROR:", err);
    return res.status(500).json({ message: "Database error.", error: err.message });
  }
};

exports.updateDocumentType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, fee, description } = req.body;

    const result = await query(
      `UPDATE document_types
       SET name = COALESCE(?, name),
           fee = COALESCE(?, fee),
           description = ?
       WHERE id = ?`,
      [name || null, fee === undefined ? null : cleanNumber(fee), description || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Document type not found." });
    }

    return res.json({ message: "Document type updated successfully." });
  } catch (err) {
    console.error("SUPERADMIN UPDATE DOCUMENT TYPE ERROR:", err);
    return res.status(500).json({ message: "Database error.", error: err.message });
  }
};

exports.deleteDocumentType = async (req, res) => {
  try {
    const { id } = req.params;

    const usageRows = await query(
      "SELECT COUNT(*) AS total FROM requests WHERE document_type_id = ?",
      [id]
    );

    if (Number(usageRows[0]?.total || 0) > 0) {
      return res.status(400).json({
        message: "This document type is already used by requests and cannot be deleted.",
      });
    }

    const result = await query("DELETE FROM document_types WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Document type not found." });
    }

    return res.json({ message: "Document type deleted successfully." });
  } catch (err) {
    console.error("SUPERADMIN DELETE DOCUMENT TYPE ERROR:", err);
    return res.status(500).json({ message: "Database error.", error: err.message });
  }
};

// ================= SUPERADMIN: PROMO CODES =================
exports.getPromoCodes = async (req, res) => {
  try {
    const promoCodes = await query("SELECT * FROM promo_codes ORDER BY created_at DESC");
    return res.json({ promo_codes: promoCodes });
  } catch (err) {
    console.error("SUPERADMIN GET PROMOS ERROR:", err);
    return res.status(500).json({ message: "Database error.", error: err.message });
  }
};

exports.createPromoCode = async (req, res) => {
  try {
    const {
      code,
      description,
      discount_type,
      discount_value,
      is_active,
      start_date,
      end_date,
    } = req.body;

    const allowedDiscountTypes = ["fixed", "percentage", "waiver"];

    if (!code) {
      return res.status(400).json({ message: "Promo code is required." });
    }

    if (discount_type && !allowedDiscountTypes.includes(discount_type)) {
      return res.status(400).json({ message: "Invalid discount type." });
    }

    const result = await query(
      `INSERT INTO promo_codes
       (code, description, discount_type, discount_value, is_active, start_date, end_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        String(code).trim().toUpperCase(),
        description || null,
        discount_type || "fixed",
        cleanNumber(discount_value),
        is_active === false || is_active === 0 ? 0 : 1,
        cleanNullable(start_date),
        cleanNullable(end_date),
      ]
    );

    return res.status(201).json({
      message: "Promo code created successfully.",
      id: result.insertId,
    });
  } catch (err) {
    console.error("SUPERADMIN CREATE PROMO ERROR:", err);
    return res.status(500).json({ message: "Database error.", error: err.message });
  }
};

exports.updatePromoCode = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code,
      description,
      discount_type,
      discount_value,
      is_active,
      start_date,
      end_date,
    } = req.body;

    const allowedDiscountTypes = ["fixed", "percentage", "waiver"];

    if (discount_type && !allowedDiscountTypes.includes(discount_type)) {
      return res.status(400).json({ message: "Invalid discount type." });
    }

    const result = await query(
      `UPDATE promo_codes
       SET code = COALESCE(?, code),
           description = ?,
           discount_type = COALESCE(?, discount_type),
           discount_value = COALESCE(?, discount_value),
           is_active = COALESCE(?, is_active),
           start_date = ?,
           end_date = ?
       WHERE id = ?`,
      [
        code ? String(code).trim().toUpperCase() : null,
        description || null,
        discount_type || null,
        discount_value === undefined ? null : cleanNumber(discount_value),
        is_active === undefined ? null : is_active ? 1 : 0,
        cleanNullable(start_date),
        cleanNullable(end_date),
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Promo code not found." });
    }

    return res.json({ message: "Promo code updated successfully." });
  } catch (err) {
    console.error("SUPERADMIN UPDATE PROMO ERROR:", err);
    return res.status(500).json({ message: "Database error.", error: err.message });
  }
};

exports.deletePromoCode = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query("DELETE FROM promo_codes WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Promo code not found." });
    }

    return res.json({ message: "Promo code deleted successfully." });
  } catch (err) {
    console.error("SUPERADMIN DELETE PROMO ERROR:", err);
    return res.status(500).json({ message: "Database error.", error: err.message });
  }
};
