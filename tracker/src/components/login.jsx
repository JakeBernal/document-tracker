// src/components/Login.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Navbar from "./navbar";
import "../css/login.css"; 
import google from "../assets/google.png"
import Register from "../components/register"

export default function Login() {
 const navigate = useNavigate();
  return (
  <div>
      <Navbar></Navbar>
    <div className="login-container">

  <div className="tabs">
    <span className="active">Login</span>
    <span onClick={() => navigate("/register")}>Register</span>
  </div>

  <div className="form">
    <label>Email</label>
    <input type="text" />

    <label>Password</label>
    <input type="password" />

    <div className="forgot">Forgot password?</div>

    <button className="signin-btn">Sign in</button>

    <div className="divider">or</div>

    <button className="google-btn">
      <img src={google} alt="" /> Sign in with Google
    </button>

  </div>

</div>
  </div> 
  );
}