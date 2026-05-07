import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./navbar";
import "../css/register.css";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    date_of_birth: "",
    password: "",
    confirm_password: "",
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const getLatestAllowedBirthDate = () => {
    const today = new Date();
    const date = new Date(
      today.getFullYear() - 18,
      today.getMonth(),
      today.getDate()
    );
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const getAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;

    const [year, month, day] = dateOfBirth.split("-").map(Number);

    if (!year || !month || !day) return null;

    const today = new Date();
    let age = today.getFullYear() - year;

    const birthdayAlreadyPassed =
      today.getMonth() + 1 > month ||
      (today.getMonth() + 1 === month && today.getDate() >= day);

    if (!birthdayAlreadyPassed) {
      age -= 1;
    }

    return age;
  };

  const isAtLeast18 = (dateOfBirth) => {
    const age = getAge(dateOfBirth);
    return age !== null && age >= 18;
  };

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
    const dateOfBirth = form.date_of_birth;
    const password = form.password;
    const confirmPassword = form.confirm_password;

    if (!fullName || !email || !dateOfBirth || !password || !confirmPassword) {
      return "Please fill in all fields, including date of birth.";
    }

    if (fullName.length < 2) {
      return "Full name must be at least 2 characters.";
    }

    if (!isValidEmail(email)) {
      return "Please enter a valid email address. Example: citizen.demo@gmail.com";
    }

    if (!isAtLeast18(dateOfBirth)) {
      return "Only citizens who are at least 18 years old can create an account.";
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
          date_of_birth: form.date_of_birth,
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
        date_of_birth: "",
        password: "",
        confirm_password: "",
      });

      setShowPassword(false);
      setShowConfirmPassword(false);

      setTimeout(() => {
        navigate("/signin");
      }, 900);
    } catch (err) {
      console.error("REGISTER FETCH ERROR:", err);
      showMessage("Cannot connect to server. Please check your backend.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <Navbar />

      <div className="login-wrapper">
        <div className="login-card">
          <div className="login-image-section">
            <img
              src="/Deadline-bro.png"
              alt="Register Illustration"
              className="login-image"
            />
          </div>

          <div className="login-form-section">
            <div className="tabs">
              <span onClick={() => navigate("/signin")}>Login</span>
              <span className="active">Register</span>
            </div>

            {message && (
              <p
                className={`form-message ${
                  messageType === "success"
                    ? "success-message"
                    : "error-message"
                }`}
              >
                {message}
              </p>
            )}

            <form onSubmit={handleSubmit} className="form">
              <label>Full Name</label>
              <input
                type="text"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Enter your full name"
              />

              <label>Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Example: citizen.demo@gmail.com"
              />

              <label>Date of Birth</label>
              <input
                type="date"
                name="date_of_birth"
                value={form.date_of_birth}
                onChange={handleChange}
                max={getLatestAllowedBirthDate()}
              />

              <div className="password-guide">
                Account registration is limited to citizens who are 18 years old
                and above.
              </div>

              <label>Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Example: Citizen123."
                />

                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <div className="password-guide">
                Password must have at least 8 characters, 1 uppercase letter,
                1 lowercase letter, 1 number, and 1 special character.
              </div>

              <label>Confirm Password</label>
              <div className="password-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirm_password"
                  value={form.confirm_password}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                />

                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>

              <button
                type="submit"
                className="signin-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating Account..." : "Create Account"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
