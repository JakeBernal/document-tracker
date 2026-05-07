const db = require("../config/db");
const { MINIMUM_CITIZEN_AGE, isAtLeastAge } = require("../utils/ageValidation");

const SYSTEM_FEE_AMOUNT = 10;

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

const getFirstNonEmpty = (...values) => {
  for (const value of values) {
    if (value === undefined || value === null) continue;

    const cleanedValue = String(value).trim();

    if (cleanedValue !== "") {
      return value;
    }
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

  const cleanedValue = String(value)
    .replace("₱", "")
    .replace(",", "")
    .trim()
    .toLowerCase();

  if (cleanedValue === "free") return 0;
  if (cleanedValue === "varies") return fallback;

  const numberValue = Number(cleanedValue);

  return Number.isNaN(numberValue) ? fallback : numberValue;
};

const toMoney = (value) => {
  return Number(toNumber(value)).toFixed(2);
};

const nullIfEmpty = (value) => {
  if (value === undefined || value === null || value === "") return null;
  return value;
};

const generateTransactionNumber = () => {
  return `TXN-${Date.now()}`;
};

const generateReceiptNumber = () => {
  return `OR-${Date.now()}`;
};

const isDigitalPaymentMethod = (paymentMethod) => {
  return ["GCash", "PayMaya", "Bank Transfer"].includes(paymentMethod);
};

const normalizeFieldName = (value) => {
  return String(value || "")
    .toLowerCase()
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\s+/g, " ")
    .trim();
};

const formatFieldLabel = (value) => {
  return String(value || "")
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
};

const cleanFieldValue = (value) => {
  if (value === undefined || value === null) return "";
  if (typeof value === "object") return "";

  return String(value).trim();
};

const normalizeDateOnly = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  const stringValue = String(value).trim();

  if (!stringValue) return null;

  if (/^\d{4}-\d{2}-\d{2}/.test(stringValue)) {
    return stringValue.slice(0, 10);
  }

  const parsedDate = new Date(stringValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const isBirthDateRequestField = (fieldName) => {
  const normalizedFieldName = normalizeFieldName(fieldName);
  const compactFieldName = normalizedFieldName.replace(/\s+/g, "");

  const exactBirthDateFields = [
    "date of birth",
    "birth date",
    "birthdate",
    "birthday",
    "dob",
    "applicant date of birth",
    "applicant birth date",
    "applicant birthdate",
    "applicant birthday",
    "partner date of birth",
    "partner birth date",
    "partner birthdate",
    "partner birthday",
    "spouse date of birth",
    "spouse birth date",
    "spouse birthdate",
    "child date of birth",
    "child birth date",
    "child birthdate",
  ];

  if (exactBirthDateFields.includes(normalizedFieldName)) {
    return true;
  }

  return (
    compactFieldName.includes("dateofbirth") ||
    compactFieldName.includes("birthdate") ||
    compactFieldName.includes("birthday") ||
    compactFieldName === "dob" ||
    compactFieldName.endsWith("dob")
  );
};

const isAgeRequestField = (fieldName) => {
  const normalizedFieldName = normalizeFieldName(fieldName);

  return (
    normalizedFieldName === "age" ||
    normalizedFieldName.endsWith(" age") ||
    normalizedFieldName.includes(" age ")
  );
};

const isLikelyPersonNameField = (fieldName) => {
  const normalizedFieldName = normalizeFieldName(fieldName);

  const exactNameFields = [
    "applicant full name",
    "applicant name",
    "full name",
    "name",
    "recipient name",
    "requested for",
    "requested for name",
    "request for",
    "request for name",
    "person named in document",
    "person name",
    "document owner",
    "document owner name",
    "certificate owner",
    "certificate owner name",
    "beneficiary name",
    "claimant name",
    "owner name",
    "child name",
    "student name",
    "parent name",
    "mother name",
    "father name",
    "spouse name",
    "partner full name",
    "partner name",
    "deceased name",
    "business owner name",
  ];

  if (exactNameFields.includes(normalizedFieldName)) {
    return true;
  }

  if (!normalizedFieldName.includes("name")) {
    return false;
  }

  const excludedNameFields = [
    "file name",
    "payment account name",
    "account name",
    "school name",
    "company name",
    "school company name",
    "barangay name",
    "document name",
    "uploaded requirement file",
    "payment proof file",
  ];

  return !excludedNameFields.some((excludedField) =>
    normalizedFieldName.includes(excludedField)
  );
};

const getPersonNamePriority = (fieldName) => {
  const normalizedFieldName = normalizeFieldName(fieldName);

  const priorityOrder = [
    "person named in document",
    "requested for name",
    "request for name",
    "document owner name",
    "certificate owner name",
    "recipient name",
    "beneficiary name",
    "claimant name",
    "applicant full name",
    "applicant name",
    "full name",
    "name",
    "child name",
    "student name",
    "mother name",
    "father name",
    "spouse name",
    "partner full name",
    "partner name",
    "deceased name",
    "business owner name",
  ];

  const index = priorityOrder.indexOf(normalizedFieldName);

  return index === -1 ? 999 : index;
};

const extractPersonNamedInfo = (parsedNotes) => {
  const fields =
    parsedNotes?.fields && typeof parsedNotes.fields === "object"
      ? parsedNotes.fields
      : {};

  const personRows = [];

  for (const [fieldName, fieldValue] of Object.entries(fields)) {
    const cleanedValue = cleanFieldValue(fieldValue);

    if (!cleanedValue) continue;
    if (!isLikelyPersonNameField(fieldName)) continue;

    personRows.push({
      key: fieldName,
      label: formatFieldLabel(fieldName),
      value: cleanedValue,
      priority: getPersonNamePriority(fieldName),
    });
  }

  personRows.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }

    return a.label.localeCompare(b.label);
  });

  const uniqueRows = [];
  const usedValues = new Set();

  for (const row of personRows) {
    const normalizedValue = row.value.toLowerCase();

    if (usedValues.has(normalizedValue)) continue;

    usedValues.add(normalizedValue);

    uniqueRows.push({
      key: row.key,
      label: row.label,
      value: row.value,
    });
  }

  return {
    primary: uniqueRows[0]?.value || null,
    rows: uniqueRows,
  };
};

