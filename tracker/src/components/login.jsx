import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./navbar";
import "../css/login.css";
import google from "../assets/google.png";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
          if (data.user.role === "admin") {
            navigate("/admin");
          } else if (data.user.role === "superadmin") {
            navigate("/superadmin");
          } else {
            navigate("/citizen");
          }
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

            <div className="forgot">Forgot password?</div>

            <button type="submit" className="signin-btn" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <div className="divider">or</div>

            <button type="button" className="google-btn">
              <img src={google} alt="Google logo" /> Sign in with Google
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}