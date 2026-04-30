import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import "../css/citizen.css";

export default function UserDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const getStoredUser = () => {
    const storedUserRaw = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!storedUserRaw || !token) return null;

    try {
      return JSON.parse(storedUserRaw);
    } catch (error) {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      return null;
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/signin");
        return;
      }

      // No user_id in URL — backend reads it from the JWT token
      const res = await fetch("http://localhost:5001/api/requests/my", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      console.log("MY REQUESTS RESPONSE:", data);

      if (!res.ok) {
        setRequests([]);
        setErrorMessage(data.message || "Failed to fetch requests.");
        return;
      }

      setRequests(data.requests || []);
    } catch (error) {
      console.error("FETCH MY REQUESTS ERROR:", error);
      setRequests([]);
      setErrorMessage("Cannot connect to server. Please check your backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = getStoredUser();

    if (!storedUser) {
      navigate("/signin");
      return;
    }

    if (storedUser.role !== "citizen") {
      navigate("/admin");
      return;
    }

    setUser(storedUser);
    fetchRequests();
  }, [navigate]);

  const getStatusClass = (status) => {
    switch (status) {
      case "Pending":        return "status pending";
      case "Processing":     return "status processing";
      case "Needs More Info":return "status needs-info";
      case "Ready for Pickup": return "status ready";
      case "Completed":
      case "Approved":       return "status approved";
      case "Rejected":       return "status rejected";
      default:               return "status";
    }
  };

  const getPaymentClass = (paymentStatus) => {
    switch (paymentStatus) {
      case "Paid":    return "payment paid";
      case "Waived":  return "payment waived";
      case "Unpaid":  return "payment unpaid";
      default:        return "payment";
    }
  };

  const getDocumentName = (request) => {
    if (request.document_name) return request.document_name;

    const formData = request.form_data;
    if (formData?.document_name)  return formData.document_name;
    if (formData?.parent_document) return formData.parent_document;

    return "Document Request";
  };

  const getRequestDate = (request) => {
    const rawDate = request.created_at || request.updated_at;
    if (!rawDate) return "—";

    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) return rawDate;

    return date.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatAmount = (amount) =>
    Number(amount || 0).toLocaleString("en-PH", {
      style: "currency",
      currency: "PHP",
    });

  const getFileUrl = (filePath) => {
    if (!filePath) return null;
    const cleanPath = String(filePath).replaceAll("\\", "/");
    if (cleanPath.startsWith("http")) return cleanPath;
    return `http://localhost:5001/${cleanPath}`;
  };

  const totalRequests    = requests.length;
  const pendingRequests  = requests.filter((r) => r.status === "Pending").length;
  const approvedRequests = requests.filter(
    (r) => r.status === "Approved" || r.status === "Completed" || r.status === "Ready for Pickup"
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
            type="button"
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
              type="button"
              className="refresh-btn"
              onClick={fetchRequests}
              disabled={loading}
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {errorMessage && (
            <p className="dashboard-error-message">{errorMessage}</p>
          )}

          {loading ? (
            <p className="loading-text">Loading requests...</p>
          ) : (
            <div className="requests-table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Fee</th>
                    <th>Payment</th>
                    <th>File</th>
                  </tr>
                </thead>

                <tbody>
                  {requests.length > 0 ? (
                    requests.map((request) => {
                      const fileUrl = getFileUrl(request.file_path);

                      return (
                        <tr key={request.id}>
                          <td>
                            <strong>{getDocumentName(request)}</strong>
                            {request.notes && (
                              <p className="request-note">{request.notes}</p>
                            )}
                          </td>

                          <td>{getRequestDate(request)}</td>

                          <td>
                            <span className={getStatusClass(request.status)}>
                              {request.status || "Pending"}
                            </span>
                          </td>

                          <td>{formatAmount(request.amount_due)}</td>

                          <td>
                            <span className={getPaymentClass(request.payment_status)}>
                              {request.payment_status || "Unpaid"}
                            </span>

                            {request.payment_method &&
                              request.payment_method !== "None" && (
                                <p className="payment-method">
                                  {request.payment_method}
                                </p>
                              )}
                          </td>

                          <td>
                            {fileUrl ? (
                              <a
                                href={fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="view-file-link"
                              >
                                View File
                              </a>
                            ) : (
                              <span className="no-file-text">No file</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="no-requests">
                        No requests found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}