const validateRequestFormAgeFields = (parsedNotes) => {
  const fields = parsedNotes?.fields;

  if (!fields || typeof fields !== "object") {
    return { isValid: true };
  }

  for (const [fieldName, fieldValue] of Object.entries(fields)) {
    if (fieldValue === undefined || fieldValue === null || fieldValue === "") {
      continue;
    }

    if (isBirthDateRequestField(fieldName)) {
      const dateValue = normalizeDateOnly(fieldValue);

      if (!dateValue || !isAtLeastAge(dateValue, MINIMUM_CITIZEN_AGE)) {
        return {
          isValid: false,
          message: `All request form birthdate fields must be at least ${MINIMUM_CITIZEN_AGE} years old.`,
        };
      }
    }

    if (isAgeRequestField(fieldName)) {
      const numericAge = Number(fieldValue);

      if (Number.isNaN(numericAge) || numericAge < MINIMUM_CITIZEN_AGE) {
        return {
          isValid: false,
          message: `All request form age fields must be at least ${MINIMUM_CITIZEN_AGE}.`,
        };
      }
    }
  }

  return { isValid: true };
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

const getCitizenProfile = async (userId) => {
  const rows = await query(
    `SELECT verification_status, date_of_birth
     FROM citizen_profiles
     WHERE user_id = ?
     LIMIT 1`,
    [userId]
  );

  return rows[0] || null;
};

const getDocumentType = async (documentTypeId) => {
  const rows = await query(
    `SELECT id, name, fee
     FROM document_types
     WHERE id = ?
     LIMIT 1`,
    [documentTypeId]
  );

  return rows[0] || null;
};

const calculateFees = (documentType, fallbackValues = {}) => {
  const rawDocumentFee = getFirstNonEmpty(
    documentType?.fee,
    fallbackValues.document_fee,
    0
  );

  const documentFee = toNumber(rawDocumentFee, 0);
  const systemFee = SYSTEM_FEE_AMOUNT;
  const discountAmount = toNumber(fallbackValues.discount_amount, 0);
  const totalAmount = Math.max(documentFee + systemFee - discountAmount, 0);

  return {
    documentFee: toMoney(documentFee),
    systemFee: toMoney(systemFee),
    discountAmount: toMoney(discountAmount),
    totalAmount: toMoney(totalAmount),
    amountDue: toMoney(totalAmount),
  };
};

const upsertReceipt = async ({
  requestId,
  receiptNumber,
  documentFee,
  systemFee,
  discountAmount,
  totalAmount,
  paymentMethod,
  paymentReference,
}) => {
  const existingReceipt = await query(
    `SELECT id
     FROM receipts
     WHERE request_id = ?
     LIMIT 1`,
    [requestId]
  );

  if (existingReceipt.length > 0) {
    await query(
      `UPDATE receipts
       SET receipt_number = ?,
           document_fee = ?,
           system_fee = ?,
           discount_amount = ?,
           total_amount = ?,
           payment_method = ?,
           payment_reference = ?
       WHERE request_id = ?`,
      [
        receiptNumber,
        documentFee,
        systemFee,
        discountAmount,
        totalAmount,
        paymentMethod,
        nullIfEmpty(paymentReference),
        requestId,
      ]
    );

    return;
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
      receiptNumber,
      documentFee,
      systemFee,
      discountAmount,
      totalAmount,
      paymentMethod,
      nullIfEmpty(paymentReference),
    ]
  );
};

