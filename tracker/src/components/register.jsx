import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./navbar";
import "../css/login.css";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return emailRegex.test(String(email).trim().toLowerCase());
  };

  const isStrongPassword = (password) => {
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/;

    return passwordRegex.test(password);
  };

  const showMessage = (text, type = "error") => {
    setMessage(text);
    setMessageType(type);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setMessage("");
    setMessageType("");
  };

  const validateForm = () => {
    const fullName = form.full_name.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password;
    const confirmPassword = form.confirm_password;

    if (!fullName || !email || !password || !confirmPassword) {
      return "Please fill in all fields.";
    }

    if (fullName.length < 2) {
      return "Full name must be at least 2 characters.";
    }

    if (!isValidEmail(email)) {
      return "Please enter a valid email address. Example: citizen.demo@gmail.com";
    }

    if (!isStrongPassword(password)) {
      return "Password must be at least 8 characters and include uppercase, lowercase, number, and special character. Example: Citizen123.";
    }

    if (password !== confirmPassword) {
      return "Passwords do not match.";
    }

    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      showMessage(validationError, "error");
      return;
    }

    try {
      setIsSubmitting(true);
      showMessage("", "");

      const res = await fetch("http://localhost:5001/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: form.full_name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showMessage(data.message || "Error registering account.", "error");
        return;
      }

      showMessage(
        "Account created successfully! Redirecting to login...",
        "success"
      );

      setForm({
        full_name: "",
        email: "",
        password: "",
        confirm_password: "",
      });

      setTimeout(() => {
        navigate("/signin");
      }, 900);
    } catch (err) {
      console.error("REGISTER FETCH ERROR:", err);
      showMessage(
        "Cannot connect to server. Please check your backend.",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <Navbar />

      <div className="login-container">
        <div className="tabs">
          <span onClick={() => navigate("/signin")}>Login</span>
          <span className="active">Register</span>
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
          <div className="form">
            <label>Full Name</label>
            <input
              type="text"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="Enter your full name"
              autoComplete="name"
            />

            <label>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Example: citizen.demo@gmail.com"
              autoComplete="email"
            />

            <label>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Example: Citizen123."
              autoComplete="new-password"
            />

            <div className="password-guide">
              Password must have at least 8 characters, 1 uppercase letter, 1
              lowercase letter, 1 number, and 1 special character.
            </div>

            <label>Confirm Password</label>
            <input
              type="password"
              name="confirm_password"
              value={form.confirm_password}
              onChange={handleChange}
              placeholder="Re-enter your password"
              autoComplete="new-password"
            />

            <button
              type="submit"
              className="signin-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating Account..." : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}