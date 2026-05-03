const db = require("../config/db");

const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

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

const safeJsonStringify = (value) => {
  if (!value) return JSON.stringify({});
  if (typeof value === "string") {
    try {
      JSON.parse(value);
      return value;
    } catch {
      return JSON.stringify({ raw: value });
    }
  }
  return JSON.stringify(value);
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

const allowedPaymentMethods = [
  "None",
  "Cash",
  "GCash",
  "PayMaya",
  "Bank Transfer",
  "Other",
];

const cleanPaymentMethod = (method) => {
  if (!method) return "None";

  const normalized = String(method).trim();

  if (normalized === "Onsite Payment") return "Cash";
  if (normalized === "Maya") return "PayMaya";

  return allowedPaymentMethods.includes(normalized) ? normalized : "Other";
};

const toNumber = (value, fallback = 0) => {
  if (value === undefined || value === null || value === "") return fallback;
  const numberValue = Number(value);
  return Number.isNaN(numberValue) ? fallback : numberValue;
};

const nullIfEmpty = (value) => {
  if (value === undefined || value === null || value === "") return null;
  return value;
};

const generateReceiptNumber = () => {
  return `PT-${Date.now()}`;
};

const createNotification = async (userId, requestId, title, message) => {
  try {
    await query(
      `INSERT INTO notifications (user_id, request_id, title, message)
       VALUES (?, ?, ?, ?)`,
      [userId, requestId, title, message]
    );
  } catch (err) {
    console.error("CREATE NOTIFICATION ERROR:", err.message);
  }
};

const notifyAdmins = async (requestId, title, message) => {
  try {
    const adminUsers = await query(
      `SELECT id FROM users WHERE role IN ('admin', 'superadmin')`
    );

    for (const admin of adminUsers) {
      await createNotification(admin.id, requestId, title, message);
    }
  } catch (err) {
    console.error("NOTIFY ADMINS ERROR:", err.message);
  }
};

const getCitizenName = async (userId) => {
  try {
    const rows = await query(
      `SELECT full_name FROM users WHERE id = ? LIMIT 1`,
      [userId]
    );

    return rows[0]?.full_name || "A citizen";
  } catch {
    return "A citizen";
  }
};

exports.createRequest = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      document_type_id,
      notes,
      payment_method,
      payment_reference,
      amount_due,
      document_fee,
      system_fee,
      discount_amount,
      total_amount,
      receipt_number,
    } = req.body;

    if (!document_type_id) {
      return res.status(400).json({ message: "Document type is required." });
    }

    const parsedNotes = safeJsonParse(notes);

    const requirementFile = getFirstUploadedFile(req, "file");
    const paymentProofFile = getFirstUploadedFile(req, "payment_proof");

    const requirementFilePath = normalizePath(requirementFile);
    const paymentProofPath = normalizePath(paymentProofFile);

    const finalPaymentMethod = cleanPaymentMethod(
      payment_method ||
        parsedNotes.payment_method_for_database ||
        parsedNotes.payment_method
    );

    const finalReceiptNumber =
      receipt_number || parsedNotes.receipt_number || generateReceiptNumber();

    const finalDocumentFee = toNumber(document_fee || parsedNotes.document_fee);
    const finalSystemFee = toNumber(system_fee || parsedNotes.system_fee);
    const finalDiscountAmount = toNumber(
      discount_amount || parsedNotes.discount_amount
    );
    const finalTotalAmount = toNumber(
      total_amount || parsedNotes.total_amount || amount_due
    );
    const finalPaymentReference =
      payment_reference || parsedNotes.payment_reference_number || null;

    const insertRequestSql = `
      INSERT INTO requests
      (
        user_id,
        document_type_id,
        status,
        payment_status,
        payment_method,
        payment_reference,
        receipt_number,
        amount_due,
        document_fee,
        system_fee,
        discount_amount,
        total_amount,
        payment_proof_path,
        notes,
        form_data
      )
      VALUES (?, ?, 'Pending', 'Unpaid', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const requestResult = await query(insertRequestSql, [
      userId,
      document_type_id,
      finalPaymentMethod,
      finalPaymentReference,
      finalReceiptNumber,
      finalTotalAmount,
      finalDocumentFee,
      finalSystemFee,
      finalDiscountAmount,
      finalTotalAmount,
      paymentProofPath,
      notes || null,
      safeJsonStringify(parsedNotes),
    ]);

    const requestId = requestResult.insertId;

    if (requirementFilePath) {
      await query(
        `INSERT INTO uploads (request_id, file_path, upload_type)
         VALUES (?, ?, 'requirement')`,
        [requestId, requirementFilePath]
      );
    }

    if (paymentProofPath) {
      await query(
        `INSERT INTO uploads (request_id, file_path, upload_type)
         VALUES (?, ?, 'payment_proof')`,
        [requestId, paymentProofPath]
      );
    }

    await query(
      `INSERT INTO receipts
       (
         request_id,
         receipt_number,
         document_fee,
         system_fee,
         discount_amount,
         total_amount,
         payment_method,
         payment_reference
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        requestId,
        finalReceiptNumber,
        finalDocumentFee,
        finalSystemFee,
        finalDiscountAmount,
        finalTotalAmount,
        finalPaymentMethod,
        finalPaymentReference,
      ]
    );

    const citizenName = await getCitizenName(userId);
    const documentName =
      parsedNotes.document_name || parsedNotes.parent_document || "a document request";

    await createNotification(
      userId,
      requestId,
      "Request Submitted",
      "Your document request has been submitted and is now pending review."
    );

    await notifyAdmins(
      requestId,
      "New Document Request",
      `${citizenName} submitted ${documentName} for review.`
    );

    return res.status(201).json({
      message: "Request submitted successfully!",
      requestId,
      receipt_number: finalReceiptNumber,
    });
  } catch (err) {
    console.error("CREATE REQUEST ERROR:", err);
    return res.status(500).json({
      message: "Database error",
      error: err.message,
    });
  }
};