exports.createRequest = async (req, res) => {
  try {
    const userId = req.user.id;

    if (req.user.role !== "citizen") {
      return res.status(403).json({
        message: "Only citizen accounts can submit document requests.",
      });
    }

    const {
      document_type_id,
      notes,
      payment_method,
      payment_reference,
      amount_due,
      document_fee,
      system_fee,
      total_amount,
      discount_amount,
    } = req.body;

    if (!document_type_id) {
      return res.status(400).json({
        message: "Document type is required.",
      });
    }

    const citizenProfile = await getCitizenProfile(userId);

    if (!citizenProfile) {
      return res.status(403).json({
        message:
          "Please complete your citizen profile before requesting documents.",
      });
    }

    const citizenBirthDate = normalizeDateOnly(citizenProfile.date_of_birth);

    if (
      !citizenBirthDate ||
      !isAtLeastAge(citizenBirthDate, MINIMUM_CITIZEN_AGE)
    ) {
      await query(
        `UPDATE citizen_profiles
         SET verification_status = 'Not Verified'
         WHERE user_id = ?`,
        [userId]
      );

      return res.status(403).json({
        message:
          "Only citizens who are at least 18 years old can request documents.",
      });
    }

    if (citizenProfile.verification_status !== "Fully Verified") {
      return res.status(403).json({
        message:
          "Your profile must be Fully Verified before requesting documents.",
      });
    }

    const documentType = await getDocumentType(document_type_id);

    if (!documentType) {
      return res.status(404).json({
        message: "Selected document type was not found.",
      });
    }

    const parsedNotes = safeJsonParse(notes);

    const requestFormAgeValidation = validateRequestFormAgeFields(parsedNotes);

    if (!requestFormAgeValidation.isValid) {
      return res.status(400).json({
        message: requestFormAgeValidation.message,
      });
    }

    const personNamedInfo = extractPersonNamedInfo(parsedNotes);

    const requirementFile = getFirstUploadedFile(req, "file");
    const paymentProofFile = getFirstUploadedFile(req, "payment_proof");

    const requirementFilePath = normalizePath(requirementFile);
    const paymentProofPath = normalizePath(paymentProofFile);

    const finalPaymentMethod = cleanPaymentMethod(
      payment_method ||
        parsedNotes.payment_method_for_database ||
        parsedNotes.payment_method
    );

    if (isDigitalPaymentMethod(finalPaymentMethod) && !paymentProofPath) {
      return res.status(400).json({
        message: `Proof of payment is required for ${finalPaymentMethod}.`,
      });
    }

    const feeDetails = calculateFees(documentType, {
      document_fee:
        getFirstNonEmpty(document_fee, parsedNotes.document_fee) || 0,
      system_fee:
        getFirstNonEmpty(system_fee, parsedNotes.system_fee) ||
        SYSTEM_FEE_AMOUNT,
      total_amount:
        getFirstNonEmpty(total_amount, parsedNotes.total_amount, amount_due) ||
        0,
      amount_due:
        getFirstNonEmpty(amount_due, parsedNotes.amount_due, total_amount) || 0,
      discount_amount:
        getFirstNonEmpty(discount_amount, parsedNotes.discount_amount) || 0,
    });

    const transactionNumber =
      parsedNotes.transaction_number ||
      parsedNotes.receipt_number ||
      generateTransactionNumber();

    const finalPaymentReference =
      finalPaymentMethod === "Cash"
        ? null
        : payment_reference || parsedNotes.payment_reference_number || null;

    const enrichedNotes = {
      ...parsedNotes,
      transaction_number: transactionNumber,
      official_receipt_status: "Not yet generated",
      payment_status_note:
        "Payment is subject to admin or superadmin verification.",
      backend_fee_source: "document_types_plus_required_system_fee",
      business_rule:
        "System fee is required for every request, even when the document fee is free.",
      document_fee: feeDetails.documentFee,
      system_fee: feeDetails.systemFee,
      discount_amount: feeDetails.discountAmount,
      total_amount: feeDetails.totalAmount,
      amount_due: feeDetails.amountDue,
      person_named_in_document: personNamedInfo.primary,
      person_named_rows: personNamedInfo.rows,
      request_subject_name: personNamedInfo.primary,
    };

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
      VALUES (?, ?, 'Pending', 'Unpaid', ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const requestResult = await query(insertRequestSql, [
      userId,
      document_type_id,
      finalPaymentMethod,
      finalPaymentReference,
      feeDetails.amountDue,
      feeDetails.documentFee,
      feeDetails.systemFee,
      feeDetails.discountAmount,
      feeDetails.totalAmount,
      paymentProofPath,
      safeJsonStringify(enrichedNotes),
      safeJsonStringify(enrichedNotes),
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

    const citizenName = await getCitizenName(userId);
    const documentName =
      documentType.name ||
      parsedNotes.document_name ||
      parsedNotes.parent_document ||
      "a document request";

    const subjectName = personNamedInfo.primary || citizenName;

    await createNotification(
      userId,
      requestId,
      "Request Submitted",
      `Your document request for ${subjectName} has been submitted and is now pending review.`
    );

    await notifyAdmins(
      requestId,
      "New Document Request",
      `${citizenName} submitted ${documentName} for ${subjectName}.`
    );

    return res.status(201).json({
      message:
        "Request submitted successfully. Payment is pending admin verification.",
      requestId,
      transaction_number: transactionNumber,
      payment_status: "Unpaid",
      amount_due: feeDetails.amountDue,
      document_fee: feeDetails.documentFee,
      system_fee: feeDetails.systemFee,
      discount_amount: feeDetails.discountAmount,
      total_amount: feeDetails.totalAmount,
      person_named_in_document: personNamedInfo.primary,
      person_named_rows: personNamedInfo.rows,
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
        person_named_in_document:
          formData.person_named_in_document ||
          formData.request_subject_name ||
          null,
        person_named_rows: formData.person_named_rows || [],
      };
    });

    return res.status(200).json({
      requests: formatted,
    });
  } catch (err) {
    console.error("GET MY REQUESTS ERROR:", err);

    return res.status(500).json({
      message: "Database error",
      error: err.message,
    });
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
      return res.status(404).json({
        message: "Request not found",
      });
    }

    const request = results[0];

    if (
      req.user.id.toString() !== request.user_id.toString() &&
      req.user.role !== "admin" &&
      req.user.role !== "superadmin"
    ) {
      return res.status(403).json({
        message: "Unauthorized access",
      });
    }

    request.form_data = safeJsonParse(request.form_data);

    if (!request.document_name) {
      request.document_name =
        request.form_data.document_name ||
        request.form_data.parent_document ||
        "Document Request";
    }

    request.person_named_in_document =
      request.form_data.person_named_in_document ||
      request.form_data.request_subject_name ||
      null;

    request.person_named_rows = request.form_data.person_named_rows || [];

    return res.status(200).json({
      request,
    });
  } catch (err) {
    console.error("GET REQUEST ERROR:", err);

    return res.status(500).json({
      message: "Database error",
      error: err.message,
    });
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
        person_named_in_document:
          formData.person_named_in_document ||
          formData.request_subject_name ||
          null,
        person_named_rows: formData.person_named_rows || [],
      };
    });

    return res.status(200).json({
      requests: formatted,
    });
  } catch (err) {
    console.error("GET ALL REQUESTS ERROR:", err);

    return res.status(500).json({
      message: "Database error",
      error: err.message,
    });
  }
};

