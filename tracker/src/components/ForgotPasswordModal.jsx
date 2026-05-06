import React, { useState } from "react";
import "../css/forgotpasswordmodal.css";

export default function ForgotPasswordModal({ isOpen, onClose }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");

    if (!email.trim()) {
      setMessage("Please enter your email address.");
      setMessageType("error");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:5001/api/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
        }),
      });

      const data = await res.json();

      setMessage(data.message || "Request processed. Please check your email.");
      setMessageType(res.ok ? "success" : "error");

      if (res.ok) {
        setTimeout(() => {
          setEmail("");
          onClose();
        }, 2000);
      }
    } catch (err) {
      console.error("FORGOT PASSWORD ERROR:", err);
      setMessage("Cannot connect to the server. Please try again.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="forgot-password-overlay" onClick={onClose}>
      <div
        className="forgot-password-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="forgot-password-header">
          <h2>Reset Password</h2>
          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {message && (
          <p
            className={`form-message ${
              messageType === "success" ? "success-message" : "error-message"
            }`}
          >
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="forgot-email">Email Address</label>
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              disabled={loading}
            />
            <p className="form-hint">
              We'll send you a link to reset your password.
            </p>
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>

          <button
            type="button"
            className="cancel-btn"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
