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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      alert("Please enter your email and password");
      return;
    }

    try {
      const res = await fetch("http://localhost:5001/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("Login success");

        localStorage.setItem("user", JSON.stringify(data.user));

        if (data.user.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/citizen");
        }
      } else {
        alert(data.message || "Login failed");
      }
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      alert("Cannot connect to server");
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

        <div className="form">
          <label>Email</label>
          <input
            type="text"
            name="email"
            value={form.email}
            onChange={handleChange}
          />

          <label>Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
          />

          <div className="forgot">Forgot password?</div>

          <button type="button" className="signin-btn" onClick={handleLogin}>
            Sign in
          </button>

          <div className="divider">or</div>

          <button type="button" className="google-btn">
            <img src={google} alt="" /> Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
}