exports.updateRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const requestRows = await query(
      `SELECT *
       FROM requests
       WHERE id = ? AND user_id = ?
       LIMIT 1`,
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

    const oldFields =
      oldFormData.fields && typeof oldFormData.fields === "object"
        ? oldFormData.fields
        : {};

    const incomingFields =
      incomingFormData.fields && typeof incomingFormData.fields === "object"
        ? incomingFormData.fields
        : {};

    const mergedFormData = {
      ...oldFormData,
      ...incomingFormData,
      fields: {
        ...oldFields,
        ...incomingFields,
      },
      citizen_updated_at: new Date().toISOString(),
    };

    const requestFormAgeValidation = validateRequestFormAgeFields(mergedFormData);

    if (!requestFormAgeValidation.isValid) {
      return res.status(400).json({
        message: requestFormAgeValidation.message,
      });
    }

    const personNamedInfo = extractPersonNamedInfo(mergedFormData);

    mergedFormData.person_named_in_document = personNamedInfo.primary;
    mergedFormData.person_named_rows = personNamedInfo.rows;
    mergedFormData.request_subject_name = personNamedInfo.primary;

    if (req.body.document_name) {
      mergedFormData.document_name = req.body.document_name;
    }

    const canUpdatePaymentMethod = existing.payment_status === "Unpaid";

    const finalPaymentMethod = canUpdatePaymentMethod
      ? cleanPaymentMethod(
          req.body.payment_method_for_database ||
            incomingFormData.payment_method_for_database ||
            req.body.payment_method ||
            incomingFormData.payment_method ||
            existing.payment_method
        )
      : existing.payment_method;

    mergedFormData.payment_method_for_database = finalPaymentMethod;
    mergedFormData.payment_method =
      req.body.payment_method ||
      incomingFormData.payment_method ||
      finalPaymentMethod;

    const newFile =
      getFirstUploadedFile(req, "uploaded_file") ||
      getFirstUploadedFile(req, "file");

    let newFilePath = null;

    if (newFile) {
      newFilePath = normalizePath(newFile);
      mergedFormData.uploaded_requirement_file =
        newFile.originalname || newFile.filename;
      mergedFormData.requirement_reuploaded_at = new Date().toISOString();
    }

    const wasNeedsMoreInfo = existing.status === "Needs More Info";
    const newStatus = wasNeedsMoreInfo ? "Pending" : existing.status;

    if (wasNeedsMoreInfo) {
      mergedFormData.resubmitted_at = new Date().toISOString();
      mergedFormData.resubmitted_from_status = "Needs More Info";
    }

    const finalNotes = safeJsonStringify({
      ...safeJsonParse(existing.notes),
      ...mergedFormData,
    });

    const result = await query(
      `UPDATE requests
       SET status = ?,
           notes = ?,
           form_data = ?,
           payment_method = ?
       WHERE id = ? AND user_id = ?`,
      [
        newStatus,
        finalNotes,
        safeJsonStringify(mergedFormData),
        finalPaymentMethod,
        id,
        userId,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Request not found.",
      });
    }

    if (newFilePath) {
      await query(
        `INSERT INTO uploads (request_id, file_path, upload_type)
         VALUES (?, ?, 'requirement')`,
        [id, newFilePath]
      );
    }

    await createNotification(
      userId,
      id,
      wasNeedsMoreInfo ? "Request Resubmitted" : "Request Updated",
      wasNeedsMoreInfo
        ? "Your corrected request has been submitted again and is now pending admin review."
        : "Your document request has been updated successfully."
    );

    const citizenName = await getCitizenName(userId);
    const documentName =
      mergedFormData.document_name ||
      mergedFormData.parent_document ||
      "a document request";

    const subjectName = personNamedInfo.primary || citizenName;

    await notifyAdmins(
      id,
      wasNeedsMoreInfo
        ? "Request Resubmitted by Citizen"
        : "Request Edited by Citizen",
      wasNeedsMoreInfo
        ? `${citizenName} resubmitted ${documentName} for ${subjectName}. Status is now Pending.`
        : `${citizenName} updated ${documentName} for ${subjectName}.`
    );

    return res.status(200).json({
      message: wasNeedsMoreInfo
        ? "Request updated and resubmitted successfully. Status is now Pending."
        : "Request updated successfully.",
      status: newStatus,
      request: {
        id: Number(id),
        status: newStatus,
        form_data: mergedFormData,
        payment_method: finalPaymentMethod,
        requirement_file_path: newFilePath,
        person_named_in_document: personNamedInfo.primary,
        person_named_rows: personNamedInfo.rows,
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
      return res.status(400).json({
        message: "Invalid status value",
      });
    }

    const requestRows = await query(
      `SELECT r.user_id,
              r.payment_status,
              u.full_name AS citizen_name,
              dt.name AS document_name,
              r.form_data
       FROM requests r
       LEFT JOIN users u ON r.user_id = u.id
       LEFT JOIN document_types dt ON r.document_type_id = dt.id
       WHERE r.id = ?
       LIMIT 1`,
      [id]
    );

    if (requestRows.length === 0) {
      return res.status(404).json({
        message: "Request not found",
      });
    }

    const request = requestRows[0];

    if (
      status === "Completed" &&
      !["Paid", "Waived"].includes(request.payment_status)
    ) {
      return res.status(400).json({
        message:
          "Request cannot be marked as Completed while payment is still Unpaid.",
      });
    }

    const result = await query(
      `UPDATE requests
       SET status = ?
       WHERE id = ?`,
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Request not found",
      });
    }

    const formData = safeJsonParse(request.form_data);
    const citizenName = request.citizen_name || "A citizen";
    const documentName =
      request.document_name ||
      formData.document_name ||
      formData.parent_document ||
      "a document request";

    const subjectName =
      formData.person_named_in_document ||
      formData.request_subject_name ||
      citizenName;

    await createNotification(
      request.user_id,
      id,
      "Request Status Updated",
      `Your request status is now ${status}.`
    );

    await notifyAdmins(
      id,
      "Request Status Updated",
      `${citizenName}'s ${documentName} for ${subjectName} was updated to ${status}.`
    );

    return res.json({
      message: "Status updated!",
    });
  } catch (err) {
    console.error("UPDATE STATUS ERROR:", err);

    return res.status(500).json({
      message: "Database error",
      error: err.message,
    });
  }
};

