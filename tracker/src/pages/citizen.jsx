import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/dashboard.css";

export default function UserDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));

    if (!storedUser) {
      navigate("/signin");
      return;
    }

    setUser(storedUser);

    fetchRequests(storedUser.id);
  }, []);

  const fetchRequests = async (userId) => {
    try {
      setLoading(true);

      const res = await fetch(
        `http://localhost:5000/api/requests/user/${userId}`
      );

      const data = await res.json();

      setRequests(data);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

 const getStatusClass = (status) => {
  switch (status) {
    case "Pending":
      return "status pending";
    case "Processing":
      return "status processing";
    case "Ready for Pickup":
      return "status ready";
    case "Completed":
      return "status completed";
    default:
      return "status";
  }
};

  return (
    <div className="dashboard">

      {/* HEADER */}
      <div className="header">
        <h2>Welcome, {user?.full_name}</h2>
        <p>Citizen Document Portal</p>
      </div>

      {/* ACTIONS */}
      <div className="actions">
        <button
          className="request-btn"
          onClick={() => navigate("/documents")}
        >
          + Request Document
        </button>
      </div>

      {/* STATUS CARDS (NEW UI FEATURE) */}
      <div className="status-cards">
        <div className="card">
          <h3>{requests.length}</h3>
          <p>Total Requests</p>
        </div>

        <div className="card">
          <h3>
            {requests.filter(r => r.status === "Pending").length}
          </h3>
          <p>Pending</p>
        </div>

        <div className="card">
          <h3>
            {requests.filter(r => r.status === "Completed").length}
          </h3>
          <p>Approved</p>
        </div>
      </div>

      {/* TABLE */}
      <div className="table-container">
        <h3>Your Document Requests</h3>

        {loading ? (
          <p>Loading requests...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Document</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {requests.length > 0 ? (
                requests.map((req) => (
                  <tr key={req.id}>
                    <td>{req.document}</td>
                    <td>{req.date}</td>
                    <td>
                      <span className={getStatusClass(req.status)}>
                        {req.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">No requests found</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}