exports.getMyRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const results = await query(
      `SELECT
          r.*,
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
       LEFT JOIN document_types dt ON r.document_type_id = dt.id
       LEFT JOIN appointments a ON a.request_id = r.id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`,
      [userId]
    );

    const formatted = results.map((request) => {
      const formData = safeJsonParse(request.form_data);
      const documentName =
        request.document_name ||
        formData.document_name ||
        formData.parent_document ||
        "Document Request";

      return {
        ...request,
        document_name: documentName,
        form_data: formData,
      };
    });

    return res.status(200).json({ requests: formatted });
  } catch (err) {
    console.error("GET MY REQUESTS ERROR:", err);
    return res.status(500).json({ message: "Database error", error: err.message });
  }
};

exports.getRequestById = async (req, res) => {
  try {
    const requestId = req.params.id;

    const results = await query(
      `SELECT
          r.*,
          dt.name AS document_name,
          u.full_name AS citizen_name,
          u.email,
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
       LEFT JOIN users u ON r.user_id = u.id
       LEFT JOIN document_types dt ON r.document_type_id = dt.id
       LEFT JOIN appointments a ON a.request_id = r.id
       WHERE r.id = ?`,
      [requestId]
    );

    if (results.length === 0) {
      return res.status(404).json({ message: "Request not found" });
    }

    const request = results[0];

    if (
      req.user.id.toString() !== request.user_id.toString() &&
      req.user.role !== "admin" &&
      req.user.role !== "superadmin"
    ) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    request.form_data = safeJsonParse(request.form_data);

    if (!request.document_name) {
      request.document_name =
        request.form_data.document_name ||
        request.form_data.parent_document ||
        "Document Request";
    }

    return res.status(200).json({ request });
  } catch (err) {
    console.error("GET REQUEST ERROR:", err);
    return res.status(500).json({ message: "Database error", error: err.message });
  }
};

exports.getAllRequests = async (req, res) => {
  try {
    const results = await query(
      `SELECT
          r.*,
          u.full_name AS citizen_name,
          u.email,
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
       LEFT JOIN users u ON r.user_id = u.id
       LEFT JOIN document_types dt ON r.document_type_id = dt.id
       LEFT JOIN appointments a ON a.request_id = r.id
       ORDER BY r.created_at DESC`
    );

    const formatted = results.map((request) => {
      const formData = safeJsonParse(request.form_data);
      return {
        ...request,
        form_data: formData,
        document_name:
          request.document_name ||
          formData.document_name ||
          formData.parent_document ||
          "Document Request",
      };
    });

    return res.status(200).json({ requests: formatted });
  } catch (err) {
    console.error("GET ALL REQUESTS ERROR:", err);
    return res.status(500).json({ message: "Database error", error: err.message });
  }
};

