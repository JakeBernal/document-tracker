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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (form.password !== form.confirm_password) {
      alert("Passwords do not match");
      return;
    }

    const res = await fetch("http://localhost:5000/api/register", {
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
      alert("Account created!");
      navigate("/signin");
    } else {
      alert(data.message || "Error registering");
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

        <div className="form">
          <label>Full Name</label>
          <input name="full_name" onChange={handleChange} />

          <label>Email</label>
          <input name="email" onChange={handleChange} />

          <label>Password</label>
          <input type="password" name="password" onChange={handleChange} />

          <label>Confirm Password</label>
          <input type="password" name="confirm_password" onChange={handleChange} />

          <button className="signin-btn" onClick={handleSubmit}>
            Create Account
          </button>
        </div>

      </div>
    </div>
  );
}