import { useEffect, useState } from "react";
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
                <strong>{receipt.receipt_number}</strong>
              </div>
            </div>

            <div className="receipt-section">
              <h3>Citizen Information</h3>

              <div className="receipt-row">
                <span>Citizen Name</span>
                <strong>{receipt.citizen_name}</strong>
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
                <strong>{receipt.document_requested}</strong>
              </div>

              <div className="receipt-row">
                <span>Date Submitted</span>
                <strong>{formatDate(receipt.date_submitted)}</strong>
              </div>

              <div className="receipt-row">
                <span>Request Status</span>
                <strong>{receipt.request_status}</strong>
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
                <strong>{receipt.payment_method}</strong>
              </div>

              <div className="receipt-row">
                <span>Reference Number</span>
                <strong>{receipt.payment_reference}</strong>
              </div>

              <div className="receipt-row">
                <span>Payment Status</span>
                <strong>{receipt.payment_status}</strong>
              </div>

              <div className="receipt-row">
                <span>Issued At</span>
                <strong>{formatDate(receipt.issued_at)}</strong>
              </div>
            </div>

            <div className="receipt-footer">
              <p>
                This receipt is system-generated for startup MVP demonstration.
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