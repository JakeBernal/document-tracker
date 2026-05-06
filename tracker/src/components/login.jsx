import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./navbar";
import "../css/login.css";
import google from "../assets/google.png";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // 👈 NEW

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!form.email || !form.password) {
      setMessage("Please enter your email and password!");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:5001/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);

        setMessage("Login successful! Redirecting...");

        setTimeout(() => {
          if (data.user.role === "admin") navigate("/admin");
          else navigate("/citizen");
        }, 500);
      } else {
        setMessage(data.message || "Incorrect email or password!");
      }
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      setMessage("Cannot connect to the server. Is backend running?");
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
          <p style={{ color: "red", fontSize: "15px" }}>{message}</p>
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
            />

            <label>Password</label>
           <div className="password-wrapper">
             <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Your password"
            />

            <button
             type="button"
             className="eye-btn"
             onClick={() => setShowPassword(!showPassword)}>
             {showPassword ? (
        
               // Eye OFF (hidden)
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                 d="M3 3L21 21"
                 stroke="currentColor"
                 strokeWidth="2"
                 strokeLinecap="round"/>
                <path
                 d="M10.58 10.58A2 2 0 0013.42 13.42"
                 stroke="currentColor"
                 strokeWidth="2"
                 strokeLinecap="round"/>
                <path
                 d="M9.88 5.08A9.77 9.77 0 0112 5c5 0 9 7 9 7a16.18 16.18 0 01-2.2 2.94M6.53 6.53A16.48 16.48 0 003 12s4 7 9 7a9.77 9.77 0 003.47-.67"
                 stroke="currentColor"
                 strokeWidth="2"
                 strokeLinecap="round"/>
               </svg>
           ) : (

              // Eye ON (visible)
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
               <path
                d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"
                stroke="currentColor"
                strokeWidth="2"/>
               <circle
                cx="12"
                cy="12"
                r="3"
                stroke="currentColor"
                strokeWidth="2"/>
              </svg>
            )}
            </button>
            </div>

            <div className="forgot">Forgot password?</div>

            <button
              type="submit"
              className="signin-btn"
              disabled={loading}
            >
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