import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/navbar";
import "../css/requestform.css";
import "../css/admin.css";

export default function SuperadminEditRequest() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [formFields, setFormFields] = useState({});
  const [metaForm, setMetaForm] = useState({
    document_type_id: "",
    status: "Pending",
    payment_status: "Unpaid",
    payment_method: "None",
    payment_reference: "",
    document_fee: "0.00",
    system_fee: "0.00",
    discount_amount: "0.00",
    total_amount: "0.00",
    amount_due: "0.00",
    notes: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const statusOptions = useMemo(
    () => [
      "Pending",
      "Processing",
      "Needs More Info",
      "Rejected",
      "Approved",
      "Ready for Pickup",
      "Completed",
    ],
    []
  );

  const paymentStatusOptions = useMemo(
    () => ["Unpaid", "Paid", "Waived"],
    []
  );

  const paymentMethodOptions = useMemo(
    () => ["None", "Cash", "GCash", "PayMaya", "Bank Transfer", "Other"],
    []
  );

  const token = localStorage.getItem("token");

  const parseJsonValue = (value) => {
    if (!value) return {};
    if (typeof value === "object") return value;

    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  };

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cleanMoney = (value) => {
    const parsed = Number(value || 0);
    if (Number.isNaN(parsed)) return "0.00";
    return parsed.toFixed(2);
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

  const fetchDocumentTypes = async () => {
    const res = await fetch("http://localhost:5001/api/superadmin/document-types", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();

    if (res.ok) {
      setDocumentTypes(data.document_types || []);
    }
  };

  const fetchRequest = async () => {
    try {
      setLoading(true);
      setMessage({ text: "", type: "" });

      if (!token) {
        navigate("/signin", { replace: true });
        return;
      }

      const [requestRes] = await Promise.all([
        fetch(`http://localhost:5001/api/requests/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetchDocumentTypes(),
      ]);

      const data = await requestRes.json();

      if (!requestRes.ok) {
        showMessage(data.message || "Failed to load request.", "error");
        return;
      }

      const loadedRequest = data.request || data;
      const parsedFormData = parseJsonValue(loadedRequest.form_data);
      const loadedFields =
        parsedFormData.fields && typeof parsedFormData.fields === "object"
          ? parsedFormData.fields
          : parsedFormData.applicant && typeof parsedFormData.applicant === "object"
          ? parsedFormData.applicant
          : {};

      setRequest({ ...loadedRequest, form_data: parsedFormData });
      setFormFields(loadedFields || {});
      setMetaForm({
        document_type_id: loadedRequest.document_type_id || "",
        status: loadedRequest.status || "Pending",
        payment_status: loadedRequest.payment_status || "Unpaid",
        payment_method: loadedRequest.payment_method || "None",
        payment_reference: loadedRequest.payment_reference || "",
        document_fee: cleanMoney(loadedRequest.document_fee),
        system_fee: cleanMoney(loadedRequest.system_fee),
        discount_amount: cleanMoney(loadedRequest.discount_amount),
        total_amount: cleanMoney(loadedRequest.total_amount || loadedRequest.amount_due),
        amount_due: cleanMoney(loadedRequest.amount_due || loadedRequest.total_amount),
        notes: loadedRequest.notes || "",
      });
    } catch (error) {
      console.error("SUPERADMIN FETCH REQUEST ERROR:", error);
      showMessage("Cannot connect to server.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const handleMetaChange = (event) => {
    const { name, value } = event.target;

    setMetaForm((prev) => {
      const next = { ...prev, [name]: value };

      if (["document_fee", "system_fee", "discount_amount"].includes(name)) {
        const total =
          Number(name === "document_fee" ? value : next.document_fee || 0) +
          Number(name === "system_fee" ? value : next.system_fee || 0) -
          Number(name === "discount_amount" ? value : next.discount_amount || 0);

        next.total_amount = Number.isNaN(total) ? "0.00" : total.toFixed(2);
        next.amount_due = next.total_amount;
      }

      return next;
    });
  };

  const handleFieldChange = (key, value) => {
    setFormFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddField = () => {
    const fieldName = window.prompt("Enter field name. Example: purpose");

    if (!fieldName || !fieldName.trim()) return;

    const cleanFieldName = fieldName.trim().replace(/\s+/g, "_").toLowerCase();

    if (Object.prototype.hasOwnProperty.call(formFields, cleanFieldName)) {
      showMessage("Field already exists.", "error");
      return;
    }

    setFormFields((prev) => ({ ...prev, [cleanFieldName]: "" }));
  };

  const handleRemoveField = (key) => {
    if (!window.confirm(`Remove field "${key}"?`)) return;

    setFormFields((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage({ text: "", type: "" });

      const oldFormData = request?.form_data || {};
      const selectedType = documentTypes.find(
        (item) => String(item.id) === String(metaForm.document_type_id)
      );

      const updatedFormData = {
        ...oldFormData,
        document_name:
          selectedType?.name || oldFormData.document_name || request?.document_name || "Document Request",
        fields: formFields,
        superadmin_updated_at: new Date().toISOString(),
        superadmin_updated_by: "superadmin",
      };

      const payload = {
        ...metaForm,
        form_data: updatedFormData,
        document_type_id: metaForm.document_type_id || null,
        document_fee: Number(metaForm.document_fee || 0),
        system_fee: Number(metaForm.system_fee || 0),
        discount_amount: Number(metaForm.discount_amount || 0),
        total_amount: Number(metaForm.total_amount || 0),
        amount_due: Number(metaForm.amount_due || 0),
      };

      const res = await fetch(`http://localhost:5001/api/superadmin/requests/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        showMessage(data.message || "Failed to update request.", "error");
        return;
      }

      showMessage(data.message || "Request updated successfully.");
      await fetchRequest();
    } catch (error) {
      console.error("SUPERADMIN SAVE REQUEST ERROR:", error);
      showMessage("Cannot connect to server.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <section className="request-page">
          <div className="request-header">
            <h1>Superadmin Request Editor</h1>
            <p>Loading request data...</p>
          </div>
        </section>
      </>
    );
  }

  if (!request) {
    return (
      <>
        <Navbar />
        <section className="request-page">
          <div className="request-header">
            <h1>Superadmin Request Editor</h1>
            <p style={{ color: "#dc2626" }}>{message.text || "Request not found."}</p>
            <button className="secondary-btn" type="button" onClick={() => navigate("/admin")}>← Back to Admin</button>
          </div>
        </section>
      </>
    );
  }

  const requirementFileUrl = getFileUrl(request.requirement_file_path);
  const paymentProofUrl = getFileUrl(request.payment_proof_file_path);
  const releasedDocumentUrl = getFileUrl(request.released_document_file_path);

  return (
    <>
      <Navbar />

      <section className="request-page">
        <div className="request-header">
          <h1>Superadmin Request Editor</h1>
          <p>
            Edit request data only. Uploaded files remain read-only for data security and audit control.
          </p>
        </div>

        {message.text && (
          <p
            className="form-message"
            style={{
              maxWidth: "1180px",
              margin: "0 auto 1rem",
              background: message.type === "error" ? "#fee2e2" : "#d1fae5",
              color: message.type === "error" ? "#991b1b" : "#065f46",
              borderColor: message.type === "error" ? "#fecaca" : "#6ee7b7",
            }}
          >
            {message.type === "error" ? "⚠ " : "✓ "}
            {message.text}
          </p>
        )}

        <form className="request-container" onSubmit={handleSubmit}>
          <div className="request-left">
            <h2>Request Summary</h2>

            <div className="document-info">
              <p><strong>Request ID:</strong> #{request.id}</p>
              <p><strong>Citizen:</strong> {request.citizen_name || "Unknown"}</p>
              <p><strong>Email:</strong> {request.email || "—"}</p>
              <p><strong>Current Document:</strong> {request.document_name || "Document Request"}</p>
              <p><strong>Date Submitted:</strong> {request.created_at ? new Date(request.created_at).toLocaleString() : "—"}</p>
            </div>

            <h2 style={{ marginTop: "1.5rem" }}>Read-Only Uploaded Files</h2>
            <div className="document-info">
              <p>
                <strong>Requirement File:</strong>{" "}
                {requirementFileUrl ? <a href={requirementFileUrl} target="_blank" rel="noreferrer">View file ↗</a> : "No file"}
              </p>
              <p>
                <strong>Payment Proof:</strong>{" "}
                {paymentProofUrl ? <a href={paymentProofUrl} target="_blank" rel="noreferrer">View file ↗</a> : "No file"}
              </p>
              <p>
                <strong>Released Document:</strong>{" "}
                {releasedDocumentUrl ? <a href={releasedDocumentUrl} target="_blank" rel="noreferrer">View file ↗</a> : "No file"}
              </p>
            </div>

            <button type="button" className="secondary-btn" onClick={() => navigate("/admin")}>
              ← Back to Admin Dashboard
            </button>
          </div>

          <div className="request-right">
            <h2>Request Data</h2>

            <div className="form-group">
              <label>Document Type</label>
              <select name="document_type_id" value={metaForm.document_type_id} onChange={handleMetaChange}>
                <option value="">No document type selected</option>
                {documentTypes.map((type) => (
                  <option value={type.id} key={type.id}>
                    {type.name} {type.fee !== null && type.fee !== undefined ? `(₱${Number(type.fee).toFixed(2)})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label>Request Status</label>
                <select name="status" value={metaForm.status} onChange={handleMetaChange}>
                  {statusOptions.map((status) => (
                    <option value={status} key={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Payment Status</label>
                <select name="payment_status" value={metaForm.payment_status} onChange={handleMetaChange}>
                  {paymentStatusOptions.map((status) => (
                    <option value={status} key={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group">
                <label>Payment Method</label>
                <select name="payment_method" value={metaForm.payment_method} onChange={handleMetaChange}>
                  {paymentMethodOptions.map((method) => (
                    <option value={method} key={method}>{method}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Payment Reference</label>
                <input name="payment_reference" value={metaForm.payment_reference} onChange={handleMetaChange} placeholder="Reference number" />
              </div>
            </div>

            <h2 style={{ marginTop: "1.5rem" }}>Amount Details</h2>
            <div className="form-row" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "1rem" }}>
              <div className="form-group">
                <label>Document Fee</label>
                <input type="number" min="0" step="0.01" name="document_fee" value={metaForm.document_fee} onChange={handleMetaChange} />
              </div>

              <div className="form-group">
                <label>System Fee</label>
                <input type="number" min="0" step="0.01" name="system_fee" value={metaForm.system_fee} onChange={handleMetaChange} />
              </div>

              <div className="form-group">
                <label>Discount Amount</label>
                <input type="number" min="0" step="0.01" name="discount_amount" value={metaForm.discount_amount} onChange={handleMetaChange} />
              </div>

              <div className="form-group">
                <label>Total Amount</label>
                <input type="number" min="0" step="0.01" name="total_amount" value={metaForm.total_amount} onChange={handleMetaChange} />
              </div>
            </div>

            <h2 style={{ marginTop: "1.5rem" }}>Applicant Form Fields</h2>
            <p className="selected-parent-note">
              Data edited here updates the request record only. Requirement images and PDF files are not replaced here.
            </p>

            {Object.keys(formFields).length === 0 && (
              <p className="selected-parent-note">No applicant fields found. Add a field below if needed.</p>
            )}

            {Object.entries(formFields).map(([key, value]) => (
              <div className="form-group" key={key}>
                <label style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                  <span>{key.replaceAll("_", " ")}</span>
                  <button type="button" className="admin-pay-btn danger" onClick={() => handleRemoveField(key)} style={{ padding: "0.3rem 0.6rem" }}>
                    Remove
                  </button>
                </label>
                <input value={value || ""} onChange={(e) => handleFieldChange(key, e.target.value)} />
              </div>
            ))}

            <button type="button" className="secondary-btn" onClick={handleAddField} style={{ marginTop: 0 }}>
              + Add Form Field
            </button>

            <div className="form-group" style={{ marginTop: "1rem" }}>
              <label>Admin Notes</label>
              <textarea
                name="notes"
                value={metaForm.notes}
                onChange={handleMetaChange}
                rows="4"
                placeholder="Add internal notes or explanation for correction."
              />
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "1.2rem" }}>
              <button type="submit" className="primary-btn" disabled={saving} style={{ flex: 1, marginTop: 0 }}>
                {saving ? "Saving..." : "Save Superadmin Changes"}
              </button>

              <button type="button" className="secondary-btn" onClick={() => navigate("/admin")} style={{ flex: 1, marginTop: 0 }}>
                Cancel
              </button>
            </div>
          </div>
        </form>
      </section>
    </>
  );
}