exports.updatePayment = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      payment_status,
      payment_method,
      payment_reference,
      document_fee,
      amount_due,
      total_amount,
      discount_amount,
    } = req.body;

    const validPaymentStatuses = ["Unpaid", "Paid", "Waived"];

    if (!validPaymentStatuses.includes(payment_status)) {
      return res.status(400).json({
        message: "Invalid payment status",
      });
    }

    const requestRows = await query(
      `SELECT r.*,
              u.full_name AS citizen_name,
              dt.name AS document_name,
              dt.fee AS document_type_fee
       FROM requests r
       LEFT JOIN users u ON r.user_id = u.id
       LEFT JOIN document_types dt ON r.document_type_id = dt.id
       WHERE r.id = ?
       LIMIT 1`,
      [id]
    );

    if (requestRows.length === 0) {
      return res.status(404).json({
        message: "Request not found",
      });
    }

    const request = requestRows[0];

    const finalPaymentMethod = cleanPaymentMethod(
      payment_method || request.payment_method
    );

    const feeDetails = calculateFees(
      {
        fee: request.document_type_fee,
      },
      {
        document_fee:
          getFirstNonEmpty(document_fee, request.document_fee) || 0,
        amount_due: getFirstNonEmpty(amount_due, request.amount_due) || 0,
        total_amount: getFirstNonEmpty(total_amount, request.total_amount) || 0,
        discount_amount:
          getFirstNonEmpty(discount_amount, request.discount_amount) || 0,
      }
    );

    let officialReceiptNumber = null;

    if (payment_status === "Paid" || payment_status === "Waived") {
      const receiptRows = await query(
        `SELECT receipt_number
         FROM receipts
         WHERE request_id = ?
         LIMIT 1`,
        [id]
      );

      officialReceiptNumber =
        request.receipt_number ||
        receiptRows[0]?.receipt_number ||
        generateReceiptNumber();
    }

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
           paid_at = ?,
           receipt_number = ?
       WHERE id = ?`,
      [
        payment_status,
        finalPaymentMethod,
        nullIfEmpty(payment_reference),
        feeDetails.amountDue,
        feeDetails.documentFee,
        feeDetails.systemFee,
        feeDetails.discountAmount,
        feeDetails.totalAmount,
        payment_status === "Paid" ? new Date() : null,
        officialReceiptNumber,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Request not found",
      });
    }

    if (payment_status === "Paid" || payment_status === "Waived") {
      await upsertReceipt({
        requestId: id,
        receiptNumber: officialReceiptNumber,
        documentFee: feeDetails.documentFee,
        systemFee: feeDetails.systemFee,
        discountAmount: feeDetails.discountAmount,
        totalAmount: feeDetails.totalAmount,
        paymentMethod: finalPaymentMethod,
        paymentReference: payment_reference,
      });
    }

    if (payment_status === "Unpaid") {
      await query(`DELETE FROM receipts WHERE request_id = ?`, [id]);
    }

    const formData = safeJsonParse(request.form_data);
    const citizenName = request.citizen_name || "A citizen";
    const documentName =
      request.document_name ||
      formData.document_name ||
      formData.parent_document ||
      "a document request";

    const subjectName =
      formData.person_named_in_document ||
      formData.request_subject_name ||
      citizenName;

    await createNotification(
      request.user_id,
      id,
      payment_status === "Paid"
        ? "Payment Verified"
        : payment_status === "Waived"
        ? "Payment Waived"
        : "Payment Status Updated",
      `Your payment status is now ${payment_status}.`
    );

    await notifyAdmins(
      id,
      "Payment Status Updated",
      `${citizenName}'s payment for ${documentName} under ${subjectName} is now ${payment_status}.`
    );

    return res.json({
      message:
        payment_status === "Paid" || payment_status === "Waived"
          ? "Payment updated and official receipt record saved."
          : "Payment updated.",
      payment_status,
      receipt_number: officialReceiptNumber,
      amount_due: feeDetails.amountDue,
      document_fee: feeDetails.documentFee,
      system_fee: feeDetails.systemFee,
      discount_amount: feeDetails.discountAmount,
      total_amount: feeDetails.totalAmount,
    });
  } catch (err) {
    console.error("UPDATE PAYMENT ERROR:", err);

    return res.status(500).json({
      message: "Database error",
      error: err.message,
    });
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
      `SELECT r.user_id,
              u.full_name AS citizen_name,
              dt.name AS document_name,
              r.form_data
       FROM requests r
       LEFT JOIN users u ON r.user_id = u.id
       LEFT JOIN document_types dt ON r.document_type_id = dt.id
       WHERE r.id = ?
       LIMIT 1`,
      [id]
    );

    if (requestRows.length === 0) {
      return res.status(404).json({
        message: "Request not found",
      });
    }

    const request = requestRows[0];
    const formData = safeJsonParse(request.form_data);
    const userId = request.user_id;
    const citizenName = request.citizen_name || "A citizen";
    const documentName =
      request.document_name ||
      formData.document_name ||
      formData.parent_document ||
      "a document request";

    const subjectName =
      formData.person_named_in_document ||
      formData.request_subject_name ||
      citizenName;

    await query(
      `UPDATE requests
       SET pickup_date = ?, pickup_time = ?, status = 'Ready for Pickup'
       WHERE id = ?`,
      [pickup_date, pickup_time, id]
    );

    const appointmentRows = await query(
      `SELECT id
       FROM appointments
       WHERE request_id = ?
       LIMIT 1`,
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
      `${citizenName}'s ${documentName} under ${subjectName} pickup was scheduled on ${pickup_date} at ${pickup_time}.`
    );

    return res.json({
      message: "Pickup appointment scheduled successfully!",
    });
  } catch (err) {
    console.error("SET PICKUP APPOINTMENT ERROR:", err);

    return res.status(500).json({
      message: "Database error",
      error: err.message,
    });
  }
};

