import React, { useEffect, useMemo, useState } from "react";
import "../css/requestform.css";
import { useLocation, useNavigate } from "react-router-dom";
import { documentRequirements } from "../data/documentRequirements";
import Navbar from "../components/navbar";

export default function RequestForm() {
  const location = useLocation();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  const selectedFromDocuments = location.state?.document;
  const initialDocName = selectedFromDocuments?.title || "Barangay Clearance";

  const [selectedDocName, setSelectedDocName] = useState(initialDocName);
  const [formData, setFormData] = useState({});
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [message, setMessage] = useState("");
  const [viewDocument, setViewDocument] = useState(false);
  const [zoomImage, setZoomImage] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [seniorDiscountCode, setSeniorDiscountCode] = useState("");
  const [seniorBeneficiaryBirthDate, setSeniorBeneficiaryBirthDate] = useState("");

  const MINIMUM_REQUEST_AGE = 18;
  const SENIOR_CITIZEN_AGE = 60;

  const getMaximumBirthDateForAge = (minimumAge) => {
    const today = new Date();
    const maximumDate = new Date(
      today.getFullYear() - minimumAge,
      today.getMonth(),
      today.getDate()
    );

    return maximumDate.toISOString().split("T")[0];
  };

  const getMinimumBirthDate = () => {
    return getMaximumBirthDateForAge(MINIMUM_REQUEST_AGE);
  };

  const getAgeFromDate = (dateValue) => {
    if (!dateValue) return null;

    const birthDate = new Date(`${dateValue}T00:00:00`);

    if (Number.isNaN(birthDate.getTime())) {
      return null;
    }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const birthdayHasPassed =
      today.getMonth() > birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() &&
        today.getDate() >= birthDate.getDate());

    if (!birthdayHasPassed) {
      age -= 1;
    }

    return age;
  };

  const isAtLeastAge = (dateValue, minimumAge) => {
    const age = getAgeFromDate(dateValue);

    return age !== null && age >= minimumAge;
  };

  const isAtLeastRequestAge = (dateValue) => {
    return isAtLeastAge(dateValue, MINIMUM_REQUEST_AGE);
  };

  const isSeniorAge = (dateValue) => {
    return isAtLeastAge(dateValue, SENIOR_CITIZEN_AGE);
  };

  const normalizeFieldText = (value) => {
    return String(value || "")
      .toLowerCase()
      .replaceAll("_", " ")
      .trim();
  };

  const isBirthDateField = (field) => {
    const fieldName = normalizeFieldText(field.name);
    const fieldLabel = normalizeFieldText(field.label);
    const combinedText = `${fieldName} ${fieldLabel}`;

    return (
      field.type === "date" &&
      (combinedText.includes("birth") || combinedText.includes("date of birth"))
    );
  };

  const isAgeField = (field) => {
    const fieldName = normalizeFieldText(field.name);
    const fieldLabel = normalizeFieldText(field.label);

    return field.type === "number" && (fieldName === "age" || fieldLabel === "age");
  };

  const getSeniorDetectedFromForm = () => {
    const birthDateFields = (selectedDoc.fields || []).filter((field) =>
      isBirthDateField(field)
    );

    const detectedField = birthDateFields.find((field) =>
      isSeniorAge(formData[field.name])
    );

    if (detectedField) {
      return {
        detected: true,
        source: detectedField.label,
        birthDate: formData[detectedField.name],
        age: getAgeFromDate(formData[detectedField.name]),
      };
    }

    if (seniorBeneficiaryBirthDate && isSeniorAge(seniorBeneficiaryBirthDate)) {
      return {
        detected: true,
        source: "Senior beneficiary birthdate",
        birthDate: seniorBeneficiaryBirthDate,
        age: getAgeFromDate(seniorBeneficiaryBirthDate),
      };
    }

    return {
      detected: false,
      source: "No senior birthdate detected in the request form yet",
      birthDate: "",
      age: null,
    };
  };

  const minimumBirthDate = getMinimumBirthDate();
  const seniorBirthDateMax = getMaximumBirthDateForAge(SENIOR_CITIZEN_AGE);

  const [profileGuard, setProfileGuard] = useState({
    loading: true,
    allowed: false,
    message: "Checking profile verification...",
  });

  useEffect(() => {
    const checkUserAndProfile = async () => {
      const storedUserRaw = localStorage.getItem("user");
      const token = localStorage.getItem("token");

      if (!storedUserRaw || !token) {
        navigate("/signin");
        return;
      }

      try {
        const storedUser = JSON.parse(storedUserRaw);
        setUser(storedUser);

        if (storedUser.role !== "citizen") {
          setProfileGuard({ loading: false, allowed: true, message: "" });
          return;
        }

        const res = await fetch("http://localhost:5001/api/profile", {
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
              "Your account must be Fully Verified and at least 18 years old before requesting any document.",
          });
          return;
        }

        setProfileGuard({ loading: false, allowed: true, message: "" });
      } catch (error) {
        console.error("PROFILE CHECK ERROR:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        navigate("/signin");
      }
    };

    checkUserAndProfile();
  }, [navigate]);

  const selectedDoc = useMemo(() => {
    if (
      selectedFromDocuments?.title === selectedDocName &&
      selectedFromDocuments?.parentTitle
    ) {
      const parentDoc = documentRequirements[selectedFromDocuments.parentTitle];

      return {
        ...parentDoc,
        ...selectedFromDocuments,
        category: parentDoc?.category || selectedFromDocuments.category,
        fee: parentDoc?.fee || selectedFromDocuments.fee,
        time: parentDoc?.time || selectedFromDocuments.time,
        uploadLabel:
          selectedFromDocuments.uploadLabel || parentDoc?.uploadLabel,
        fields: selectedFromDocuments.fields || parentDoc?.fields || [],
        images: selectedFromDocuments.images || [],
      };
    }

    return (
      documentRequirements[selectedDocName] ||
      documentRequirements["Barangay Clearance"]
    );
  }, [selectedDocName, selectedFromDocuments]);

  const activeImages = selectedDoc?.images || [];
  const previewImage = activeImages[0];

  const documentNames = Object.keys(documentRequirements).filter((docName) => {
    const doc = documentRequirements[docName];

    return doc.category === selectedDoc.category && !doc.hideFromList;
  });

  const isAdmin = user?.role === "admin";

  const paymentOptions = [
    {
      value: "GCash",
      label: "GCash",
      description: "Pay using GCash on the checkout page.",
    },
    {
      value: "PayMaya",
      label: "PayMaya",
      description: "Pay using PayMaya on the checkout page.",
    },
    {
      value: "Onsite Payment",
      label: "Onsite Payment",
      description: "Pay directly at the Barangay or LGU office.",
    },
  ];

  const handleChangeDoc = (e) => {
    setSelectedDocName(e.target.value);
    setFormData({});
    setFile(null);
    setFileName("");
    setPaymentMethod("");
    setSeniorDiscountCode("");
    setSeniorBeneficiaryBirthDate("");
    setMessage("");
    setViewDocument(false);
    setZoomImage(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAttachmentChange = (e) => {
    const selectedFile = e.target.files[0];

    setFile(selectedFile || null);
    setFileName(selectedFile ? selectedFile.name : "");
  };

  const validateForm = () => {
    for (const field of selectedDoc.fields || []) {
      const value = formData[field.name];

      if (field.required && (!value || String(value).trim() === "")) {
        return `Please fill in ${field.label}.`;
      }

      if (value && isBirthDateField(field) && !isAtLeastRequestAge(value)) {
        return `${field.label} must show that the person is at least ${MINIMUM_REQUEST_AGE} years old.`;
      }

      if (value && isAgeField(field) && Number(value) < MINIMUM_REQUEST_AGE) {
        return `${field.label} must be at least ${MINIMUM_REQUEST_AGE}.`;
      }
    }

    if (!file) {
      return `Please upload: ${selectedDoc.uploadLabel}.`;
    }

    if (!isAdmin && !paymentMethod) {
      return "Please choose a payment method.";
    }

    return "";
  };

  const getAmountDue = () => {
    if (!selectedDoc?.fee) return "0.00";

    if (selectedDoc.fee === "Free") return "0.00";
    if (selectedDoc.fee === "Varies") return "Varies";

    return String(selectedDoc.fee).replace("₱", "").trim();
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!user) {
      navigate("/signin");
      return;
    }

    if (!isAdmin && !profileGuard.allowed) {
      setMessage(
        "Your account must be Fully Verified and at least 18 years old before requesting any document."
      );
      return;
    }

    const validationError = validateForm();

    if (validationError) {
      setMessage(validationError);
      return;
    }

    const checkoutData = {
      user,
      selectedDoc,
      selectedDocName,
      formData,
      file,
      fileName,
      paymentMethod: isAdmin ? "None" : paymentMethod,
      seniorDiscountCode: seniorDiscountCode.trim().toUpperCase(),
      seniorBeneficiaryBirthDate,
      seniorEligibilityPreview: getSeniorDetectedFromForm(),
      amountDue: getAmountDue(),
      category: selectedDoc.category,
      processingTime: selectedDoc.time,
      requiredAttachment: selectedDoc.uploadLabel,
    };

    sessionStorage.setItem(
      "checkoutDraft",
      JSON.stringify({
        selectedDocName,
        formData,
        fileName,
        paymentMethod: isAdmin ? "None" : paymentMethod,
        seniorDiscountCode: seniorDiscountCode.trim().toUpperCase(),
        seniorBeneficiaryBirthDate,
        seniorEligibilityPreview: getSeniorDetectedFromForm(),
        amountDue: getAmountDue(),
        category: selectedDoc.category,
        processingTime: selectedDoc.time,
        requiredAttachment: selectedDoc.uploadLabel,
      })
    );

    navigate("/checkout", {
      state: checkoutData,
    });
  };

  if (profileGuard.loading) {
    return (
      <>
        <Navbar />

        <section className="request-page">
          <div className="request-guard-card">
            <div className="request-guard-icon">⏳</div>
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

        <section className="request-page">
          <div className="request-guard-card blocked">
            <div className="request-guard-icon">🔒</div>
            <h1>Request Not Allowed</h1>
            <p>{profileGuard.message}</p>
            <div className="request-guard-actions">
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

  return (
    <>
      <Navbar />

      <section className="request-page">
        <div className="request-header">
          <h1>{isAdmin ? "Upload Document" : "Document Request"}</h1>
          <p>
            {isAdmin
              ? "Upload and submit document files for processing."
              : "Please complete the required information and upload the necessary supporting documents."}
          </p>
        </div>

        <div className="request-container">
          <div className="request-left">
            <h2>Document Information</h2>

            <div className="form-group">
              <label>Selected Document Type</label>
              <h1>{selectedDocName}</h1>
            </div>

            {selectedDoc.parentTitle && (
              <p className="selected-parent-note">
                From: <strong>{selectedDoc.parentTitle}</strong>
              </p>
            )}

            <div
              className="document-preview image-only-preview clickable-preview"
              onClick={() => previewImage && setViewDocument(true)}
              title="Click to view document"
            >
              {previewImage ? (
                <img
                  src={previewImage}
                  alt={selectedDocName}
                  className="request-preview-full-img"
                />
              ) : (
                <div className="no-preview-box">
                  No document preview available
                </div>
              )}

              <span className="preview-click-label">Click image to view</span>
            </div>

            <button
              type="button"
              className="view-document-btn"
              onClick={() => setViewDocument(true)}
              disabled={!previewImage}
            >
              View Document
            </button>

            <div className="document-info">
              <p>
                <strong>Document Name:</strong> {selectedDocName}
              </p>
              <p>
                <strong>Category:</strong> {selectedDoc.category}
              </p>
              <p>
                <strong>Processing Fee:</strong> {selectedDoc.fee}
              </p>
              <p>
                <strong>Processing Time:</strong> {selectedDoc.time}
              </p>
              <p>
                <strong>Required Attachment:</strong> {selectedDoc.uploadLabel}
              </p>
              <p>
                <strong>Account Role:</strong> {isAdmin ? "Admin" : "Citizen"}
              </p>
            </div>

            <button
              type="button"
              className="secondary-btn"
              onClick={() => navigate("/documents")}
            >
              Change Document
            </button>
          </div>

          <div className="request-right">
            <h2>{isAdmin ? "Upload Information" : "Applicant Information"}</h2>

            {message && <p className="form-message">{message}</p>}

            <div className="form-group">
              <label>Select Document Type</label>
              <select value={selectedDocName} onChange={handleChangeDoc}>
                {documentNames.map((docName) => (
                  <option key={docName} value={docName}>
                    {docName}
                  </option>
                ))}
              </select>
            </div>

            <form className="request-form" onSubmit={handleSubmit}>
              {(selectedDoc.fields || []).map((field) => (
                <div className="form-group" key={field.name}>
                  <label>
                    {field.label}
                    {field.required && (
                      <span className="required-star"> *</span>
                    )}
                  </label>

                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name] || ""}
                    onChange={handleChange}
                    placeholder={field.placeholder || ""}
                    max={isBirthDateField(field) ? minimumBirthDate : undefined}
                    min={isAgeField(field) ? MINIMUM_REQUEST_AGE : undefined}
                  />

                  {isBirthDateField(field) && (
                    <p className="request-age-note">
                      Minimum age required: {MINIMUM_REQUEST_AGE} years old.
                    </p>
                  )}

                  {isAgeField(field) && (
                    <p className="request-age-note">
                      Age must be {MINIMUM_REQUEST_AGE} or above.
                    </p>
                  )}
                </div>
              ))}

              {!isAdmin && (
                <div className="senior-discount-card">
                  <div className="senior-discount-header">
                    <div>
                      <h3>Senior Citizen Discount</h3>
                      <p>
                        Optional. Enter a valid discount or waiver code only when the requester or the person named in the document is a senior citizen.
                      </p>
                    </div>
                    <span className="senior-age-badge">60+ only</span>
                  </div>

                  <div className="form-row senior-discount-grid">
                    <div className="form-group">
                      <label>Senior Discount / Waiver Code</label>
                      <input
                        type="text"
                        value={seniorDiscountCode}
                        onChange={(event) =>
                          setSeniorDiscountCode(event.target.value.toUpperCase())
                        }
                        placeholder="Example: SENIOR20"
                      />
                    </div>

                    <div className="form-group">
                      <label>Senior Beneficiary Birthdate</label>
                      <input
                        type="date"
                        value={seniorBeneficiaryBirthDate}
                        onChange={(event) =>
                          setSeniorBeneficiaryBirthDate(event.target.value)
                        }
                        max={seniorBirthDateMax}
                      />
                    </div>
                  </div>

                  <p className="request-age-note">
                    {getSeniorDetectedFromForm().detected
                      ? `Senior eligibility detected from ${getSeniorDetectedFromForm().source}. Age: ${getSeniorDetectedFromForm().age}.`
                      : "No senior discount will be applied unless a valid code is entered and senior eligibility is verified from the request birthdate or citizen profile birthdate."}
                  </p>
                </div>
              )}

              <div className="form-group">
                <label>
                  {selectedDoc.uploadLabel}
                  <span className="required-star"> *</span>
                </label>

                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleAttachmentChange}
                />

                {fileName && (
                  <p className="selected-parent-note">
                    Selected file: <strong>{fileName}</strong>
                  </p>
                )}
              </div>

              {!isAdmin && (
                <div className="form-group">
                  <label>
                    Type of Payment
                    <span className="required-star"> *</span>
                  </label>

                  <div className="payment-options">
                    {paymentOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={
                          paymentMethod === option.value
                            ? "payment-option active"
                            : "payment-option"
                        }
                        onClick={() => setPaymentMethod(option.value)}
                      >
                        <strong>{option.label}</strong>
                        <span>{option.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button type="submit" className="primary-btn">
                Continue to Checkout
              </button>
            </form>
          </div>
        </div>

        {viewDocument && (
          <div
            className="whole-document-overlay"
            onClick={() => setViewDocument(false)}
          >
            <div
              className="whole-document-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="whole-document-close"
                onClick={() => setViewDocument(false)}
              >
                ×
              </button>

              <h2>{selectedDocName}</h2>
              <p className="whole-document-subtitle">
                Click the form image to zoom.
              </p>

              <div className="whole-document-images">
                {activeImages.filter(Boolean).map((img, index) => (
                  <div className="whole-document-page" key={index}>
                    <p>Page {index + 1}</p>
                    <img
                      src={img}
                      alt={`${selectedDocName} page ${index + 1}`}
                      onClick={() => setZoomImage(img)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {zoomImage && (
          <div className="zoom-overlay" onClick={() => setZoomImage(null)}>
            <button
              type="button"
              className="zoom-close"
              onClick={() => setZoomImage(null)}
            >
              ×
            </button>

            <img
              src={zoomImage}
              alt="Zoomed document"
              className="zoom-document-img"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </section>
    </>
  );
}