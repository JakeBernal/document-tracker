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
      setErrorMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/signin");
        return;
      }

      const res = await fetch("http://localhost:5001/api/requests/my", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

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

    if (storedUser.role === "admin" || storedUser.role === "superadmin") {
      navigate("/admin");
      return;
    }

    setUser(storedUser);
    fetchRequests();
  }, [navigate]);

  const parseFormData = (request) => {
    if (!request.form_data) {
      return {};
    }

    if (typeof request.form_data === "object") {
      return request.form_data;
    }

    try {
      return JSON.parse(request.form_data);
    } catch (error) {
      return {};
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Pending":
        return "status pending";
      case "Processing":
        return "status processing";
      case "Needs More Info":
        return "status needs-info";
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

  const getPaymentClass = (paymentStatus) => {
    switch (paymentStatus) {
      case "Paid":
        return "payment paid";
      case "Waived":
        return "payment waived";
      case "Unpaid":
        return "payment unpaid";
      default:
        return "payment";
    }
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

  const getApplicantSummary = (request) => {
    const parsed = parseFormData(request);
    const fields = parsed.fields || parsed.applicant || {};

    if (!fields || typeof fields !== "object") {
      return [];
    }

    return Object.entries(fields).filter(
      ([, value]) =>
        value !== null &&
        value !== undefined &&
        String(value).trim() !== ""
    );
  };

  const getRequestDate = (request) => {
    const rawDate = request.created_at || request.updated_at;

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

  const formatTime = (rawTime) => {
    if (!rawTime) {
      return "—";
    }

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

  // FIX: Single correct getFileUrl — strips absolute Windows paths,
  // always returns http://localhost:5001/uploads/filename.ext
  const getFileUrl = (filePath) => {
    if (!filePath) return null;

    let cleanPath = String(filePath).replaceAll("\\", "/");

    // If it's already a full URL, return as-is
    if (cleanPath.startsWith("http")) return cleanPath;

    // Strip any absolute path prefix, keep only uploads/filename
    const uploadsIndex = cleanPath.indexOf("uploads/");
    if (uploadsIndex !== -1) {
      cleanPath = cleanPath.substring(uploadsIndex); // → "uploads/filename.png"
    }

    return `http://localhost:5001/${cleanPath}`;
    // → "http://localhost:5001/uploads/filename.png" ✓
  };

  // FIX: was missing entirely — caused "getPaymentProofUrl is not defined" error
  const getPaymentProofUrl = (request) => {
    return getFileUrl(
      request.payment_proof_file_path ||
        request.payment_proof_path ||
        null
    );
  };

  const getRequirementFileUrl = (request) => {
    return getFileUrl(
      request.requirement_file_path ||
        request.file_path ||
        request.uploaded_file ||
        null
    );
  };

  const getDisplayAmount = (request) => {
    return request.total_amount || request.amount_due || 0;
  };

  const submitFeedback = async (request) => {
    if (request.status !== "Completed") {
      alert("You can submit feedback only after the request is completed.");
      return;
    }

    const ratingInput = window.prompt(
      "Rate your experience from 1 to 5 stars:",
      "5"
    );

    if (ratingInput === null) {
      return;
    }

    const rating = Number(ratingInput);

    if (!rating || rating < 1 || rating > 5) {
      alert("Rating must be from 1 to 5 only.");
      return;
    }

    const comment = window.prompt(
      "Write your feedback or comment:",
      "Thank you for the service."
    );

    if (comment === null) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `http://localhost:5001/api/requests/${request.id}/feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            rating,
            comment,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to submit feedback.");
        return;
      }

      alert("Feedback submitted successfully.");
      await fetchRequests();
    } catch (error) {
      console.error("SUBMIT FEEDBACK ERROR:", error);
      alert("Cannot connect to server.");
    }
  };

  const totalRequests = requests.length;

  const pendingRequests = requests.filter(
    (request) => request.status === "Pending"
  ).length;

  const approvedRequests = requests.filter(
    (request) =>
      request.status === "Approved" ||
      request.status === "Completed" ||
      request.status === "Ready for Pickup"
  ).length;

  const handleEditRequest = (requestId) => {
    navigate(`/EditRequest/${requestId}`);
  };

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

          <button
            type="button"
            className="request-btn"
            onClick={() => navigate("/calendar")}
          >
            View Pickup Calendar
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
            <p>Approved / Ready</p>
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
                    <th>Pickup Schedule</th>
                    <th>Fee</th>
                    <th>Payment</th>
                    <th>Files / Receipt / Feedback</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {requests.length > 0 ? (
                    requests.map((request) => {
                      const requirementFileUrl = getRequirementFileUrl(request);
                      const paymentProofUrl = getPaymentProofUrl(request);
                      const applicantDetails = getApplicantSummary(request);

                      return (
                        <tr key={request.id}>
                          <td>
                            <strong>{getDocumentName(request)}</strong>
                            {request.receipt_number && (
                              <p className="request-note">
                                Receipt: {request.receipt_number}
                              </p>
                            )}
                            {applicantDetails.length > 0 && (
                              <details className="request-details">
                                <summary>View details</summary>
                                <div className="request-detail-list">
                                  {applicantDetails.map(([key, value]) => (
                                    <p key={key}>
                                      <span>
                                        {key
                                          .replaceAll("_", " ")
                                          .replace(/\b\w/g, (char) =>
                                            char.toUpperCase()
                                          )}
                                        :
                                      </span>{" "}
                                      {String(value)}
                                    </p>
                                  ))}
                                </div>
                              </details>
                            )}
                          </td>

                          <td>{getRequestDate(request)}</td>

                          <td>
                            <span className={getStatusClass(request.status)}>
                              {request.status || "Pending"}
                            </span>
                          </td>

                          <td>
                            {request.pickup_date || request.appointment_date ? (
                              <>
                                <p className="payment-method">
                                  {formatDate(
                                    request.pickup_date ||
                                      request.appointment_date
                                  )}
                                </p>
                                <p className="request-note">
                                  {formatTime(
                                    request.pickup_time ||
                                      request.appointment_time
                                  )}
                                </p>
                              </>
                            ) : (
                              <span className="no-file-text">
                                Not scheduled
                              </span>
                            )}
                          </td>

                          <td>
                            <strong>
                              {formatAmount(getDisplayAmount(request))}
                            </strong>

                            {request.document_fee !== undefined && (
                              <p className="request-note">
                                Doc Fee: {formatAmount(request.document_fee)}
                              </p>
                            )}

                            {request.system_fee !== undefined && (
                              <p className="request-note">
                                System Fee: {formatAmount(request.system_fee)}
                              </p>
                            )}
                          </td>

                          <td>
                            <span
                              className={getPaymentClass(
                                request.payment_status
                              )}
                            >
                              {request.payment_status || "Unpaid"}
                            </span>

                            {request.payment_method &&
                              request.payment_method !== "None" && (
                                <p className="payment-method">
                                  {request.payment_method}
                                </p>
                              )}

                            {request.payment_reference && (
                              <p className="request-note">
                                Ref: {request.payment_reference}
                              </p>
                            )}
                          </td>

                          <td>
                            {requirementFileUrl ? (
                              <a
                                href={requirementFileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="view-file-link"
                              >
                                Requirement
                              </a>
                            ) : (
                              <p className="no-file-text">No requirement</p>
                            )}

                            {paymentProofUrl ? (
                              <a
                                href={paymentProofUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="view-file-link"
                              >
                                Payment Proof
                              </a>
                            ) : (
                              <p className="no-file-text">No payment proof</p>
                            )}

                            <button
                              type="button"
                              className="view-file-link receipt-link-btn"
                              onClick={() =>
                                navigate(`/receipt/${request.id}`)
                              }
                            >
                              View Receipt
                            </button>

                            {request.status === "Completed" && (
                              <button
                                type="button"
                                className="view-file-link receipt-link-btn"
                                onClick={() => submitFeedback(request)}
                              >
                                Rate Service
                              </button>
                            )}
                          </td>

                          <td>
                            {/* Only show Edit button for editable statuses */}
                            {["Pending", "Needs More Info"].includes(
                              request.status
                            ) ? (
                              <button
                                type="button"
                                className="edit-btn"
                                onClick={() => handleEditRequest(request.id)}
                              >
                                Edit Request
                              </button>
                            ) : (
                              <span className="no-file-text">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      {/* FIX: colSpan updated to 8 to match 8 columns */}
                      <td colSpan="8" className="no-requests">
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