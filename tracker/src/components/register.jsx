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
    confirm_password: ""
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    if (!form.full_name || !form.email || !form.password || !form.confirm_password) {
      setMessage("Please fill in all fields");
      return;
    }

    if (form.password !== form.confirm_password) {
      setMessage("Passwords do not match");
      return;
    }

    try {
      const res = await fetch("http://localhost:5001/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          full_name: form.full_name,
          email: form.email,
          password: form.password
        })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage("Account created successfully!");

        setTimeout(() => {
          navigate("/signin");
        }, 800);
      } else {
        setMessage(data.message || "Error registering");
      }
    } catch (err) {
      console.error("FETCH ERROR:", err);
      setMessage("Cannot connect to server");
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

        {/* MESSAGE DISPLAY */}
        <p style={{ color: "red", fontSize: "15px" }}>
          {message}
        </p>
      <form onSubmit={handleSubmit}>
        <div className="form">
          <label>Full Name</label>
          <input name="full_name" value={form.full_name} onChange={handleChange}/>

          <label>Email</label>
          <input name="email" value={form.email} onChange={handleChange}/>

          <label>Password</label>
          <input type="password" name="password" value={form.password} onChange={handleChange}/>

          <label>Confirm Password</label>
          <input type="password" name="confirm_password" value={form.confirm_password} onChange={handleChange}/>

          <button type="submit" className="signin-btn" onClick={handleSubmit}>Create Account</button>
        </div>
      </form>
      </div>
    </div>
  );
}