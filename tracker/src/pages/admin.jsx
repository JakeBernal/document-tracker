import React from "react";
import Navbar from "../components/navbar";
import "../css/admin.css";

export default function Admin() {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  return (
    <>
      <Navbar />

      <div className="admin-page">
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
          <p>Welcome, {user?.full_name || "Admin"}</p>
        </div>

        <div className="admin-cards">
          <div className="admin-card">
            <h2>0</h2>
            <p>Total Requests</p>
          </div>

          <div className="admin-card">
            <h2>0</h2>
            <p>Pending</p>
          </div>

          <div className="admin-card">
            <h2>0</h2>
            <p>Processing</p>
          </div>

          <div className="admin-card">
            <h2>0</h2>
            <p>Completed</p>
          </div>
        </div>

        <div className="admin-table-container">
          <div className="admin-table-header">
            <h2>Document Requests</h2>
            <button>Refresh</button>
          </div>

          <table>
            <thead>
              <tr>
                <th>Citizen</th>
                <th>Document</th>
                <th>Date Submitted</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td colSpan="5" className="admin-empty">
                  No requests loaded yet.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}