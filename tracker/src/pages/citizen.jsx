import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import "../css/citizen.css";

export default function UserDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUserRaw = localStorage.getItem("user");

    if (!storedUserRaw) {
      navigate("/signin");
      return;
    }

    try {
      const storedUser = JSON.parse(storedUserRaw);
      setUser(storedUser);
      fetchRequests(storedUser.id);
    } catch (error) {
      console.error("Invalid user data:", error);
      localStorage.removeItem("user");
      navigate("/signin");
    }
  }, [navigate]);

  const fetchRequests = async (userId) => {
    try {
      setLoading(true);

      const res = await fetch(
        `http://localhost:5001/api/requests/user/${userId}`
      );

      const data = await res.json();

      if (Array.isArray(data)) {
        setRequests(data);
      } else {
        setRequests([]);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
      setRequests([]);
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
      case "Approved":
        return "status approved";
      case "Rejected":
        return "status rejected";
      default:
        return "status";
    }
  };

  const getDocumentName = (req) => {
    try {
      if (req.document) return req.document;
      if (req.document_name) return req.document_name;

      if (req.notes) {
        const notes =
          typeof req.notes === "string" ? JSON.parse(req.notes) : req.notes;

        return notes.document_name || "Document Request";
      }

      return "Document Request";
    } catch {
      return "Document Request";
    }
  };

  const getRequestDate = (req) => {
    const rawDate = req.created_at || req.date || req.updated_at;

    if (!rawDate) return "—";

    const date = new Date(rawDate);

    if (Number.isNaN(date.getTime())) {
      return rawDate;
    }

    return date.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const totalRequests = requests.length;

  const pendingRequests = requests.filter(
    (req) => req.status === "Pending"
  ).length;

  const approvedRequests = requests.filter(
    (req) =>
      req.status === "Approved" ||
      req.status === "Completed" ||
      req.status === "Ready for Pickup"
  ).length;

  return (
    <>
      <Navbar />

      <div className="dashboard">
        <div className="header">
          <h2>Welcome, {user?.full_name || "User"}</h2>
          <p>Citizen Document Portal</p>
        </div>

        <div className="actions">
          <button
            className="request-btn"
            onClick={() => navigate("/documents")}
          >
            + Request Document
          </button>
        </div>

        <div className="status-cards">
          <div className="card">
            <h3>{totalRequests}</h3>
            <p>Total Requests</p>
          </div>

          <div className="card">
            <h3>{pendingRequests}</h3>
            <p>Pending</p>
          </div>

          <div className="card">
            <h3>{approvedRequests}</h3>
            <p>Approved</p>
          </div>
        </div>

        <div className="table-container">
          <div className="table-title-row">
            <div>
              <h3>Your Document Requests</h3>
              <p>View and track your submitted requests.</p>
            </div>

            <button
              className="refresh-btn"
              onClick={() => fetchRequests(user?.id)}
              disabled={loading || !user?.id}
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="loading-text">Loading requests...</p>
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
                    <tr key={req.id || req.request_id}>
                      <td>{getDocumentName(req)}</td>
                      <td>{getRequestDate(req)}</td>
                      <td>
                        <span className={getStatusClass(req.status)}>
                          {req.status || "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="no-requests">
                      No requests found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}