exports.updateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const requestRows = await query(
      `SELECT * FROM requests WHERE id = ? AND user_id = ? LIMIT 1`,
      [id, userId]
    );

    if (requestRows.length === 0) {
      return res.status(404).json({
        message: "Request not found or you are not the owner.",
      });
    }

    const existing = requestRows[0];
    const editableStatuses = ["Pending", "Needs More Info"];

    if (!editableStatuses.includes(existing.status)) {
      return res.status(403).json({
        message: `You cannot edit a request with status: ${existing.status}. Only Pending or Needs More Info requests can be edited.`,
      });
    }

    const oldFormData = safeJsonParse(existing.form_data);
    const incomingFormData = safeJsonParse(req.body.form_data);

    const mergedFormData = {
      ...oldFormData,
      ...incomingFormData,
      fields: {
        ...(oldFormData.fields && typeof oldFormData.fields === "object"
          ? oldFormData.fields
          : {}),
        ...(incomingFormData.fields && typeof incomingFormData.fields === "object"
          ? incomingFormData.fields
          : {}),
      },
    };

    if (req.body.document_name) {
      mergedFormData.document_name = req.body.document_name;
    }

    const finalPaymentMethod = cleanPaymentMethod(
      req.body.payment_method_for_database ||
        incomingFormData.payment_method_for_database ||
        req.body.payment_method ||
        incomingFormData.payment_method ||
        existing.payment_method
    );

    mergedFormData.payment_method_for_database = finalPaymentMethod;
    mergedFormData.payment_method =
      req.body.payment_method || incomingFormData.payment_method || finalPaymentMethod;

    const finalNotes = req.body.notes || existing.notes || safeJsonStringify(mergedFormData);

    const result = await query(
      `UPDATE requests
       SET notes = ?,
           form_data = ?,
           payment_method = ?
       WHERE id = ? AND user_id = ?`,
      [
        finalNotes,
        safeJsonStringify(mergedFormData),
        finalPaymentMethod,
        id,
        userId,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Request not found." });
    }

    const newFile =
      getFirstUploadedFile(req, "uploaded_file") || getFirstUploadedFile(req, "file");

    if (newFile) {
      const newFilePath = normalizePath(newFile);

      await query(
        `INSERT INTO uploads (request_id, file_path, upload_type)
         VALUES (?, ?, 'requirement')`,
        [id, newFilePath]
      );
    }

    await createNotification(
      userId,
      id,
      "Request Updated",
      "Your document request has been updated successfully."
    );

    const citizenName = await getCitizenName(userId);
    const documentName =
      mergedFormData.document_name || mergedFormData.parent_document || "a document request";

    await notifyAdmins(
      id,
      "Request Edited by Citizen",
      `${citizenName} updated ${documentName} request #${id}.`
    );

    return res.status(200).json({
      message: "Request updated successfully.",
      request: {
        id: Number(id),
        form_data: mergedFormData,
        payment_method: finalPaymentMethod,
      },
    });
  } catch (err) {
    console.error("UPDATE REQUEST ERROR:", err);
    return res.status(500).json({
      message: "Database error",
      error: err.message,
    });
  }
};

