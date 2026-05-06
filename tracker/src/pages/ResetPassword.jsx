import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import "../css/resetpassword.css";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      setMessage("Invalid or missing reset token.");
      setMessageType("error");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");

    if (!password || !confirmPassword) {
      setMessage("Please enter and confirm your password.");
      setMessageType("error");
      return;
    }

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      setMessageType("error");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      setMessageType("error");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:5001/api/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Password reset successfully! Redirecting to login...");
        setMessageType("success");

        setTimeout(() => {
          navigate("/signin");
        }, 2000);
      } else {
        setMessage(data.message || "Failed to reset password.");
        setMessageType("error");
      }
    } catch (err) {
      console.error("RESET PASSWORD ERROR:", err);
      setMessage("Cannot connect to the server. Please try again.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="reset-password-container">
        <div className="reset-password-card">
          <h1>Reset Your Password</h1>

          {message && (
            <p
              className={`form-message ${
                messageType === "success" ? "success-message" : "error-message"
              }`}
            >
              {message}
            </p>
          )}

          {token ? (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="password">New Password</label>
                <div className="password-field">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="password-field">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="reset-btn"
                disabled={loading}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </button>

              <button
                type="button"
                className="back-btn"
                onClick={() => navigate("/signin")}
                disabled={loading}
              >
                Back to Login
              </button>
            </form>
          ) : (
            <div className="error-container">
              <p>The reset link is invalid or has expired.</p>
              <button
                type="button"
                className="reset-btn"
                onClick={() => navigate("/signin")}
              >
                Return to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
