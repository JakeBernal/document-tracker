import React from "react";
import "../css/footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-steps">
        <h2>How it works</h2>

        <div className="steps-container">
          <div className="step">
            <span className="step-number">1</span>
            <div className="step-text">
              <h4>Submit</h4>
              <p>Complete the request form.</p>
            </div>
          </div>

          <div className="step">
            <span className="step-number">2</span>
            <div className="step-text">
              <h4>Verify</h4>
              <p>Records and attachments are checked.</p>
            </div>
          </div>

          <div className="step">
            <span className="step-number">3</span>
            <div className="step-text">
              <h4>Process</h4>
              <p>Your requested document is prepared.</p>
            </div>
          </div>

          <div className="step">
            <span className="step-number">4</span>
            <div className="step-text">
              <h4>Release</h4>
              <p>Receive your document once approved.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="copyright">© 2026 Document Tracking System</p>
        <p className="subtitle">Barangay Document Request and Tracking Portal</p>
      </div>
    </footer>
  );
}