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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault(); // IMPORTANT: stops page refresh

    if (!form.email || !form.password) {
      setMessage("Please enter your email and password!");
      return;
    }

    try {
      const res = await fetch("http://localhost:5001/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Login success!");

        localStorage.setItem("user", JSON.stringify(data.user));

        // small delay so user can see message
        setTimeout(() => {
          if (data.user.role === "admin") {
            navigate("/admin");
          } else {
            navigate("/citizen");
          }
        }, 500);
      } else {
        setMessage("Incorrect email or password!");
      }
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      setMessage("Cannot connect to the server");
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

        <p style={{ color: "red", fontSize: "15px" }}>{message}</p>

        {/* FORM HANDLES ENTER KEY + SUBMIT */}
        <form onSubmit={handleLogin}>
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

            {/* LOGIN BUTTON (SUBMITS FORM) */}
            <button type="submit" className="signin-btn">
              Sign in
            </button>

            <div className="divider">or</div>

            {/* GOOGLE BUTTON (DOES NOT SUBMIT FORM) */}
            <button type="button" className="google-btn">
              <img src={google} alt="" /> Sign in with Google
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}