import React, { useMemo, useState } from "react";
import "../css/requestform.css";
import { useLocation, useNavigate } from "react-router-dom";
import { documentRequirements } from "../data/documentRequirements";
import Navbar from "../components/navbar";

export default function RequestForm() {
  const location = useLocation();
  const navigate = useNavigate();

  const selectedFromDocuments = location.state?.document;

  const initialDocName =
    selectedFromDocuments?.title || "Barangay Clearance";

  const [selectedDocName, setSelectedDocName] = useState(initialDocName);
  const [formData, setFormData] = useState({});
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [viewDocument, setViewDocument] = useState(false);
  const [zoomImage, setZoomImage] = useState(null);

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
          selectedFromDocuments.uploadLabel ||
          selectedFromDocuments.requirement ||
          parentDoc?.uploadLabel,
        fields: selectedFromDocuments.fields || parentDoc?.fields || [],
        images: selectedFromDocuments.images || [],
      };
    }

    if (documentRequirements[selectedDocName]) {
      return documentRequirements[selectedDocName];
    }

    return documentRequirements["Barangay Clearance"];
  }, [selectedDocName, selectedFromDocuments]);

  const activeImages = selectedDoc?.images || [];
  const previewImage = activeImages[0];

  const documentNames = Object.keys(documentRequirements).filter((docName) => {
    const doc = documentRequirements[docName];

    return (
      doc.category === selectedDoc.category &&
      !doc.hideFromList
    );
  });

  const handleChangeDoc = (e) => {
    setSelectedDocName(e.target.value);
    setFormData({});
    setFile(null);
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

  const validateForm = () => {
    for (const field of selectedDoc.fields || []) {
      const value = formData[field.name];

      if (field.required && (!value || String(value).trim() === "")) {
        return `Please fill in ${field.label}.`;
      }
    }

    if (!file) {
      return `Please upload: ${selectedDoc.uploadLabel}.`;
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const storedUser = JSON.parse(localStorage.getItem("user"));

    if (!storedUser) {
      alert("Please login first.");
      navigate("/signin");
      return;
    }

    const validationError = validateForm();

    if (validationError) {
      setMessage(validationError);
      return;
    }

    try {
      const requestData = new FormData();

      requestData.append("user_id", storedUser.id);
      requestData.append("document_type_id", selectedDoc.id);

      requestData.append(
        "notes",
        JSON.stringify({
          document_name: selectedDocName,
          selected_form: selectedDoc.selectedChoiceId || null,
          parent_document: selectedDoc.parentTitle || null,
          category: selectedDoc.category,
          fields: formData,
        })
      );

      requestData.append("file", file);

      const res = await fetch("http://localhost:5001/api/requests", {
        method: "POST",
        credentials: "include",
        body: requestData,
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Request submitted successfully!");

        setTimeout(() => {
          navigate("/citizen");
        }, 1000);
      } else {
        setMessage(data.message || "Failed to submit request.");
      }
    } catch (error) {
      console.error("REQUEST SUBMIT ERROR:", error);
      setMessage("Cannot connect to server. Please check your backend.");
    }
  };

  return (
    <>
      <Navbar />

      <section className="request-page">
        <div className="request-header">
          <h1>Document Request</h1>
          <p>
            Please complete the required information and upload the necessary
            supporting documents.
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

              <span className="preview-click-label">
                Click image to view
              </span>
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
            <h2>Applicant Information</h2>

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
                  />
                </div>
              ))}

              <div className="form-group">
                <label>
                  {selectedDoc.uploadLabel}
                  <span className="required-star"> *</span>
                </label>

                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </div>

              <button type="submit" className="primary-btn">
                Submit Request
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
                    <img
                      src={img}
                      alt={selectedDocName}
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