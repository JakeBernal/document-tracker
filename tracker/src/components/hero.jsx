import React from "react";
import { useNavigate } from "react-router-dom";
import "../css/hero.css";

export default function Hero() {
  const navigate = useNavigate();

  const getUser = () => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser);
    } catch (error) {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      return null;
    }
  };

  const handleTrackDocument = () => {
    const user = getUser();

    if (!user) {
      navigate("/signin");
      return;
    }

    if (user.role === "admin") {
      navigate("/admin");
    } else {
      navigate("/citizen");
    }
  };

  const handleRequestDocument = () => {
    const user = getUser();

    if (!user) {
      navigate("/signin");
      return;
    }

    if (user.role === "admin") {
      navigate("/admin");
    } else {
      navigate("/documents");
    }
  };

  return (
    <section className="hero">
      <h1>Document Tracking System</h1>

      <p>
        Request and track your barangay documents easily online.
        Fast, transparent, and accessible for all residents.
      </p>

      <div className="hero-buttons">
        <button onClick={handleTrackDocument} className="primary">
          Track Document
        </button>

        <button onClick={handleRequestDocument} className="secondary">
          Request Document
        </button>
      </div>
    </section>
  );
}