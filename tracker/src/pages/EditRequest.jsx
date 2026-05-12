import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/navbar";
import { documentRequirements } from "../data/documentRequirements";
import "../css/requestform.css";

export default function EditRequest() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [formData, setFormData] = useState({});
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const dashboardPath = "/citizen";

  const parseJsonValue = (value) => {
    if (!value) return {};
    if (typeof value === "object") return value;

    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  };

  const getFileUrl = (filePath) => {
    if (!filePath) return null;

    let cleanPath = String(filePath).replaceAll("\\", "/");

    if (cleanPath.startsWith("http")) {
      return cleanPath;
    }

    const uploadsIndex = cleanPath.indexOf("uploads/");

    if (uploadsIndex !== -1) {
      cleanPath = cleanPath.substring(uploadsIndex);
    }

    return `http://localhost:5001/${cleanPath}`;
  };

  const normalizePaymentForUi = (value) => {
    if (!value || value === "None") return "";
    if (value === "Cash") return "Onsite Payment";
    if (value === "Other") return "PayMaya";
    return value;
  };

  const getDisplayValue = (value, fallback = "—") => {
    if (value === undefined || value === null || value === "") return fallback;
    return value;
  };

  const getPaymentStatusStyle = (status) => {
    if (status === "Paid" || status === "Waived") {
      return { background: "#d1fae5", color: "#065f46" };
    }

    return { background: "#fef3c7", color: "#92400e" };
  };

  const findDocumentDefinition = (docName, parentName) => {
    if (documentRequirements[docName]) {
      return {
        ...documentRequirements[docName],
        resolvedName: docName,
        parentTitle: parentName || null,
      };
    }

    for (const [parentTitle, parentDoc] of Object.entries(documentRequirements)) {
      const choice = (parentDoc.choices || []).find(
        (item) => item.title === docName || item.id === docName
      );

      if (choice) {
        return {
          ...parentDoc,
          ...choice,
          category: parentDoc.category,
          fee: parentDoc.fee,
          time: parentDoc.time,
          images: choice.images || parentDoc.images || [],
          fields: choice.fields || parentDoc.fields || [],
          uploadLabel: choice.uploadLabel || parentDoc.uploadLabel,
          resolvedName: choice.title,
          parentTitle,
        };
      }
    }

    return {
      ...documentRequirements["Barangay Clearance"],
      resolvedName: "Barangay Clearance",
      parentTitle: null,
    };
  };

  const fetchRequestData = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/signin", { replace: true });
        return;
      }

      const res = await fetch(`http://localhost:5001/api/requests/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.message || "Failed to load request.");
        return;
      }

      const loadedRequest = data.request || data;
      const parsed = parseJsonValue(loadedRequest.form_data);

      const savedFields =
        parsed.fields && typeof parsed.fields === "object"
          ? parsed.fields
          : parsed.applicant && typeof parsed.applicant === "object"
          ? parsed.applicant
          : parsed;

      const metaKeys = [
        "document_name",
        "parent_document",
        "selected_form",
        "category",
        "payment_method",
        "payment_method_for_database",
        "payment_reference_number",
        "payment_reference",
        "receipt_number",
        "document_fee",
        "system_fee",
        "discount_amount",
        "total_amount",
        "amount_due",
        "uploaded_requirement_file",
        "payment_proof_file",
        "payment_note",
        "payment_account_name",
        "payment_account_number",
        "created_at",
        "raw",
      ];

      const cleanFields = Object.fromEntries(
        Object.entries(savedFields || {}).filter(([key]) => !metaKeys.includes(key))
      );

      const docName =
        parsed.document_name ||
        loadedRequest.document_name ||
        parsed.parent_document ||
        "Barangay Clearance";

      const docDef = findDocumentDefinition(docName, parsed.parent_document);

      const savedPayment =
        parsed.payment_method ||
        parsed.payment_method_for_database ||
        loadedRequest.payment_method ||
        "";

      setRequest({
        ...loadedRequest,
        form_data: parsed,
      });
      setFormData(cleanFields);
      setPaymentMethod(normalizePaymentForUi(savedPayment));
      setSelectedDoc(docDef);
    } catch (err) {
      console.error("FETCH REQUEST ERROR:", err);
      setErrorMessage("Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    setFile(selected || null);
    setFileName(selected ? selected.name : "");
  };

  const validateForm = () => {
    for (const field of selectedDoc?.fields || []) {
      const value = formData[field.name];

      if (field.required && (!value || String(value).trim() === "")) {
        return `Please fill in ${field.label}.`;
      }
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    try {
      setSubmitting(true);

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/signin", { replace: true });
        return;
      }

      const oldFormData = request?.form_data || {};

      const updatedFormData = {
        ...oldFormData,
        document_name: selectedDoc.resolvedName,
        parent_document: selectedDoc.parentTitle || oldFormData.parent_document || null,
        category: selectedDoc.category || oldFormData.category || null,
        fields: formData,
        payment_edit_locked: true,
        payment_edit_lock_note:
          "Payment details are locked after request submission. Citizen edits are limited to request form fields and requirement attachment only.",
      };

      const payload = new FormData();
      payload.append("form_data", JSON.stringify(updatedFormData));

      if (file) {
        payload.append("uploaded_file", file);
      }

      const res = await fetch(`http://localhost:5001/api/requests/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: payload,
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.message || "Failed to update request.");
        return;
      }

      setSuccessMessage(data.message || "Request updated successfully. Redirecting to dashboard...");

      setTimeout(() => {
        navigate(dashboardPath, { replace: true });
      }, 900);
    } catch (err) {
      console.error("UPDATE REQUEST ERROR:", err);
      setErrorMessage("Cannot connect to server.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <section className="request-page">
          <div className="request-header">
            <h1>Edit Request</h1>
            <p>Loading your request...</p>
          </div>
        </section>
      </>
    );
  }

  if (!request || !selectedDoc) {
    return (
      <>
        <Navbar />
        <section className="request-page">
          <div className="request-header">
            <h1>Edit Request</h1>
            <p style={{ color: "#dc2626" }}>
              {errorMessage || "Request not found."}
            </p>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => navigate(dashboardPath)}
              style={{ marginTop: "1rem" }}
            >
              ← Back to Dashboard
            </button>
          </div>
        </section>
      </>
    );
  }

  const isEditable = ["Pending", "Needs More Info"].includes(request.status);
  const existingFileUrl = getFileUrl(request.requirement_file_path);

  return (
    <>
      <Navbar />

      <section className="request-page">
        <div className="request-header">
          <h1>Edit Document Request</h1>
          <p>
            {isEditable
              ? "Update your information below and save your changes."
              : "This request cannot be edited in its current status."}
          </p>
        </div>

        <div className="request-container">
          <div className="request-left">
            <h2>Document Information</h2>

            <div className="form-group">
              <label>Selected Document Type</label>
              <h1
                style={{
                  fontSize: "1.8rem",
                  color: "#1f3c88",
                  margin: "6px 0 20px",
                }}
              >
                {selectedDoc.resolvedName}
              </h1>
            </div>

            <div className="document-info">
              <p>
                <strong>Document Name:</strong> {selectedDoc.resolvedName}
              </p>
              {selectedDoc.parentTitle && (
                <p>
                  <strong>Parent Document:</strong> {selectedDoc.parentTitle}
                </p>
              )}
              <p>
                <strong>Category:</strong> {selectedDoc.category || "—"}
              </p>
              <p>
                <strong>Processing Fee:</strong> {selectedDoc.fee || "—"}
              </p>
              <p>
                <strong>Processing Time:</strong> {selectedDoc.time || "—"}
              </p>
              <p>
                <strong>Required Attachment:</strong> {selectedDoc.uploadLabel || "—"}
              </p>
              <p>
                <strong>Request Status:</strong>{" "}
                <span
                  style={{
                    display: "inline-block",
                    padding: "4px 14px",
                    borderRadius: "999px",
                    fontSize: "14px",
                    fontWeight: 600,
                    background: isEditable ? "#fef3c7" : "#fee2e2",
                    color: isEditable ? "#92400e" : "#991b1b",
                  }}
                >
                  {request.status}
                </span>
              </p>
              {request.receipt_number && (
                <p>
                  <strong>Receipt No:</strong> {request.receipt_number}
                </p>
              )}
            </div>

            {!isEditable && (
              <div
                style={{
                  marginTop: "1.25rem",
                  background: "#fff3cd",
                  border: "1px solid #ffc107",
                  borderRadius: "10px",
                  padding: "0.9rem 1rem",
                  fontSize: "14px",
                  color: "#856404",
                }}
              >
                ⚠️ Only <strong>Pending</strong> or <strong>Needs More Info</strong>{" "}
                requests can be edited.
              </div>
            )}

            <button
              type="button"
              className="secondary-btn"
              onClick={() => navigate(dashboardPath)}
            >
              ← Back to Dashboard
            </button>
          </div>

          <div className="request-right">
            <h2>Applicant Information</h2>

            {errorMessage && <p className="form-message">{errorMessage}</p>}

            {successMessage && (
              <p
                className="form-message"
                style={{
                  background: "#d1fae5",
                  color: "#065f46",
                  borderColor: "#6ee7b7",
                }}
              >
                ✓ {successMessage}
              </p>
            )}

            <form className="request-form" onSubmit={handleSubmit}>
              {(selectedDoc.fields || []).map((field) => (
                <div className="form-group" key={field.name}>
                  <label>
                    {field.label}
                    {field.required && <span className="required-star"> *</span>}
                  </label>

                  <input
                    type={field.type || "text"}
                    name={field.name}
                    value={formData[field.name] || ""}
                    onChange={handleChange}
                    placeholder={field.placeholder || ""}
                    disabled={!isEditable}
                    style={
                      !isEditable
                        ? {
                            background: "#f3f4f6",
                            cursor: "not-allowed",
                            color: "#6b7280",
                          }
                        : {}
                    }
                  />
                </div>
              ))}

              <div className="form-group">
                <label>{selectedDoc.uploadLabel || "Upload Requirement"}</label>

                {existingFileUrl ? (
                  <p className="selected-parent-note" style={{ marginBottom: "8px" }}>
                    Current file:{" "}
                    <a
                      href={existingFileUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "#1f3c88", fontWeight: 600 }}
                    >
                      View existing file ↗
                    </a>
                  </p>
                ) : (
                  <p className="selected-parent-note" style={{ color: "#6b7280" }}>
                    No file currently uploaded.
                  </p>
                )}

                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  disabled={!isEditable}
                  style={!isEditable ? { cursor: "not-allowed", opacity: 0.6 } : {}}
                />

                {fileName && (
                  <p className="selected-parent-note">
                    New file selected: <strong>{fileName}</strong>
                  </p>
                )}
              </div>

              <div className="form-group">
                <label>Payment Information</label>

                <div
                  style={{
                    border: "1px solid #bfdbfe",
                    borderRadius: "16px",
                    padding: "1rem",
                    background: "#eff6ff",
                    display: "grid",
                    gap: "0.65rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "1rem",
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <strong style={{ color: "#1f3c88" }}>Payment is locked</strong>
                      <p className="selected-parent-note" style={{ marginTop: "4px" }}>
                        Payment method cannot be changed after request submission.
                        Only applicant details and requirement file are editable.
                      </p>
                    </div>

                    <span
                      style={{
                        display: "inline-block",
                        padding: "5px 14px",
                        borderRadius: "999px",
                        fontSize: "13px",
                        fontWeight: 700,
                        ...getPaymentStatusStyle(request.payment_status),
                      }}
                    >
                      {getDisplayValue(request.payment_status, "Unpaid")}
                    </span>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
                      gap: "0.75rem",
                    }}
                  >
                    <div>
                      <span className="selected-parent-note">Payment Method</span>
                      <p style={{ fontWeight: 700, color: "#111827" }}>
                        {getDisplayValue(paymentMethod)}
                      </p>
                    </div>

                    <div>
                      <span className="selected-parent-note">Amount Due</span>
                      <p style={{ fontWeight: 700, color: "#111827" }}>
                        ₱{getDisplayValue(request.amount_due, "0.00")}
                      </p>
                    </div>

                    <div>
                      <span className="selected-parent-note">Reference Number</span>
                      <p style={{ fontWeight: 700, color: "#111827" }}>
                        {getDisplayValue(request.payment_reference)}
                      </p>
                    </div>
                  </div>

                  {request.payment_proof_file_path && (
                    <p className="selected-parent-note">
                      Payment proof: {" "}
                      <a
                        href={getFileUrl(request.payment_proof_file_path)}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "#1f3c88", fontWeight: 700 }}
                      >
                        View uploaded proof ↗
                      </a>
                    </p>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", gap: "1rem" }}>
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={!isEditable || submitting}
                  style={{
                    flex: 1,
                    marginTop: 0,
                    opacity: !isEditable || submitting ? 0.6 : 1,
                    cursor: !isEditable || submitting ? "not-allowed" : "pointer",
                  }}
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => navigate(dashboardPath)}
                  style={{ flex: 1, marginTop: 0 }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </>
  );
}
