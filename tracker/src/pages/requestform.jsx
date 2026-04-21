import React, { useState } from "react";
import "../css/requestform.css";

export default function RequestForm() {
  const [docType, setDocType] = useState("barangay_clearance");

  const documents = {
    barangay_clearance: {
      name: "Barangay Clearance",
      fee: "₱50.00",
      time: "1–2 working days",
      requirement: "Valid ID / Birth Certificate",
    },
    certificate_residency: {
      name: "Certificate of Residency",
      fee: "₱30.00",
      time: "1 working day",
      requirement: "Valid ID",
    },
    indigency_certificate: {
      name: "Certificate of Indigency",
      fee: "Free",
      time: "1–2 working days",
      requirement: "Valid ID + Barangay Visit",
    },
  };

  const selectedDoc = documents[docType];

  return (
    <section className="request-page">
      <div className="request-header">
        <h1>Document Request</h1>
        <p>
          Please complete the required information and upload the necessary supporting documents.
        </p>
      </div>

      <div className="request-container">
        {/* LEFT SIDE */}
        <div className="request-left">
          <h2>Document Information</h2>

          {/* Document Selector */}
          <div className="form-group">
            <label>Document Type</label>
           <h1>{selectedDoc.name}</h1>
          </div>

          <div className="document-preview">
            <p>Preview of requirements for {selectedDoc.name}</p>
          </div>

          <div className="document-info">
            <p><strong>Document Name:</strong> {selectedDoc.name}</p>
            <p><strong>Processing Fee:</strong> {selectedDoc.fee}</p>
            <p><strong>Processing Time:</strong> {selectedDoc.time}</p>
            <p><strong>Required Attachment:</strong> {selectedDoc.requirement}</p>
          </div>

          <button className="secondary-btn">
            View Full Document Info
          </button>
        </div>

        {/* RIGHT SIDE */}
        <div className="request-right">
          <h2>Applicant Information</h2>

            <div className="form-group">
            <label>Select Document Type</label>
            <select value={docType} onChange={(e) => setDocType(e.target.value)}>
              <option value="barangay_clearance">Barangay Clearance</option>
              <option value="certificate_residency">Certificate of Residency</option>
              <option value="indigency_certificate">Certificate of Indigency</option>
            </select>
            </div>
          <form className="request-form">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" placeholder="Enter your full name" />
            </div>

            <div className="form-group">
              <label>Date of Birth</label>
              <input type="date" />
            </div>

            <div className="form-group">
              <label>Complete Address</label>
              <input type="text" placeholder="Enter your complete address" />
            </div>

            <div className="form-group">
              <label>Upload Valid ID / Supporting Document</label>
              <input type="file" />
            </div>

            <button type="submit" className="primary-btn">
              Submit Request
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}