import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import "../css/checkout.css";
import { documentRequirements } from "../data/documentRequirements";

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();

  const fallbackDraft = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("checkoutDraft") || "null");
    } catch {
      return null;
    }
  }, []);

  const checkoutData = location.state || fallbackDraft;

  const [paymentProof, setPaymentProof] = useState(null);
  const [paymentProofName, setPaymentProofName] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedDoc = useMemo(() => {
    if (checkoutData?.selectedDoc) {
      return checkoutData.selectedDoc;
    }

    if (checkoutData?.selectedDocName) {
      return documentRequirements[checkoutData.selectedDocName] || null;
    }

    return null;
  }, [checkoutData]);

  if (!checkoutData || !selectedDoc) {
    return (
      <>
        <Navbar />

        <section className="checkout-page">
          <div className="checkout-header">
            <h1>Checkout Not Available</h1>
            <p>No request data found. Please complete the request form first.</p>
          </div>

          <div className="checkout-container">
            <div className="checkout-info">
              <h2>Missing Request Details</h2>
              <p>
                The checkout page needs request details from the document form.
              </p>

              <div className="checkout-actions">
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => navigate("/request")}
                >
                  Back to Request Form
                </button>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  const paymentMethod = checkoutData.paymentMethod || "Onsite Payment";
  const isOnlinePayment =
    paymentMethod === "GCash" || paymentMethod === "PayMaya";

  const documentFile = checkoutData.file || null;
  const documentFileName = checkoutData.fileName || "No file selected";

  const documentFee =
  checkoutData.amountDue ||
  (selectedDoc.fee === "Free"
    ? "0.00"
    : selectedDoc.fee === "Varies"
    ? "Varies"
    : String(selectedDoc.fee || "0.00").replace("₱", "").trim());

const systemFee =
  documentFee === "0.00" || documentFee === "Varies" ? "0.00" : "10.00";

const totalAmount =
  documentFee === "Varies"
    ? "Varies"
    : (Number(documentFee) + Number(systemFee)).toFixed(2);

  const receiptNumber = `PT-${Date.now()}`;

  const paymentAccount = (() => {
    const category = selectedDoc.category || checkoutData.category;

    if (paymentMethod === "GCash") {
      if (category === "LGU") {
        return {
          name: "LGU Treasury Office",
          number: "09XX XXX XXXX",
          note: "Send the payment to the official LGU GCash account.",
        };
      }

      return {
        name: "Barangay Payment Account",
        number: "09XX XXX XXXX",
        note: "Send the payment to the official Barangay GCash account.",
      };
    }

    if (paymentMethod === "PayMaya") {
      if (category === "LGU") {
        return {
          name: "LGU Treasury Office",
          number: "09XX XXX XXXX",
          note: "Send the payment to the official LGU PayMaya account.",
        };
      }

      return {
        name: "Barangay Payment Account",
        number: "09XX XXX XXXX",
        note: "Send the payment to the official Barangay PayMaya account.",
      };
    }

    return {
      name: category === "LGU" ? "LGU Office" : "Barangay Office",
      number: "N/A",
      note: "Pay directly at the office during claiming or processing.",
    };
  })();

  const paymentMethodForDatabase = (() => {
    if (paymentMethod === "GCash") return "GCash";
    if (paymentMethod === "Onsite Payment") return "Cash";
    if (paymentMethod === "PayMaya") return "Other";

    return "Other";
  })();

  const handlePaymentProofChange = (e) => {
    const selectedFile = e.target.files[0];

    setPaymentProof(selectedFile || null);
    setPaymentProofName(selectedFile ? selectedFile.name : "");
  };

  const renderApplicantFields = () => {
    const fields = checkoutData.formData || {};

    const entries = Object.entries(fields);

    if (entries.length === 0) {
      return (
        <div className="checkout-detail-row">
          <span className="checkout-label">Applicant Details</span>
          <span className="checkout-value">No applicant details found.</span>
        </div>
      );
    }

    return entries.map(([key, value]) => (
      <div className="checkout-detail-row" key={key}>
        <span className="checkout-label">
          {key
            .replaceAll("_", " ")
            .replace(/\b\w/g, (char) => char.toUpperCase())}
        </span>
        <span className="checkout-value">{value || "—"}</span>
      </div>
    ));
  };

  const validateCheckout = () => {
    if (!documentFile) {
      return "The uploaded requirement file was not detected. Please go back and upload the required document again.";
    }

    if (isOnlinePayment && !paymentReference.trim()) {
    return `Please enter the ${paymentMethod} reference number.`;
    }

    if (isOnlinePayment && !paymentProof) {
    return `Please upload proof of payment for ${paymentMethod}.`;
    }

    return "";
  };

  const handleFinalizePayment = async () => {
    const validationError = validateCheckout();

    if (validationError) {
      setMessage(validationError);
      setMessageType("error");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/signin");
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage("");
      setMessageType("");

      const requestData = new FormData();

      requestData.append("document_type_id", selectedDoc.id);

      requestData.append(
        "notes",
        JSON.stringify({
          receipt_number: receiptNumber,
          document_name: checkoutData.selectedDocName,
          selected_form: selectedDoc.selectedChoiceId || null,
          parent_document: selectedDoc.parentTitle || null,
          category: selectedDoc.category || checkoutData.category,
          fields: checkoutData.formData || {},
          payment_method: paymentMethod,
          payment_method_for_database: paymentMethodForDatabase,
          payment_reference_number: paymentReference.trim() || null,
          document_fee: documentFee,
          system_fee: systemFee,
          total_amount: totalAmount,
          payment_account_name: paymentAccount.name,
          payment_account_number: paymentAccount.number,
          uploaded_requirement_file: documentFileName,
          payment_proof_file: paymentProofName || null,
          payment_note: isOnlinePayment
            ? "Payment proof uploaded for admin verification."
            : "Payment will be made onsite.",
          created_at: new Date().toISOString(),
        })
      );

      requestData.append("payment_method", paymentMethodForDatabase);
      requestData.append(
        "payment_reference",
        isOnlinePayment ? paymentReference.trim() : receiptNumber
        );
      requestData.append("amount_due", totalAmount === "Varies" ? 0 : totalAmount);

      /*
        Current backend route uses upload.single("file").
        This sends the required document attachment as "file".
        Payment proof is recorded by filename in notes.
        To upload payment proof as a second file, backend must use upload.fields().
      */
      requestData.append("file", documentFile);

        if (isOnlinePayment && paymentProof) {
        requestData.append("payment_proof", paymentProof);
        }

      const res = await fetch("http://localhost:5001/api/requests", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: requestData,
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Failed to submit request.");
        setMessageType("error");
        return;
      }

      sessionStorage.removeItem("checkoutDraft");
      localStorage.removeItem("paymentData");

      setMessage("Request submitted successfully!");
      setMessageType("success");

      setTimeout(() => {
        navigate("/citizen");
      }, 900);
    } catch (error) {
      console.error("CHECKOUT SUBMIT ERROR:", error);
      setMessage("Cannot connect to server. Please check your backend.");
      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />

      <section className="checkout-page">
        <div className="checkout-header">
          <h1>Checkout Confirmation</h1>
          <p>Review your request details before final submission.</p>
        </div>

        <div className="checkout-container">
          <div className="checkout-info">
            <h2>Request Details</h2>

            {message && (
              <p className={`checkout-message ${messageType}`}>
                {message}
              </p>
            )}

            <div className="checkout-detail-row">
              <span className="checkout-label">Document Name</span>
              <span className="checkout-value">
                {checkoutData.selectedDocName}
              </span>
            </div>

            <div className="checkout-detail-row">
              <span className="checkout-label">Category</span>
              <span className="checkout-value">
                {selectedDoc.category || checkoutData.category || "—"}
              </span>
            </div>

            <div className="checkout-detail-row">
              <span className="checkout-label">Processing Time</span>
              <span className="checkout-value">
                {selectedDoc.time || checkoutData.processingTime || "—"}
              </span>
            </div>

            <div className="checkout-detail-row">
              <span className="checkout-label">Required Attachment</span>
              <span className="checkout-value">
                {selectedDoc.uploadLabel ||
                  checkoutData.requiredAttachment ||
                  "—"}
              </span>
            </div>

            <div className="checkout-detail-row">
              <span className="checkout-label">Uploaded File</span>
              <span className="checkout-value">{documentFileName}</span>
            </div>

            <h2 style={{ marginTop: "28px" }}>Applicant Details</h2>

            {renderApplicantFields()}
          </div>

          <div className="checkout-side">
            <div className="checkout-payment">
              <h2>Payment Details</h2>

              <p>
                <span className="payment-badge">{paymentMethod}</span>
              </p>

              <div className="amount-box">
                <p>Document Fee</p>
                <h3>{documentFee === "Varies" ? "Varies" : `₱${documentFee}`}</h3>

                <p style={{ marginTop: "14px" }}>System Fee</p>
                <h3>₱{systemFee}</h3>

                <p style={{ marginTop: "14px" }}>Total Amount to Pay</p>
                <h3>{totalAmount === "Varies" ? "Varies" : `₱${totalAmount}`}</h3>
                </div>

              {isOnlinePayment ? (
                <div className="payment-instructions">
                  <p>
                    <strong>{paymentMethod} Account Name:</strong>{" "}
                    {paymentAccount.name}
                  </p>
                  <p>
                    <strong>{paymentMethod} Number:</strong>{" "}
                    {paymentAccount.number}
                  </p>
                  <p>{paymentAccount.note}</p>
                  <p className="payment-note">
                    After paying, upload a screenshot or receipt for admin
                    verification.
                  </p>
                </div>
              ) : (
                <div className="payment-instructions">
                  <p>
                    <strong>Payment Location:</strong> {paymentAccount.name}
                  </p>
                  <p>{paymentAccount.note}</p>
                  <p className="payment-note">
                    Bring valid ID and prepare the exact amount when paying
                    onsite.
                  </p>
                </div>
              )}

              {isOnlinePayment && (
  <>
    <div className="form-group">
      <label>
        {paymentMethod} Reference Number
        <span className="required-star"> *</span>
      </label>

      <input
        type="text"
        value={paymentReference}
        onChange={(e) => setPaymentReference(e.target.value)}
        placeholder="Enter transaction reference number"
      />
    </div>

            <div className="form-group">
            <label>
                Upload Proof of Payment
                <span className="required-star"> *</span>
            </label>

            <input
                type="file"
                accept="image/*,.pdf"
                onChange={handlePaymentProofChange}
            />

            {paymentProofName && (
                <p className="selected-file">
                Selected file: <strong>{paymentProofName}</strong>
                </p>
            )}
            </div>
        </>
        )}
            </div>

            <div className="checkout-receipt">
              <h2>Receipt Preview</h2>

                            {isOnlinePayment && (
                <p>
                    <strong>Reference Number:</strong>{" "}
                    {paymentReference || "Not yet entered"}
                </p>
                )}

              <div className="receipt-number">{receiptNumber}</div>

              <p>
                <strong>Document:</strong> {checkoutData.selectedDocName}
              </p>
              <p>
                <strong>Payment:</strong> {paymentMethod}
              </p>

                <p>
                <strong>Document Fee:</strong>{" "}
                {documentFee === "Varies" ? "Varies" : `₱${documentFee}`}
                </p>
                <p>
                <strong>System Fee:</strong> ₱{systemFee}
                </p>
                <p>
                <strong>Total Amount:</strong>{" "}
                {totalAmount === "Varies" ? "Varies" : `₱${totalAmount}`}
                </p>

              <p>
                <strong>Status:</strong>{" "}
                {isOnlinePayment
                  ? "For payment verification"
                  : "For onsite payment"}
              </p>

              <div className="checkout-actions">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => navigate("/request")}
                  disabled={isSubmitting}
                >
                  Back
                </button>

                <button
                  type="button"
                  className="primary-btn"
                  onClick={handleFinalizePayment}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Finalize Request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}