exports.updateStatus = async (req, res) => {
  try {
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

    const result = await query("UPDATE requests SET status = ? WHERE id = ?", [
      status,
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Request not found" });
    }

    const requestRows = await query(
      `SELECT r.user_id, u.full_name AS citizen_name, dt.name AS document_name, r.form_data
       FROM requests r
       LEFT JOIN users u ON r.user_id = u.id
       LEFT JOIN document_types dt ON r.document_type_id = dt.id
       WHERE r.id = ?`,
      [id]
    );

    if (requestRows.length > 0) {
      const request = requestRows[0];
      const formData = safeJsonParse(request.form_data);
      const citizenName = request.citizen_name || "A citizen";
      const documentName =
        request.document_name || formData.document_name || formData.parent_document || "a document request";

      await createNotification(
        request.user_id,
        id,
        "Request Status Updated",
        `Your request status is now ${status}.`
      );

      await notifyAdmins(
        id,
        "Request Status Updated",
        `${citizenName}'s ${documentName} status was updated to ${status}.`
      );
    }

    return res.json({ message: "Status updated!" });
  } catch (err) {
    console.error("UPDATE STATUS ERROR:", err);
    return res.status(500).json({ message: "Database error", error: err.message });
  }
};

exports.updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      payment_status,
      payment_method,
      payment_reference,
      amount_due,
      document_fee,
      system_fee,
      discount_amount,
      total_amount,
    } = req.body;

    const validPaymentStatuses = ["Unpaid", "Paid", "Waived"];

    if (!validPaymentStatuses.includes(payment_status)) {
      return res.status(400).json({ message: "Invalid payment status" });
    }

    const finalPaymentMethod = cleanPaymentMethod(payment_method);
    const finalAmountDue = toNumber(amount_due);
    const finalDocumentFee = toNumber(document_fee);
    const finalSystemFee = toNumber(system_fee);
    const finalDiscountAmount = toNumber(discount_amount);
    const finalTotalAmount = toNumber(total_amount, finalAmountDue);

    const result = await query(
      `UPDATE requests
       SET payment_status = ?,
           payment_method = ?,
           payment_reference = ?,
           amount_due = ?,
           document_fee = ?,
           system_fee = ?,
           discount_amount = ?,
           total_amount = ?,
           paid_at = ?
       WHERE id = ?`,
      [
        payment_status,
        finalPaymentMethod,
        nullIfEmpty(payment_reference),
        finalAmountDue,
        finalDocumentFee,
        finalSystemFee,
        finalDiscountAmount,
        finalTotalAmount,
        payment_status === "Paid" ? new Date() : null,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Request not found" });
    }

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
        finalDocumentFee,
        finalSystemFee,
        finalDiscountAmount,
        finalTotalAmount,
        finalPaymentMethod,
        nullIfEmpty(payment_reference),
        id,
      ]
    );

    const requestRows = await query(
      `SELECT r.user_id, u.full_name AS citizen_name, dt.name AS document_name, r.form_data
       FROM requests r
       LEFT JOIN users u ON r.user_id = u.id
       LEFT JOIN document_types dt ON r.document_type_id = dt.id
       WHERE r.id = ?`,
      [id]
    );

    if (requestRows.length > 0) {
      const request = requestRows[0];
      const formData = safeJsonParse(request.form_data);
      const citizenName = request.citizen_name || "A citizen";
      const documentName =
        request.document_name || formData.document_name || formData.parent_document || "a document request";

      await createNotification(
        request.user_id,
        id,
        payment_status === "Paid" ? "Payment Verified" : "Payment Status Updated",
        `Your payment status is now ${payment_status}.`
      );

      await notifyAdmins(
        id,
        "Payment Status Updated",
        `${citizenName}'s payment for ${documentName} is now ${payment_status}.`
      );
    }

    return res.json({ message: "Payment updated!" });
  } catch (err) {
    console.error("UPDATE PAYMENT ERROR:", err);
    return res.status(500).json({ message: "Database error", error: err.message });
  }
};

exports.setPickupAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { pickup_date, pickup_time } = req.body;

    if (!pickup_date || !pickup_time) {
      return res.status(400).json({
        message: "Pickup date and pickup time are required.",
      });
    }

    const requestRows = await query(
      `SELECT r.user_id, u.full_name AS citizen_name, dt.name AS document_name, r.form_data
       FROM requests r
       LEFT JOIN users u ON r.user_id = u.id
       LEFT JOIN document_types dt ON r.document_type_id = dt.id
       WHERE r.id = ?`,
      [id]
    );

    if (requestRows.length === 0) {
      return res.status(404).json({ message: "Request not found" });
    }

    const request = requestRows[0];
    const formData = safeJsonParse(request.form_data);
    const userId = request.user_id;
    const citizenName = request.citizen_name || "A citizen";
    const documentName =
      request.document_name || formData.document_name || formData.parent_document || "a document request";

    await query(
      `UPDATE requests
       SET pickup_date = ?, pickup_time = ?, status = 'Ready for Pickup'
       WHERE id = ?`,
      [pickup_date, pickup_time, id]
    );

    const appointmentRows = await query(
      "SELECT id FROM appointments WHERE request_id = ? LIMIT 1",
      [id]
    );

    if (appointmentRows.length > 0) {
      await query(
        `UPDATE appointments
         SET appointment_date = ?, appointment_time = ?, status = 'Rescheduled'
         WHERE request_id = ?`,
        [pickup_date, pickup_time, id]
      );
    } else {
      await query(
        `INSERT INTO appointments
         (request_id, user_id, appointment_date, appointment_time, purpose, status)
         VALUES (?, ?, ?, ?, 'Document Pickup', 'Scheduled')`,
        [id, userId, pickup_date, pickup_time]
      );
    }

    await createNotification(
      userId,
      id,
      "Pickup Schedule Set",
      `Your document is ready for pickup on ${pickup_date} at ${pickup_time}.`
    );

    await notifyAdmins(
      id,
      "Pickup Schedule Set",
      `${citizenName}'s ${documentName} pickup was scheduled on ${pickup_date} at ${pickup_time}.`
    );

    return res.json({ message: "Pickup appointment scheduled successfully!" });
  } catch (err) {
    console.error("SET PICKUP APPOINTMENT ERROR:", err);
    return res.status(500).json({ message: "Database error", error: err.message });
  }
};

