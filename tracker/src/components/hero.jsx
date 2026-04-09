import React from 'react'
import { useNavigate } from 'react-router-dom'
export default function hero() {

  const navigate = useNavigate();
  return (
    <section className="hero">
      <h1>Document Tracking System</h1>
      <p>
        Request and track your barangay documents easily online.
        Fast, transparent, and accessible for all residents.
      </p>
      <div className="hero-buttons">
        <button onClick={() => navigate("/signin")} className="primary" >Track Document</button>
        <button onClick={() => navigate("/signin")} className="secondary">Request Document</button>
      </div>
    </section>
  )
}
