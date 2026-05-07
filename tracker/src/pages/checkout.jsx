import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import "../css/checkout.css";
import { documentRequirements } from "../data/documentRequirements";

const API_BASE_URL = "http://localhost:5001";
const SYSTEM_FEE_AMOUNT = 10;

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

  const transactionNumber = useMemo(() => {
    const existingTransactionNumber = sessionStorage.getItem(
      "checkoutTransactionNumber"
    );

    if (existingTransactionNumber) {
      return existingTransactionNumber;
    }

    const generatedTransactionNumber = `TXN-${Date.now()}`;

    sessionStorage.setItem(
      "checkoutTransactionNumber",
      generatedTransactionNumber
    );

    return generatedTransactionNumber;
  }, []);

  const selectedDoc = useMemo(() => {
    if (checkoutData?.selectedDoc) {
      return checkoutData.selectedDoc;
    }

    if (checkoutData?.selectedDocName) {
      return documentRequirements[checkoutData.selectedDocName] || null;
    }

    return null;
  }, [checkoutData]);

  const [paymentProof, setPaymentProof] = useState(null);
  const [paymentProofName, setPaymentProofName] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [profileGuard, setProfileGuard] = useState({
    loading: true,
    allowed: false,
    message: "Checking profile verification...",
  });

  useEffect(() => {
    const checkProfileBeforeCheckout = async () => {
      const token = localStorage.getItem("token");
      const storedUserRaw = localStorage.getItem("user");

      if (!token || !storedUserRaw) {
        navigate("/signin");
        return;
      }

      try {
        const storedUser = JSON.parse(storedUserRaw);

        if (storedUser.role !== "citizen") {
          setProfileGuard({
            loading: false,
            allowed: true,
            message: "",
          });
          return;
        }

        const res = await fetch(`${API_BASE_URL}/api/profile`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          setProfileGuard({
            loading: false,
            allowed: false,
            message:
              data.message ||
              "Your profile verification could not be checked. Please complete your profile first.",
          });
          return;
        }

        const citizenProfile = data.profile || {};
        const isFullyVerified =
          citizenProfile.verification_status === "Fully Verified" &&
          citizenProfile.age_eligible === true;

        if (!isFullyVerified) {
          setProfileGuard({
            loading: false,
            allowed: false,
            message:
              "Your account must be Fully Verified and at least 18 years old before finalizing any document request.",
          });
          return;
        }

        setProfileGuard({
          loading: false,
          allowed: true,
          message: "",
        });
      } catch (error) {
        console.error("CHECKOUT PROFILE CHECK ERROR:", error);

        localStorage.removeItem("user");
        localStorage.removeItem("token");
        navigate("/signin");
      }
    };

    checkProfileBeforeCheckout();
  }, [navigate]);

  const showMessage = (text, type = "error") => {
    setMessage(text);
    setMessageType(type);
  };

  const cleanMoneySource = (value) => {
    if (value === undefined || value === null || value === "") {
      return "0";
    }

    return String(value)
      .replace("₱", "")
      .replace(",", "")
      .trim();
  };

  const getDocumentFeeInfo = () => {
    const rawFee =
      selectedDoc?.fee ??
      checkoutData?.document_fee ??
      checkoutData?.documentFee ??
      checkoutData?.amountDue ??
      "0";

    const cleanedFee = cleanMoneySource(rawFee);
    const loweredFee = cleanedFee.toLowerCase();

    if (loweredFee === "free") {
      return {
        type: "fixed",
        amount: 0,
        display: "₱0.00",
        databaseValue: "0.00",
      };
    }

    if (loweredFee === "varies") {
      return {
        type: "varies",
        amount: 0,
        display: "Varies",
        databaseValue: "0.00",
      };
    }

    const numericFee = Number(cleanedFee);

    if (Number.isNaN(numericFee)) {
      return {
        type: "fixed",
        amount: 0,
        display: "₱0.00",
        databaseValue: "0.00",
      };
    }

    return {
      type: "fixed",
      amount: numericFee,
      display: `₱${numericFee.toFixed(2)}`,
      databaseValue: numericFee.toFixed(2),
    };
  };

  const formatMoney = (value) => {
    const numericValue = Number(value || 0);
    return numericValue.toFixed(2);
  };

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

  if (profileGuard.loading) {
    return (
      <>
        <Navbar />

        <section className="checkout-page">
          <div className="checkout-guard-card">
            <div className="checkout-guard-icon">⏳</div>
            <h1>Checking Verification</h1>
            <p>Please wait while the system checks your citizen profile status.</p>
          </div>
        </section>
      </>
    );
  }

  if (!profileGuard.allowed) {
    return (
      <>
        <Navbar />

        <section className="checkout-page">
          <div className="checkout-guard-card blocked">
            <div className="checkout-guard-icon">🔒</div>
            <h1>Checkout Not Allowed</h1>
            <p>{profileGuard.message}</p>

            <div className="checkout-guard-actions">
              <button
                type="button"
                className="primary-btn"
                onClick={() => navigate("/profile")}
              >
                Complete Profile Verification
              </button>

              <button
                type="button"
                className="secondary-btn"
                onClick={() => navigate("/citizen")}
              >
                Back to Dashboard
              </button>
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

  const documentFeeInfo = getDocumentFeeInfo();
  const documentFee = documentFeeInfo.databaseValue;
  const documentFeeDisplay = documentFeeInfo.display;

  const systemFee = formatMoney(SYSTEM_FEE_AMOUNT);
  const totalAmount =
    documentFeeInfo.type === "varies"
      ? SYSTEM_FEE_AMOUNT
      : documentFeeInfo.amount + SYSTEM_FEE_AMOUNT;

  const totalAmountForDatabase = formatMoney(totalAmount);

  const totalAmountDisplay =
    documentFeeInfo.type === "varies"
      ? `Varies + ₱${systemFee} system fee`
      : `₱${totalAmountForDatabase}`;

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
    if (paymentMethod === "PayMaya") return "PayMaya";
    if (paymentMethod === "Onsite Payment") return "Cash";

    return "Other";
  })();

  const handlePaymentReferenceChange = (e) => {
    setPaymentReference(e.target.value);
    setMessage("");
    setMessageType("");
  };

  const handlePaymentProofChange = (e) => {
    const selectedFile = e.target.files[0];

    setMessage("");
    setMessageType("");

    if (!selectedFile) {
      setPaymentProof(null);
      setPaymentProofName("");
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];

    const maxFileSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(selectedFile.type)) {
      setPaymentProof(null);
      setPaymentProofName("");
      e.target.value = "";

      showMessage(
        "Invalid payment proof. Please upload JPG, PNG, WEBP, or PDF.",
        "error"
      );
      return;
    }

    if (selectedFile.size > maxFileSize) {
      setPaymentProof(null);
      setPaymentProofName("");
      e.target.value = "";

      showMessage("Payment proof is too large. Maximum file size is 5 MB.", "error");
      return;
    }

    setPaymentProof(selectedFile);
    setPaymentProofName(selectedFile.name);
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

        <span className="checkout-value">
          {value || "—"}
        </span>
      </div>
    ));
  };

  const validateCheckout = () => {
    if (!profileGuard.allowed) {
      return "Your account must be Fully Verified and at least 18 years old before finalizing any document request.";
    }

    if (!documentFile) {
      return "The uploaded requirement file was not detected. Please go back and upload the required document again.";
    }

    if (!selectedDoc.id) {
      return "Document type was not detected. Please go back and select the document again.";
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
      showMessage(validationError, "error");
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
      requestData.append("payment_method", paymentMethodForDatabase);
      requestData.append(
        "payment_reference",
        isOnlinePayment ? paymentReference.trim() : ""
      );

      requestData.append("document_fee", documentFee);
      requestData.append("system_fee", systemFee);
      requestData.append("total_amount", totalAmountForDatabase);
      requestData.append("amount_due", totalAmountForDatabase);

      requestData.append(
        "notes",
        JSON.stringify({
          transaction_number: transactionNumber,
          document_name: checkoutData.selectedDocName,
          selected_form: selectedDoc.selectedChoiceId || null,
          parent_document: selectedDoc.parentTitle || null,
          category: selectedDoc.category || checkoutData.category,
          fields: checkoutData.formData || {},
          payment_method: paymentMethod,
          payment_method_for_database: paymentMethodForDatabase,
          payment_reference_number: isOnlinePayment
            ? paymentReference.trim()
            : null,
          document_fee: documentFee,
          document_fee_display: documentFeeDisplay,
          system_fee: systemFee,
          total_amount: totalAmountForDatabase,
          total_amount_display: totalAmountDisplay,
          amount_due: totalAmountForDatabase,
          payment_account_name: paymentAccount.name,
          payment_account_number: paymentAccount.number,
          uploaded_requirement_file: documentFileName,
          payment_proof_file: paymentProofName || null,
          business_rule:
            "System fee is required for every request, even when the document fee is free.",
          payment_status_note: isOnlinePayment
            ? "Payment proof submitted. Payment is pending admin verification."
            : "Payment will be completed onsite and confirmed by barangay staff.",
          security_note:
            "This transaction summary is not an official receipt. Official receipt is generated only after admin or superadmin payment confirmation.",
          created_at: new Date().toISOString(),
        })
      );

      requestData.append("file", documentFile);

      if (isOnlinePayment && paymentProof) {
        requestData.append("payment_proof", paymentProof);
      }

      const res = await fetch(`${API_BASE_URL}/api/requests`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: requestData,
      });

      const data = await res.json();

      if (!res.ok) {
        showMessage(data.message || "Failed to submit request.", "error");
        return;
      }

      sessionStorage.removeItem("checkoutDraft");
      sessionStorage.removeItem("checkoutTransactionNumber");
      localStorage.removeItem("paymentData");

      showMessage(
        "Request submitted successfully! Payment is pending verification.",
        "success"
      );

      setTimeout(() => {
        navigate("/citizen");
      }, 900);
    } catch (error) {
      console.error("CHECKOUT SUBMIT ERROR:", error);
      showMessage("Cannot connect to server. Please check your backend.", "error");
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
              <p className={`checkout-message ${messageType}`}>{message}</p>
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

            <h2 className="checkout-section-gap">Applicant Details</h2>

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
                <h3>{documentFeeDisplay}</h3>

                <p className="amount-label-gap">System Fee</p>
                <h3>₱{systemFee}</h3>

                <p className="amount-label-gap">Total Amount to Pay</p>
                <h3>{totalAmountDisplay}</h3>
              </div>

              <p className="payment-note">
                System fee is required for every request, even when the document
                fee is free.
              </p>

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
                      onChange={handlePaymentReferenceChange}
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
                      accept="image/jpeg,image/png,image/webp,application/pdf"
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
              <h2>Transaction Summary</h2>

              <p className="security-note">
                This is not an official receipt. Payment will be confirmed only
                after admin or superadmin verification.
              </p>

              <div className="transaction-number">{transactionNumber}</div>

              <p>
                <strong>Document:</strong> {checkoutData.selectedDocName}
              </p>

              <p>
                <strong>Payment Method:</strong> {paymentMethod}
              </p>

              {isOnlinePayment && (
                <p>
                  <strong>Reference Number:</strong>{" "}
                  {paymentReference || "Not yet entered"}
                </p>
              )}

              <p>
                <strong>Document Fee:</strong> {documentFeeDisplay}
              </p>

              <p>
                <strong>System Fee:</strong> ₱{systemFee}
              </p>

              <p>
                <strong>Total Amount:</strong> {totalAmountDisplay}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                <span className="pending-status">
                  {isOnlinePayment
                    ? "Payment Pending Admin Verification"
                    : "For Onsite Payment Confirmation"}
                </span>
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