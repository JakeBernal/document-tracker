import React from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "./navbar";
import "../css/login.css"; // reuse same styles

export default function Register() {
  const navigate = useNavigate();

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
          <input type="text" />

          <label>Email</label>
          <input type="text" />

          <label>Password</label>
          <input type="password" />

          <label>Confirm Password</label>
          <input type="password" />

          <button className="signin-btn">
            Create Account
          </button>

        </div>

      </div>
    </div>
  );
}