exports.getMyAppointments = async (req, res) => {
  try {
    const userId = req.user.id;

    const results = await query(
      `SELECT a.*,
              r.status AS request_status,
              dt.name AS document_name,
              r.form_data
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
        person_named_in_document:
          formData.person_named_in_document ||
          formData.request_subject_name ||
          null,
      };
    });

    return res.json({
      appointments,
    });
  } catch (err) {
    console.error("GET MY APPOINTMENTS ERROR:", err);

    return res.status(500).json({
      message: "Database error",
      error: err.message,
    });
  }
};

exports.getAllAppointments = async (req, res) => {
  try {
    const results = await query(
      `SELECT a.*,
              u.full_name AS citizen_name,
              u.email,
              r.status AS request_status,
              dt.name AS document_name,
              r.form_data
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
        person_named_in_document:
          formData.person_named_in_document ||
          formData.request_subject_name ||
          null,
      };
    });

    return res.json({
      appointments,
    });
  } catch (err) {
    console.error("GET ALL APPOINTMENTS ERROR:", err);

    return res.status(500).json({
      message: "Database error",
      error: err.message,
    });
  }
};

exports.uploadFile = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        message: "No file uploaded",
      });
    }

    const requestRows = await query(
      `SELECT r.user_id,
              u.full_name AS citizen_name,
              dt.name AS document_name,
              r.form_data
       FROM requests r
       LEFT JOIN users u ON r.user_id = u.id
       LEFT JOIN document_types dt ON r.document_type_id = dt.id
       WHERE r.id = ?
       LIMIT 1`,
      [id]
    );

    if (requestRows.length === 0) {
      return res.status(404).json({
        message: "Request not found",
      });
    }

    const filePath = normalizePath(req.file);

    await query(
      `INSERT INTO uploads (request_id, file_path, upload_type)
       VALUES (?, ?, 'released_document')`,
      [id, filePath]
    );

    const request = requestRows[0];
    const formData = safeJsonParse(request.form_data);
    const citizenName = request.citizen_name || "A citizen";
    const documentName =
      request.document_name ||
      formData.document_name ||
      formData.parent_document ||
      "a document request";

    const subjectName =
      formData.person_named_in_document ||
      formData.request_subject_name ||
      citizenName;

    await createNotification(
      request.user_id,
      id,
      "Document File Uploaded",
      "A document file has been uploaded to your request."
    );

    await notifyAdmins(
      id,
      "Document File Uploaded",
      `A file was uploaded for ${citizenName}'s ${documentName} under ${subjectName}.`
    );

    return res.json({
      message: "File uploaded successfully!",
      filePath,
    });
  } catch (err) {
    console.error("FILE UPLOAD ERROR:", err);

    return res.status(500).json({
      message: "Database error",
      error: err.message,
    });
  }
};