import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import "../css/admin.css";

export default function Admin() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const getStoredUser = () => {
    const storedUserRaw = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!storedUserRaw || !token) {
      return null;
    }

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
      setMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/signin");
        return;
      }

      const res = await fetch("http://localhost:5001/api/admin/requests", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      console.log("ADMIN REQUESTS RESPONSE:", data);

      if (!res.ok) {
        setRequests([]);
        setMessage(data.message || "Failed to fetch admin requests.");
        return;
      }

      setRequests(data.requests || []);
    } catch (error) {
      console.error("FETCH ADMIN REQUESTS ERROR:", error);
      setRequests([]);
      setMessage("Cannot connect to server. Please check your backend.");
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

    if (storedUser.role !== "admin") {
      navigate("/citizen");
      return;
    }

    setUser(storedUser);
    fetchRequests();
  }, [navigate]);

  const updateStatus = async (requestId, newStatus) => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `http://localhost:5001/api/admin/requests/${requestId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to update status.");
        return;
      }

      await fetchRequests();
    } catch (error) {
      console.error("UPDATE STATUS ERROR:", error);
      alert("Cannot connect to server.");
    }
  };

  const updatePayment = async (request) => {
    try {
      const token = localStorage.getItem("token");

      const method = window.prompt(
        "Payment method: Cash, GCash, Bank Transfer, Other",
        request.payment_method && request.payment_method !== "None"
          ? request.payment_method
          : "Cash"
      );

      if (!method) {
        return;
      }

      const allowedMethods = ["Cash", "GCash", "Bank Transfer", "Other"];

      if (!allowedMethods.includes(method)) {
        alert("Invalid payment method.");
        return;
      }

      const reference = window.prompt(
        "Payment reference / OR number / GCash ref no. Optional:",
        request.payment_reference || ""
      );

      const amountInput = window.prompt(
        "Amount paid:",
        Number(request.amount_due || 0).toFixed(2)
      );

      if (amountInput === null) {
        return;
      }

      const amountDue = Number(amountInput);

      if (Number.isNaN(amountDue)) {
        alert("Amount must be a valid number.");
        return;
      }

      const res = await fetch(
        `http://localhost:5001/api/admin/requests/${request.id}/payment`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            payment_status: "Paid",
            payment_method: method,
            payment_reference: reference || null,
            amount_due: amountDue,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to update payment.");
        return;
      }

      await fetchRequests();
    } catch (error) {
      console.error("UPDATE PAYMENT ERROR:", error);
      alert("Cannot connect to server.");
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Pending":
        return "admin-status pending";
      case "Processing":
        return "admin-status processing";
      case "Needs More Info":
        return "admin-status needs-info";
      case "Approved":
        return "admin-status approved";
      case "Ready for Pickup":
        return "admin-status ready";
      case "Completed":
        return "admin-status completed";
      case "Rejected":
        return "admin-status rejected";
      default:
        return "admin-status";
    }
  };

  const getPaymentClass = (paymentStatus) => {
    switch (paymentStatus) {
      case "Paid":
        return "admin-payment paid";
      case "Waived":
        return "admin-payment waived";
      case "Unpaid":
        return "admin-payment unpaid";
      default:
        return "admin-payment";
    }
  };

  const formatDate = (rawDate) => {
    if (!rawDate) {
      return "—";
    }

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

  const formatAmount = (amount) => {
    return Number(amount || 0).toLocaleString("en-PH", {
      style: "currency",
      currency: "PHP",
    });
  };

  const getFileUrl = (filePath) => {
    if (!filePath) {
      return null;
    }

    const cleanPath = String(filePath).replaceAll("\\", "/");

    if (cleanPath.startsWith("http")) {
      return cleanPath;
    }

    return `http://localhost:5001/${cleanPath}`;
  };

  const getApplicantDetails = (request) => {
    const applicant = request.form_data?.applicant;

    if (!applicant || typeof applicant !== "object") {
      return [];
    }

    return Object.entries(applicant).filter(
      ([, value]) => value !== null && value !== undefined && String(value).trim() !== ""
    );
  };

  const totalRequests = requests.length;

  const pendingRequests = requests.filter(
    (request) => request.status === "Pending"
  ).length;

  const processingRequests = requests.filter(
    (request) => request.status === "Processing"
  ).length;

  const completedRequests = requests.filter(
    (request) => request.status === "Completed"
  ).length;

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
            <h2>{totalRequests}</h2>
            <p>Total Requests</p>
          </div>

          <div className="admin-card">
            <h2>{pendingRequests}</h2>
            <p>Pending</p>
          </div>

          <div className="admin-card">
            <h2>{processingRequests}</h2>
            <p>Processing</p>
          </div>

          <div className="admin-card">
            <h2>{completedRequests}</h2>
            <p>Completed</p>
          </div>
        </div>

        <div className="admin-table-container">
          <div className="admin-table-header">
            <div>
              <h2>Document Requests</h2>
              <p>View, verify, and update citizen document requests.</p>
            </div>

            <button type="button" onClick={fetchRequests} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {message && <p className="admin-message">{message}</p>}

          {loading ? (
            <p className="admin-loading">Loading requests...</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Citizen</th>
                  <th>Document</th>
                  <th>Date Submitted</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>File</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {requests.length > 0 ? (
                  requests.map((request) => {
                    const fileUrl = getFileUrl(request.file_path);
                    const applicantDetails = getApplicantDetails(request);

                    return (
                      <tr key={request.id}>
                        <td>
                          <strong>{request.citizen_name || "Unknown"}</strong>
                          <p className="admin-small-text">{request.email}</p>
                        </td>

                        <td>
                          <strong>{request.document_name}</strong>

                          {applicantDetails.length > 0 && (
                            <details className="admin-details">
                              <summary>View filled details</summary>

                              <div className="admin-detail-list">
                                {applicantDetails.map(([key, value]) => (
                                  <p key={key}>
                                    <span>{key.replaceAll("_", " ")}:</span>{" "}
                                    {String(value)}
                                  </p>
                                ))}
                              </div>
                            </details>
                          )}
                        </td>

                        <td>{formatDate(request.created_at)}</td>

                        <td>
                          <span className={getStatusClass(request.status)}>
                            {request.status || "Pending"}
                          </span>
                        </td>

                        <td>
                          <span className={getPaymentClass(request.payment_status)}>
                            {request.payment_status || "Unpaid"}
                          </span>

                          <p className="admin-small-text">
                            {formatAmount(request.amount_due)}
                          </p>

                          {request.payment_method &&
                            request.payment_method !== "None" && (
                              <p className="admin-small-text">
                                {request.payment_method}
                              </p>
                            )}

                          {request.payment_reference && (
                            <p className="admin-small-text">
                              Ref: {request.payment_reference}
                            </p>
                          )}
                        </td>

                        <td>
                          {fileUrl ? (
                            <a
                              href={fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="admin-file-link"
                            >
                              View File
                            </a>
                          ) : (
                            <span className="admin-muted">No file</span>
                          )}
                        </td>

                        <td>
                          <div className="admin-actions">
                            <select
                              value={request.status || "Pending"}
                              onChange={(e) =>
                                updateStatus(request.id, e.target.value)
                              }
                            >
                              <option value="Pending">Pending</option>
                              <option value="Processing">Processing</option>
                              <option value="Needs More Info">
                                Needs More Info
                              </option>
                              <option value="Approved">Approved</option>
                              <option value="Ready for Pickup">
                                Ready for Pickup
                              </option>
                              <option value="Completed">Completed</option>
                              <option value="Rejected">Rejected</option>
                            </select>

                            {request.payment_status !== "Paid" &&
                              request.payment_status !== "Waived" && (
                                <button
                                  type="button"
                                  className="admin-pay-btn"
                                  onClick={() => updatePayment(request)}
                                >
                                  Mark Paid
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="admin-empty">
                      No requests loaded yet.
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