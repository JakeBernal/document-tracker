import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import "../css/admin.css";

export default function Admin() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [pickupInputs, setPickupInputs] = useState({});
  const [releasedFiles, setReleasedFiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const getStoredUser = () => {
    const storedUserRaw = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!storedUserRaw || !token) return null;

    try {
      return JSON.parse(storedUserRaw);
    } catch {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      return null;
    }
  };

  const isAdminUser = (storedUser) => {
    return storedUser?.role === "admin" || storedUser?.role === "superadmin";
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/signin", { replace: true });
        return;
      }

      const res = await fetch("http://localhost:5001/api/admin/requests", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

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
      navigate("/signin", { replace: true });
      return;
    }

    if (!isAdminUser(storedUser)) {
      navigate("/citizen", { replace: true });
      return;
    }

    setUser(storedUser);
    fetchRequests();
  }, [navigate]);

  const parseFormData = (request) => {
    if (!request.form_data) return {};
    if (typeof request.form_data === "object") return request.form_data;

    try {
      return JSON.parse(request.form_data);
    } catch {
      return {};
    }
  };

  const getApplicantDetails = (request) => {
    const parsed = parseFormData(request);
    const fields = parsed.fields || parsed.applicant || {};

    if (!fields || typeof fields !== "object") return [];

    return Object.entries(fields).filter(
      ([, value]) => value !== null && value !== undefined && String(value).trim() !== ""
    );
  };

  const getDocumentName = (request) => {
    const parsed = parseFormData(request);

    return (
      request.document_name ||
      parsed.document_name ||
      parsed.parent_document ||
      "Document Request"
    );
  };

  const getFileUrl = (filePath) => {
    if (!filePath) return null;

    let cleanPath = String(filePath).replaceAll("\\", "/");

    if (cleanPath.startsWith("http")) return cleanPath;

    const uploadsIndex = cleanPath.indexOf("uploads/");

    if (uploadsIndex !== -1) {
      cleanPath = cleanPath.substring(uploadsIndex);
    }

    return `http://localhost:5001/${cleanPath}`;
  };

  const formatDate = (rawDate) => {
    if (!rawDate) return "—";

    const date = new Date(rawDate);

    if (Number.isNaN(date.getTime())) return rawDate;

    return date.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (rawTime) => {
    if (!rawTime) return "—";

    const [hour, minute] = String(rawTime).split(":");
    const date = new Date();
    date.setHours(Number(hour || 0));
    date.setMinutes(Number(minute || 0));

    return date.toLocaleTimeString("en-PH", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatAmount = (amount) => {
    return Number(amount || 0).toLocaleString("en-PH", {
      style: "currency",
      currency: "PHP",
    });
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
          body: JSON.stringify({ status: newStatus }),
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

  const updatePayment = async (request, paymentStatus = "Paid") => {
    try {
      const token = localStorage.getItem("token");

      const defaultMethod =
        request.payment_method && request.payment_method !== "None"
          ? request.payment_method
          : "Cash";

      const method = window.prompt(
        "Payment method: Cash, GCash, PayMaya, Bank Transfer, Other",
        defaultMethod
      );

      if (!method) return;

      const allowedMethods = ["Cash", "GCash", "PayMaya", "Bank Transfer", "Other"];

      if (!allowedMethods.includes(method)) {
        alert("Invalid payment method.");
        return;
      }

      const reference = window.prompt(
        "Payment reference / OR number / GCash / PayMaya ref no. Optional:",
        request.payment_reference || ""
      );

      const amountInput = window.prompt(
        "Amount paid:",
        Number(request.total_amount || request.amount_due || 0).toFixed(2)
      );

      if (amountInput === null) return;

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
            payment_status: paymentStatus,
            payment_method: method,
            payment_reference: reference || null,
            amount_due: amountDue,
            document_fee: request.document_fee || 0,
            system_fee: request.system_fee || 0,
            discount_amount: request.discount_amount || 0,
            total_amount: amountDue,
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

  const updatePickupInput = (requestId, field, value) => {
    setPickupInputs((prev) => ({
      ...prev,
      [requestId]: {
        ...prev[requestId],
        [field]: value,
      },
    }));
  };

  const setPickupSchedule = async (requestId) => {
    const pickupDate = pickupInputs[requestId]?.pickup_date;
    const pickupTime = pickupInputs[requestId]?.pickup_time;

    if (!pickupDate || !pickupTime) {
      alert("Please select pickup date and pickup time.");
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `http://localhost:5001/api/admin/requests/${requestId}/pickup`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            pickup_date: pickupDate,
            pickup_time: pickupTime,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to set pickup schedule.");
        return;
      }

      alert(data.message || "Pickup schedule saved.");
      await fetchRequests();
    } catch (error) {
      console.error("SET PICKUP SCHEDULE ERROR:", error);
      alert("Cannot connect to server.");
    }
  };

  const uploadReleasedDocument = async (requestId) => {
    const selectedFile = releasedFiles[requestId];

    if (!selectedFile) {
      alert("Please choose a document file to upload.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch(
        `http://localhost:5001/api/admin/requests/${requestId}/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to upload released document.");
        return;
      }

      alert("Released document uploaded successfully.");
      setReleasedFiles((prev) => ({ ...prev, [requestId]: null }));
      await fetchRequests();
    } catch (error) {
      console.error("UPLOAD RELEASED DOCUMENT ERROR:", error);
      alert("Cannot connect to server.");
    }
  };

  const summary = useMemo(() => {
    const totalRequests = requests.length;
    const pendingRequests = requests.filter((item) => item.status === "Pending").length;
    const processingRequests = requests.filter((item) => item.status === "Processing").length;
    const completedRequests = requests.filter((item) => item.status === "Completed").length;
    const paidRequests = requests.filter((item) => item.payment_status === "Paid").length;
    const totalRevenue = requests.reduce((sum, item) => {
      if (item.payment_status !== "Paid") return sum;
      return sum + Number(item.total_amount || item.amount_due || 0);
    }, 0);

    return {
      totalRequests,
      pendingRequests,
      processingRequests,
      completedRequests,
      paidRequests,
      totalRevenue,
    };
  }, [requests]);

  return (
    <>
      <Navbar />

      <div className="admin-page">
        <div className="admin-header">
          <h1>{user?.role === "superadmin" ? "Superadmin Dashboard" : "Admin Dashboard"}</h1>
          <p>
            Welcome, {user?.full_name || "Admin"}{" "}
            <span className="admin-small-text">({user?.role})</span>
          </p>
        </div>

        <div className="admin-cards">
          <div className="admin-card">
            <h2>{summary.totalRequests}</h2>
            <p>Total Requests</p>
          </div>

          <div className="admin-card">
            <h2>{summary.pendingRequests}</h2>
            <p>Pending</p>
          </div>

          <div className="admin-card">
            <h2>{summary.processingRequests}</h2>
            <p>Processing</p>
          </div>

          <div className="admin-card">
            <h2>{summary.completedRequests}</h2>
            <p>Completed</p>
          </div>
        </div>

        {user?.role === "superadmin" && (
          <div className="admin-table-container" style={{ marginBottom: "24px" }}>
            <div className="admin-table-header">
              <div>
                <h2>Superadmin Controls</h2>
                <p>Higher-level monitoring for reports, feedback, revenue, and system management.</p>
              </div>
            </div>

            <div className="admin-cards" style={{ marginBottom: 0 }}>
              <div className="admin-card">
                <h2>{summary.paidRequests}</h2>
                <p>Paid Transactions</p>
              </div>

              <div className="admin-card">
                <h2>{formatAmount(summary.totalRevenue)}</h2>
                <p>Total Collection</p>
              </div>

              <div className="admin-card" onClick={() => navigate("/reports")} style={{ cursor: "pointer" }}>
                <h2>📊</h2>
                <p>Open Reports</p>
              </div>

              <div className="admin-card" onClick={() => navigate("/feedback")} style={{ cursor: "pointer" }}>
                <h2>⭐</h2>
                <p>Open Feedback</p>
              </div>
            </div>
          </div>
        )}

        <div className="admin-table-container">
          <div className="admin-table-header">
            <div>
              <h2>Document Requests</h2>
              <p>View, verify, update, upload, and schedule citizen document requests.</p>
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
                  <th>Files</th>
                  <th>Pickup Schedule</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {requests.length > 0 ? (
                  requests.map((request) => {
                    const requirementFileUrl = getFileUrl(
                      request.requirement_file_path || request.file_path
                    );
                    const paymentProofUrl = getFileUrl(
                      request.payment_proof_file_path || request.payment_proof_path
                    );
                    const releasedDocumentUrl = getFileUrl(
                      request.released_document_file_path
                    );
                    const applicantDetails = getApplicantDetails(request);
                    const documentName = getDocumentName(request);

                    return (
                      <tr key={request.id}>
                        <td>
                          <strong>{request.citizen_name || "Unknown"}</strong>
                          <p className="admin-small-text">{request.email}</p>
                        </td>

                        <td>
                          <strong>{documentName}</strong>

                          {applicantDetails.length > 0 && (
                            <details className="admin-details">
                              <summary>View filled details</summary>
                              <div className="admin-detail-list">
                                {applicantDetails.map(([key, value]) => (
                                  <p key={key}>
                                    <span>{key.replaceAll("_", " ")}:</span> {String(value)}
                                  </p>
                                ))}
                              </div>
                            </details>
                          )}

                          {request.receipt_number && (
                            <p className="admin-small-text">Receipt: {request.receipt_number}</p>
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
                            Total: {formatAmount(request.total_amount || request.amount_due)}
                          </p>

                          {request.payment_method && request.payment_method !== "None" && (
                            <p className="admin-small-text">{request.payment_method}</p>
                          )}

                          {request.payment_reference && (
                            <p className="admin-small-text">Ref: {request.payment_reference}</p>
                          )}
                        </td>

                        <td>
                          {requirementFileUrl ? (
                            <a href={requirementFileUrl} target="_blank" rel="noreferrer" className="admin-file-link">
                              Requirement
                            </a>
                          ) : (
                            <p className="admin-muted">No requirement</p>
                          )}

                          {paymentProofUrl ? (
                            <a href={paymentProofUrl} target="_blank" rel="noreferrer" className="admin-file-link">
                              Payment Proof
                            </a>
                          ) : (
                            <p className="admin-muted">No payment proof</p>
                          )}

                          {releasedDocumentUrl ? (
                            <a href={releasedDocumentUrl} target="_blank" rel="noreferrer" className="admin-file-link">
                              Released Document
                            </a>
                          ) : (
                            <p className="admin-muted">No released document</p>
                          )}

                          <div className="admin-actions" style={{ marginTop: "8px" }}>
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={(e) =>
                                setReleasedFiles((prev) => ({
                                  ...prev,
                                  [request.id]: e.target.files[0] || null,
                                }))
                              }
                            />
                            <button
                              type="button"
                              className="admin-pay-btn"
                              onClick={() => uploadReleasedDocument(request.id)}
                            >
                              Upload Release
                            </button>
                          </div>
                        </td>

                        <td>
                          {request.pickup_date || request.appointment_date ? (
                            <div>
                              <p className="admin-small-text">
                                Date: {formatDate(request.pickup_date || request.appointment_date)}
                              </p>
                              <p className="admin-small-text">
                                Time: {formatTime(request.pickup_time || request.appointment_time)}
                              </p>
                            </div>
                          ) : (
                            <p className="admin-muted">Not scheduled</p>
                          )}

                          <div className="admin-actions">
                            <input
                              type="date"
                              value={pickupInputs[request.id]?.pickup_date || ""}
                              onChange={(e) => updatePickupInput(request.id, "pickup_date", e.target.value)}
                            />

                            <input
                              type="time"
                              value={pickupInputs[request.id]?.pickup_time || ""}
                              onChange={(e) => updatePickupInput(request.id, "pickup_time", e.target.value)}
                            />

                            <button type="button" className="admin-pay-btn" onClick={() => setPickupSchedule(request.id)}>
                              Set Pickup
                            </button>
                          </div>
                        </td>

                        <td>
                          <div className="admin-actions">
                            <select
                              value={request.status || "Pending"}
                              onChange={(e) => updateStatus(request.id, e.target.value)}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Processing">Processing</option>
                              <option value="Needs More Info">Needs More Info</option>
                              <option value="Approved">Approved</option>
                              <option value="Ready for Pickup">Ready for Pickup</option>
                              <option value="Completed">Completed</option>
                              <option value="Rejected">Rejected</option>
                            </select>

                            {request.payment_status !== "Paid" && request.payment_status !== "Waived" && (
                              <button type="button" className="admin-pay-btn" onClick={() => updatePayment(request, "Paid")}>
                                Mark Paid
                              </button>
                            )}

                            {request.payment_status !== "Waived" && (
                              <button type="button" className="admin-pay-btn" onClick={() => updatePayment(request, "Waived")}>
                                Waive Payment
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="admin-empty">
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
