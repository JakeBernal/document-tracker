import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/navbar";
import "../css/receipt.css";

export default function Receipt() {
  const navigate = useNavigate();
  const { requestId } = useParams();

  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchReceipt = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/signin");
        return;
      }

      try {
        setLoading(true);
        setMessage("");

        const res = await fetch(
          `http://localhost:5001/api/receipts/request/${requestId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        if (!res.ok) {
          setMessage(data.message || "Failed to load receipt.");
          return;
        }

        setReceipt(data.receipt);
      } catch (error) {
        console.error("FETCH RECEIPT ERROR:", error);
        setMessage("Cannot connect to server.");
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [requestId, navigate]);

  const parseJsonValue = (value) => {
    if (!value) return {};

    if (typeof value === "object") {
      return value;
    }

    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  };

  const formatAmount = (amount) => {
    return Number(amount || 0).toLocaleString("en-PH", {
      style: "currency",
      currency: "PHP",
    });
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "—";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatLabel = (key) => {
    return String(key || "")
      .replaceAll("_", " ")
      .replaceAll("-", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const cleanValue = (value) => {
    if (value === undefined || value === null) return "";

    if (typeof value === "object") return "";

    return String(value).trim();
  };

  const isNameField = (key) => {
    const normalizedKey = String(key || "").toLowerCase();

    const acceptedNameKeys = [
      "applicant_full_name",
      "applicant_name",
      "full_name",
      "name",
      "recipient_name",
      "requested_for",
      "requested_for_name",
      "request_for",
      "request_for_name",
      "person_named_in_document",
      "person_name",
      "document_owner",
      "document_owner_name",
      "certificate_owner",
      "certificate_owner_name",
      "beneficiary_name",
      "claimant_name",
      "owner_name",
      "child_name",
      "student_name",
      "parent_name",
      "mother_name",
      "father_name",
      "spouse_name",
      "partner_full_name",
      "partner_name",
      "deceased_name",
      "business_owner_name",
    ];

    if (acceptedNameKeys.includes(normalizedKey)) {
      return true;
    }

    return (
      normalizedKey.includes("name") &&
      !normalizedKey.includes("file") &&
      !normalizedKey.includes("account") &&
      !normalizedKey.includes("company") &&
      !normalizedKey.includes("school") &&
      !normalizedKey.includes("barangay") &&
      !normalizedKey.includes("document")
    );
  };

  const requestFormSources = useMemo(() => {
    if (!receipt) return [];

    const formData = parseJsonValue(receipt.form_data);
    const notes = parseJsonValue(receipt.notes);

    return [
      receipt,
      formData,
      formData.fields,
      notes,
      notes.fields,
      receipt.request_details,
      receipt.request_details?.fields,
    ].filter((item) => item && typeof item === "object");
  }, [receipt]);

  const personNamedRows = useMemo(() => {
    const rows = [];
    const usedKeys = new Set();

    requestFormSources.forEach((source) => {
      Object.entries(source).forEach(([key, value]) => {
        const cleanedValue = cleanValue(value);

        if (!cleanedValue) return;
        if (!isNameField(key)) return;

        const normalizedKey = String(key).toLowerCase();

        if (usedKeys.has(normalizedKey)) return;

        usedKeys.add(normalizedKey);

        rows.push({
          label: formatLabel(key),
          value: cleanedValue,
        });
      });
    });

    const directNameFields = [
      {
        label: "Person Named in Document",
        value:
          receipt?.person_named_in_document ||
          receipt?.requested_for_name ||
          receipt?.request_for_name ||
          receipt?.document_owner_name ||
          receipt?.applicant_name ||
          receipt?.applicant_full_name,
      },
    ];

    directNameFields.forEach((item) => {
      const cleanedValue = cleanValue(item.value);

      if (!cleanedValue) return;

      const alreadyExists = rows.some(
        (row) => row.value.toLowerCase() === cleanedValue.toLowerCase()
      );

      if (!alreadyExists) {
        rows.unshift({
          label: item.label,
          value: cleanedValue,
        });
      }
    });

    return rows;
  }, [receipt, requestFormSources]);

  const mainPersonNamedInDocument = useMemo(() => {
    if (personNamedRows.length > 0) {
      return personNamedRows[0].value;
    }

    return "—";
  }, [personNamedRows]);

  const renderPersonNamedRows = () => {
    if (personNamedRows.length === 0) {
      return (
        <div className="receipt-row">
          <span>Person Named in Document</span>
          <strong>—</strong>
        </div>
      );
    }

    return personNamedRows.map((row, index) => (
      <div className="receipt-row" key={`${row.label}-${index}`}>
        <span>{index === 0 ? "Person Named in Document" : row.label}</span>
        <strong>{row.value}</strong>
      </div>
    ));
  };

  return (
    <>
      <Navbar />

      <section className="receipt-page">
        <div className="receipt-header">
          <h1>Invoice / Official Receipt</h1>
          <p>Generated receipt for document request transaction.</p>
        </div>

        {loading && <p className="receipt-message">Loading receipt...</p>}

        {!loading && message && (
          <div className="receipt-card">
            <p className="receipt-message error">{message}</p>

            <button
              type="button"
              className="receipt-secondary-btn"
              onClick={() => navigate("/citizen")}
            >
              Back to Dashboard
            </button>
          </div>
        )}

        {!loading && receipt && (
          <div className="receipt-card">
            <div className="receipt-top">
              <div>
                <h2>PaperTrail Digital Solutions</h2>
                <p>Barangay/LGU Online Document Request Platform</p>
              </div>

              <div className="receipt-number-box">
                <span>Receipt No.</span>
                <strong>{receipt.receipt_number || "—"}</strong>
              </div>
            </div>

            <div className="receipt-section">
              <h3>Citizen Information</h3>

              <div className="receipt-row">
                <span>Citizen Name</span>
                <strong>{receipt.citizen_name || "—"}</strong>
              </div>

              <div className="receipt-row">
                <span>Email</span>
                <strong>{receipt.citizen_email || "—"}</strong>
              </div>
            </div>

            <div className="receipt-section">
              <h3>Request Information</h3>

              <div className="receipt-row">
                <span>Document Requested</span>
                <strong>{receipt.document_requested || "—"}</strong>
              </div>

              {renderPersonNamedRows()}

              <div className="receipt-row">
                <span>Date Submitted</span>
                <strong>{formatDate(receipt.date_submitted)}</strong>
              </div>

              <div className="receipt-row">
                <span>Request Status</span>
                <strong>{receipt.request_status || "—"}</strong>
              </div>
            </div>

            <div className="receipt-section">
              <h3>Payment Breakdown</h3>

              <div className="receipt-row">
                <span>Document Fee</span>
                <strong>{formatAmount(receipt.document_fee)}</strong>
              </div>

              <div className="receipt-row">
                <span>System Fee</span>
                <strong>{formatAmount(receipt.system_fee)}</strong>
              </div>

              <div className="receipt-row">
                <span>Discount</span>
                <strong>- {formatAmount(receipt.discount_amount)}</strong>
              </div>

              <div className="receipt-row total">
                <span>Total Amount</span>
                <strong>{formatAmount(receipt.total_amount)}</strong>
              </div>
            </div>

            <div className="receipt-section">
              <h3>Payment Information</h3>

              <div className="receipt-row">
                <span>Payment Method</span>
                <strong>{receipt.payment_method || "—"}</strong>
              </div>

              <div className="receipt-row">
                <span>Reference Number</span>
                <strong>{receipt.payment_reference || "—"}</strong>
              </div>

              <div className="receipt-row">
                <span>Payment Status</span>
                <strong>{receipt.payment_status || "—"}</strong>
              </div>

              <div className="receipt-row">
                <span>Issued At</span>
                <strong>{formatDate(receipt.issued_at)}</strong>
              </div>
            </div>

            <div className="receipt-footer">
              <p>
                This receipt confirms the transaction for{" "}
                <strong>{mainPersonNamedInDocument}</strong> under the selected
                document request. The official payment record is based on admin
                or superadmin verification.
              </p>

              <div className="receipt-actions">
                <button
                  type="button"
                  className="receipt-secondary-btn"
                  onClick={() => navigate("/citizen")}
                >
                  Back
                </button>

                <button
                  type="button"
                  className="receipt-primary-btn"
                  onClick={() => window.print()}
                >
                  Print Receipt
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
}