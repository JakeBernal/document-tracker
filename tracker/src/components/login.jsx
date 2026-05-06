import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import Navbar from "./navbar";
import ForgotPasswordModal from "./ForgotPasswordModal";
import "../css/login.css";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  const googleClientReady = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

  const redirectByRole = (user) => {
    if (user.role === "admin") {
      navigate("/admin");
    } else if (user.role === "superadmin") {
      navigate("/superadmin");
    } else {
      navigate("/citizen");
    }
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

    setMessage("");
    setMessageType("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    setMessage("");
    setMessageType("");

    if (!form.email.trim() || !form.password) {
      setMessage("Please enter your email and password.");
      setMessageType("error");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:5001/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          password: form.password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);

        setMessage("Login successful! Redirecting...");
        setMessageType("success");

        setTimeout(() => {
          redirectByRole(data.user);
        }, 500);
      } else {
        setMessage(data.message || "Incorrect email or password.");
        setMessageType("error");
      }
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      setMessage("Cannot connect to the server. Please check your backend.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    const credential = credentialResponse?.credential;

    if (!credential) {
      setMessage("Google sign-in failed. No credential received.");
      setMessageType("error");
      return;
    }

    try {
      setGoogleLoading(true);
      setMessage("");
      setMessageType("");

      const res = await fetch("http://localhost:5001/api/google-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ credential }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Google sign-in failed.");
        setMessageType("error");
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);

      setMessage("Google sign-in successful! Redirecting...");
      setMessageType("success");

      setTimeout(() => {
        redirectByRole(data.user);
      }, 500);
    } catch (err) {
      console.error("GOOGLE LOGIN ERROR:", err);
      setMessage("Cannot connect to the server for Google sign-in.");
      setMessageType("error");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setMessage("Google sign-in was cancelled or failed.");
    setMessageType("error");
  };

  const handleForgotPassword = () => {
    setShowForgotPasswordModal(true);
  };

  return (
    <div>
      <Navbar />

      <div className="login-container">
        <div className="tabs">
          <span className="active">Login</span>
          <span onClick={() => navigate("/signup")}>Register</span>
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

        <form onSubmit={handleLogin}>
          <div className="form">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
            />

            <label>Password</label>
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Your password"
                autoComplete="current-password"
              />

              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <button
              type="button"
              className="forgot"
              onClick={handleForgotPassword}
            >
              Forgot password?
            </button>

            <button type="submit" className="signin-btn" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <div className="divider">or</div>

            <div className="google-login-box">
              {googleClientReady ? (
                <>
                  {googleLoading && (
                    <p className="google-loading-text">
                      Connecting to Google...
                    </p>
                  )}

                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    text="signin_with"
                    shape="rectangular"
                    theme="outline"
                    size="large"
                    width="304"
                    useOneTap={false}
                  />
                </>
              ) : (
                <button type="button" className="google-btn" disabled>
                  Google Sign-In is not configured
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      <ForgotPasswordModal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
      />
    </div>
  );
}