exports.getMyAppointments = async (req, res) => {
  try {
    const userId = req.user.id;

    const results = await query(
      `SELECT a.*, r.status AS request_status, dt.name AS document_name, r.form_data
       FROM appointments a
       LEFT JOIN requests r ON a.request_id = r.id
       LEFT JOIN document_types dt ON r.document_type_id = dt.id
       WHERE a.user_id = ?
       ORDER BY a.appointment_date ASC, a.appointment_time ASC`,
      [userId]
    );

    const appointments = results.map((appointment) => {
      const formData = safeJsonParse(appointment.form_data);
      return {
        ...appointment,
        document_name:
          appointment.document_name ||
          formData.document_name ||
          formData.parent_document ||
          "Document Request",
      };
    });

    return res.json({ appointments });
  } catch (err) {
    console.error("GET MY APPOINTMENTS ERROR:", err);
    return res.status(500).json({ message: "Database error", error: err.message });
  }
};

exports.getAllAppointments = async (req, res) => {
  try {
    const results = await query(
      `SELECT a.*, u.full_name AS citizen_name, u.email, r.status AS request_status, dt.name AS document_name, r.form_data
       FROM appointments a
       LEFT JOIN users u ON a.user_id = u.id
       LEFT JOIN requests r ON a.request_id = r.id
       LEFT JOIN document_types dt ON r.document_type_id = dt.id
       ORDER BY a.appointment_date ASC, a.appointment_time ASC`
    );

    const appointments = results.map((appointment) => {
      const formData = safeJsonParse(appointment.form_data);
      return {
        ...appointment,
        document_name:
          appointment.document_name ||
          formData.document_name ||
          formData.parent_document ||
          "Document Request",
      };
    });

    return res.json({ appointments });
  } catch (err) {
    console.error("GET ALL APPOINTMENTS ERROR:", err);
    return res.status(500).json({ message: "Database error", error: err.message });
  }
};

exports.uploadFile = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const filePath = normalizePath(req.file);

    await query(
      `INSERT INTO uploads (request_id, file_path, upload_type)
       VALUES (?, ?, 'released_document')`,
      [id, filePath]
    );

    const requestRows = await query(
      `SELECT r.user_id, u.full_name AS citizen_name, dt.name AS document_name, r.form_data
       FROM requests r
       LEFT JOIN users u ON r.user_id = u.id
       LEFT JOIN document_types dt ON r.document_type_id = dt.id
       WHERE r.id = ?`,
      [id]
    );

    if (requestRows.length > 0) {
      const request = requestRows[0];
      const formData = safeJsonParse(request.form_data);
      const citizenName = request.citizen_name || "A citizen";
      const documentName =
        request.document_name || formData.document_name || formData.parent_document || "a document request";

      await createNotification(
        request.user_id,
        id,
        "Document File Uploaded",
        "A document file has been uploaded to your request."
      );

      await notifyAdmins(
        id,
        "Document File Uploaded",
        `A file was uploaded for ${citizenName}'s ${documentName}.`
      );
    }

    return res.json({ message: "File uploaded successfully!", filePath });
  } catch (err) {
    console.error("FILE UPLOAD ERROR:", err);
    return res.status(500).json({ message: "Database error", error: err.message });
  }
};
