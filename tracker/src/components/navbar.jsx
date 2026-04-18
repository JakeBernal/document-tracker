import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "/logo.png"; // adjust path if needed

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
    window.location.reload();
  };

  return (
    <nav className="navbar">
      <div className="logo">
        <img src={logo} alt="logo" className="img" />
        Document Tracker
      </div>
      <ul>
        <li><span className="nav-txt">Home</span></li>
        <li><span className="nav-txt">Services</span></li>
        <li><span className="nav-txt">About</span></li>
      </ul>
      <div className="nav-actions">
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <span style={{ color: "white", fontFamily: "Roboto", fontSize: "13px" }}>
              Hi, {user.full_name}
            </span>
            <button className="primary" onClick={handleLogout} style={{ padding: "8px 18px", fontSize: "13px" }}>
              Sign out
            </button>
          </div>
        ) : (
          <button className="primary" onClick={() => navigate("/signin")} style={{ padding: "8px 18px", fontSize: "13px" }}>
            Sign in
          </button>
        )}
      </div>
    </nav>
  );
}