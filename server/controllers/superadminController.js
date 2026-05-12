const bcrypt = require("bcrypt");
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

const cleanDateOrNull = (value) => {
  if (value === undefined || value === null) return null;

  const raw = String(value).trim();
  if (!raw) return null;

  // MySQL DATE columns need YYYY-MM-DD.
  // The mysql driver may return DATE values as ISO strings when sent back by the frontend.
  const dateOnlyMatch = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (dateOnlyMatch) return dateOnlyMatch[1];

  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return null;
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

    if (String(req.user.id) === String(id) && role !== "superadmin") {
      return res.status(400).json({
        message: "You cannot remove your own superadmin access while logged in.",
      });
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


exports.getStats = async (req, res) => {
  try {
    const userStatsRows = await query(`
      SELECT
        COUNT(*) AS total_users,
        SUM(u.role = 'citizen') AS total_citizens,
        SUM(u.role = 'admin') AS total_admins,
        SUM(u.role = 'superadmin') AS total_superadmins,
        SUM(CASE
          WHEN u.role = 'citizen' AND cp.verification_status = 'Fully Verified'
          THEN 1 ELSE 0
        END) AS fully_verified_citizens,
        SUM(CASE
          WHEN u.role = 'citizen' AND (cp.verification_status IS NULL OR cp.verification_status = 'Not Verified')
          THEN 1 ELSE 0
        END) AS not_verified_citizens
      FROM users u
      LEFT JOIN citizen_profiles cp ON cp.user_id = u.id
    `);

    const requestStatsRows = await query(`
      SELECT
        COUNT(*) AS total_requests,
        SUM(status = 'Pending') AS pending,
        SUM(status = 'Processing') AS processing,
        SUM(status = 'Needs More Info') AS needs_more_info,
        SUM(status = 'Rejected') AS rejected,
        SUM(status = 'Approved') AS approved,
        SUM(status = 'Ready for Pickup') AS ready_for_pickup,
        SUM(status = 'Completed') AS completed,
        COALESCE(SUM(CASE WHEN payment_status = 'Paid' THEN total_amount ELSE 0 END), 0) AS total_revenue
      FROM requests
    `);

    const feedbackStatsRows = await query(`
      SELECT
        COUNT(*) AS total_feedback,
        COALESCE(AVG(rating), 0) AS avg_rating
      FROM feedback
    `);

    const promoStatsRows = await query(`
      SELECT
        COUNT(*) AS total_promos,
        COALESCE(SUM(is_active = 1), 0) AS active_promos
      FROM promo_codes
    `);

    const recentActivity = await query(`
      SELECT
        r.id,
        r.status,
        r.payment_status,
        r.total_amount,
        r.created_at,
        r.updated_at,
        u.full_name AS citizen_name,
        u.email,
        dt.name AS document_name
      FROM requests r
      LEFT JOIN users u ON u.id = r.user_id
      LEFT JOIN document_types dt ON dt.id = r.document_type_id
      ORDER BY r.updated_at DESC, r.created_at DESC
      LIMIT 8
    `);

    return res.json({
      user_stats: userStatsRows[0] || {},
      request_stats: requestStatsRows[0] || {},
      feedback_stats: feedbackStatsRows[0] || {},
      promo_stats: promoStatsRows[0] || {},
      recent_activity: recentActivity,
    });
  } catch (err) {
    console.error("SUPERADMIN GET STATS ERROR:", err);
    return res.status(500).json({
      message: "Database error.",
      error: err.message,
    });
  }
};

exports.createAdminUser = async (req, res) => {
  try {
    const fullName = String(req.body.full_name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const role = req.body.role || "admin";

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Full name, email, and password are required." });
    }

    if (!allowedRoles.includes(role) || role === "citizen") {
      return res.status(400).json({ message: "Only admin or superadmin accounts can be created here." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    const existing = await query("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);

    if (existing.length > 0) {
      return res.status(400).json({ message: "Email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await query(
      "INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)",
      [fullName, email, hashedPassword, role]
    );

    return res.status(201).json({
      message: `${role === "superadmin" ? "Superadmin" : "Admin"} account created successfully.`,
      user_id: result.insertId,
    });
  } catch (err) {
    console.error("SUPERADMIN CREATE ADMIN ERROR:", err);
    return res.status(500).json({
      message: "Database error.",
      error: err.message,
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (String(req.user.id) === String(id)) {
      return res.status(400).json({ message: "You cannot delete your own account while logged in." });
    }

    const userRows = await query("SELECT id, full_name, role FROM users WHERE id = ? LIMIT 1", [id]);

    if (userRows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    const targetUser = userRows[0];

    if (targetUser.role === "superadmin") {
      const countRows = await query("SELECT COUNT(*) AS total_superadmins FROM users WHERE role = 'superadmin'");

      if (Number(countRows[0]?.total_superadmins || 0) <= 1) {
        return res.status(400).json({ message: "You cannot delete the last superadmin account." });
      }
    }

    const requestRows = await query("SELECT id FROM requests WHERE user_id = ?", [id]);
    const requestIds = requestRows.map((row) => row.id);

    if (requestIds.length > 0) {
      await query("DELETE FROM feedback WHERE request_id IN (?)", [requestIds]);
      await query("DELETE FROM request_messages WHERE request_id IN (?)", [requestIds]);
      await query("DELETE FROM appointments WHERE request_id IN (?)", [requestIds]);
      await query("DELETE FROM receipts WHERE request_id IN (?)", [requestIds]);
      await query("DELETE FROM uploads WHERE request_id IN (?)", [requestIds]);
      await query("DELETE FROM notifications WHERE request_id IN (?)", [requestIds]);
      await query("DELETE FROM requests WHERE id IN (?)", [requestIds]);
    }

    await query("DELETE FROM feedback WHERE user_id = ?", [id]);
    await query("DELETE FROM request_messages WHERE sender_id = ?", [id]);
    await query("DELETE FROM notifications WHERE user_id = ?", [id]);
    await query("DELETE FROM citizen_profiles WHERE user_id = ?", [id]);
    await query("DELETE FROM users WHERE id = ?", [id]);

    return res.json({ message: "User account and related records deleted successfully." });
  } catch (err) {
    console.error("SUPERADMIN DELETE USER ERROR:", err);
    return res.status(500).json({
      message: "Database error.",
      error: err.message,
    });
  }
};

// ================= SUPERADMIN: REQUEST MANAGEMENT =================
exports.getRequests = async (req, res) => {
  try {
    const requests = await query(`
      SELECT
        r.*,
        u.full_name AS citizen_name,
        u.email AS citizen_email,
        cp.verification_status AS citizen_verification_status,
        dt.name AS document_name,
        (
          SELECT file_path FROM uploads
          WHERE request_id = r.id AND upload_type = 'requirement'
          ORDER BY id DESC LIMIT 1
        ) AS requirement_file_path,
        (
          SELECT file_path FROM uploads
          WHERE request_id = r.id AND upload_type = 'payment_proof'
          ORDER BY id DESC LIMIT 1
        ) AS payment_proof_file_path,
        (
          SELECT file_path FROM uploads
          WHERE request_id = r.id AND upload_type = 'released_document'
          ORDER BY id DESC LIMIT 1
        ) AS released_document_file_path,
        a.appointment_date,
        a.appointment_time,
        a.status AS appointment_status
      FROM requests r
      LEFT JOIN users u ON u.id = r.user_id
      LEFT JOIN citizen_profiles cp ON cp.user_id = u.id
      LEFT JOIN document_types dt ON dt.id = r.document_type_id
      LEFT JOIN appointments a ON a.request_id = r.id
      ORDER BY r.created_at DESC, r.id DESC
    `);

    const formattedRequests = requests.map((request) => {
      const formData = safeJsonParse(request.form_data);

      return {
        ...request,
        form_data: formData,
        document_name:
          request.document_name ||
          formData.document_name ||
          formData.parent_document ||
          "Document Request",
        person_named_in_document:
          formData.person_named_in_document ||
          formData.request_subject_name ||
          null,
        person_named_rows: formData.person_named_rows || [],
      };
    });

    return res.json({ requests: formattedRequests });
  } catch (err) {
    console.error("SUPERADMIN GET REQUESTS ERROR:", err);
    return res.status(500).json({
      message: "Database error.",
      error: err.message,
    });
  }
};

// ================= SUPERADMIN: REQUEST RECORDS =================
// Superadmin may view and remove request records only.
// Editing raw request data is blocked here to protect citizen-submitted information,
// payment records, uploaded files, and audit history.
exports.updateRequestOverride = async (req, res) => {
  return res.status(403).json({
    message:
      "Superadmin access is read-only for request data. Superadmin can delete/remove request records, but cannot edit raw request information, status, payment, fees, notes, or uploaded file data.",
  });
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
    const promoCodes = await query(`
      SELECT
        id,
        code,
        description,
        discount_type,
        discount_value,
        is_active,
        DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
        DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date,
        created_at
      FROM promo_codes
      ORDER BY created_at DESC
    `);

    return res.json({ promo_codes: promoCodes });
  } catch (err) {
    console.error("SUPERADMIN GET PROMOS ERROR:", err);

    if (err.code === "ER_NO_SUCH_TABLE") {
      return res.status(500).json({
        message: "Promo code table is missing. Please run the promo code SQL repair file.",
        error: err.message,
      });
    }

    if (err.code === "ER_BAD_FIELD_ERROR") {
      return res.status(500).json({
        message: "Promo code table columns are incomplete. Please run the promo code SQL repair file.",
        error: err.message,
      });
    }

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
        cleanDateOrNull(start_date),
        cleanDateOrNull(end_date),
      ]
    );

    return res.status(201).json({
      message: "Promo code created successfully.",
      id: result.insertId,
    });
  } catch (err) {
    console.error("SUPERADMIN CREATE PROMO ERROR:", err);

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "This discount and waiver code already exists." });
    }

    if (err.code === "ER_NO_SUCH_TABLE") {
      return res.status(500).json({
        message: "Promo code table is missing. Please run the promo code SQL repair file.",
        error: err.message,
      });
    }

    if (err.code === "ER_BAD_FIELD_ERROR") {
      return res.status(500).json({
        message: "Promo code table columns are incomplete. Please run the promo code SQL repair file.",
        error: err.message,
      });
    }

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
        cleanDateOrNull(start_date),
        cleanDateOrNull(end_date),
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Promo code not found." });
    }

    return res.json({ message: "Promo code updated successfully." });
  } catch (err) {
    console.error("SUPERADMIN UPDATE PROMO ERROR:", err);

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "This discount and waiver code already exists." });
    }

    if (err.code === "ER_TRUNCATED_WRONG_VALUE" || err.code === "ER_TRUNCATED_WRONG_VALUE_FOR_FIELD") {
      return res.status(400).json({
        message: "Invalid date value. Please use a valid start date and end date.",
        error: err.message,
      });
    }

    if (err.code === "ER_NO_SUCH_TABLE") {
      return res.status(500).json({
        message: "Promo code table is missing. Please run the promo code SQL repair file.",
        error: err.message,
      });
    }

    if (err.code === "ER_BAD_FIELD_ERROR") {
      return res.status(500).json({
        message: "Promo code table columns are incomplete. Please run the promo code SQL repair file.",
        error: err.message,
      });
    }

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
