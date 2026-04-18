import React from "react";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import "../css/requestform.css";

export default function RequestForm() {
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

            <div className="document-preview">
              <p>Preview of the selected document / requirements</p>
            </div>

            <div className="document-info">
              <p><strong>Document Name:</strong> Barangay Clearance</p>
              <p><strong>Processing Fee:</strong> ₱50.00</p>
              <p><strong>Processing Time:</strong> 1–2 working days</p>
              <p><strong>Required Attachment:</strong> Valid ID / Birth Certificate</p>
            </div>

            <button className="secondary-btn">View Full Document Info</button>
          </div>

          <div className="request-right">
            <h2>Applicant Information</h2>

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
                <label>Upload Valid ID / Birth Certificate</label>
                <input type="file" />
              </div>

              <button type="submit" className="primary-btn">
                Submit Request
              </button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}