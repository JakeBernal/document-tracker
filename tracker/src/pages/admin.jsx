import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import "../css/admin.css";

export default function Admin() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [pickupInputs, setPickupInputs] = useState({});
  const [releaseFiles, setReleaseFiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [activeFilter, setActiveFilter] = useState("All");
  const [activeTab, setActiveTab] = useState("Requests");
  const [searchTerm, setSearchTerm] = useState("");

  const getTodayDateValue = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const todayDateValue = getTodayDateValue();

  const isAdminUser = (storedUser) => {
    return storedUser?.role === "admin" || storedUser?.role === "superadmin";
  };

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

  const isSuperadmin = user?.role === "superadmin";

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

  const updatePayment = async (request, nextPaymentStatus = "Paid") => {
    try {
      const token = localStorage.getItem("token");

      let method = request.payment_method || "Cash";
      let reference = request.payment_reference || "";
      let amountDue = Number(request.total_amount || request.amount_due || 0);

      if (nextPaymentStatus === "Paid") {
        const methodInput = window.prompt(
          "Payment method: Cash, GCash, PayMaya, Bank Transfer, Other",
          method && method !== "None" ? method : "Cash"
        );

        if (!methodInput) {
          return;
        }

        const allowedMethods = [
          "Cash",
          "GCash",
          "PayMaya",
          "Bank Transfer",
          "Other",
        ];

        if (!allowedMethods.includes(methodInput)) {
          alert("Invalid payment method.");
          return;
        }

        method = methodInput;

        const referenceInput = window.prompt(
          "Payment reference / OR number / GCash / PayMaya ref no. Optional:",
          reference
        );

        if (referenceInput === null) {
          return;
        }

        reference = referenceInput || "";

        const amountInput = window.prompt(
          "Amount paid:",
          amountDue.toFixed(2)
        );

        if (amountInput === null) {
          return;
        }

        amountDue = Number(amountInput);

        if (Number.isNaN(amountDue)) {
          alert("Amount must be a valid number.");
          return;
        }
      }

      if (nextPaymentStatus === "Waived") {
        method = "None";
        reference = "Waived";
        amountDue = 0;
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
            payment_status: nextPaymentStatus,
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

    if (pickupDate < todayDateValue) {
      alert("Pickup schedule cannot be set to yesterday or any past date.");
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

  const deleteRequest = async (requestId) => {
    const confirmed = window.confirm(
      "Delete this request? This action is for Superadmin only."
    );

    if (!confirmed) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const res = await fetch(
        `http://localhost:5001/api/superadmin/requests/${requestId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to delete request.");
        return;
      }

      alert(data.message || "Request deleted.");
      await fetchRequests();
    } catch (error) {
      console.error("DELETE REQUEST ERROR:", error);
      alert("Cannot connect to server.");
    }
  };

  const handleReleaseFileChange = (requestId, file) => {
    setReleaseFiles((prev) => ({
      ...prev,
      [requestId]: file || null,
    }));
  };

  const uploadReleasedDocument = async (requestId) => {
    const selectedFile = releaseFiles[requestId];

    if (!selectedFile) {
      alert("Please choose the completed document file first.");
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

      alert(data.message || "Released document uploaded.");
      setReleaseFiles((prev) => ({
        ...prev,
        [requestId]: null,
      }));
      await fetchRequests();
    } catch (error) {
      console.error("UPLOAD RELEASED DOCUMENT ERROR:", error);
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

  const getFileUrl = (filePath) => {
    if (!filePath) {
      return null;
    }

    let cleanPath = String(filePath).replaceAll("\\", "/");

    if (cleanPath.startsWith("http")) {
      return cleanPath;
    }

    const uploadsIndex = cleanPath.indexOf("uploads/");
    if (uploadsIndex !== -1) {
      cleanPath = cleanPath.substring(uploadsIndex);
    }

    return `http://localhost:5001/${cleanPath}`;
  };

  const parseFormData = (request) => {
    if (!request.form_data) {
      return {};
    }

    if (typeof request.form_data === "object") {
      return request.form_data;
    }

    try {
      return JSON.parse(request.form_data);
    } catch {
      return {};
    }
  };

  const getApplicantDetails = (request) => {
    const parsed = parseFormData(request);
    const fields = parsed.fields || parsed.applicant || parsed || {};

    if (!fields || typeof fields !== "object") {
      return [];
    }

    const metaKeys = [
      "document_name",
      "parent_document",
      "selected_form",
      "category",
      "payment_method",
      "payment_method_for_database",
      "payment_reference_number",
      "payment_reference",
      "receipt_number",
      "document_fee",
      "system_fee",
      "discount_amount",
      "total_amount",
      "amount_due",
      "payment_account_name",
      "payment_account_number",
      "uploaded_requirement_file",
      "payment_proof_file",
      "payment_note",
      "created_at",
      "superadmin_updated_at",
      "superadmin_updated_by",
      "raw",
    ];

    return Object.entries(fields).filter(
      ([key, value]) =>
        !metaKeys.includes(key) &&
        value !== null &&
        value !== undefined &&
        String(value).trim() !== ""
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

  const totalRequests = requests.length;

  const pendingRequests = requests.filter(
    (request) => request.status === "Pending"
  ).length;

  const processingRequests = requests.filter(
    (request) => request.status === "Processing"
  ).length;

  const needsMoreInfoRequests = requests.filter(
    (request) => request.status === "Needs More Info"
  ).length;

  const approvedRequests = requests.filter(
    (request) => request.status === "Approved"
  ).length;

  const readyRequests = requests.filter(
    (request) => request.status === "Ready for Pickup"
  ).length;

  const completedRequests = requests.filter(
    (request) => request.status === "Completed"
  ).length;

  const rejectedRequests = requests.filter(
    (request) => request.status === "Rejected"
  ).length;

  const paidTransactions = requests.filter(
    (request) => request.payment_status === "Paid"
  ).length;

  const totalCollection = requests.reduce((total, request) => {
    if (request.payment_status !== "Paid") {
      return total;
    }

    return total + Number(request.total_amount || request.amount_due || 0);
  }, 0);

  const releasedDocuments = requests.filter(
    (request) =>
      request.released_document_file_path ||
      request.released_document_path ||
      request.release_file_path
  ).length;

  const filterOptions = [
    { label: "All", value: "All", count: totalRequests },
    { label: "Pending", value: "Pending", count: pendingRequests },
    { label: "Processing", value: "Processing", count: processingRequests },
    {
      label: "Needs More Info",
      value: "Needs More Info",
      count: needsMoreInfoRequests,
    },
    { label: "Approved", value: "Approved", count: approvedRequests },
    { label: "Ready for Pickup", value: "Ready for Pickup", count: readyRequests },
    { label: "Completed", value: "Completed", count: completedRequests },
    { label: "Rejected", value: "Rejected", count: rejectedRequests },
  ];

  const mainTabs = [
    {
      label: "Requests",
      value: "Requests",
      helper: "Review and update request status",
    },
    {
      label: "Payments",
      value: "Payments",
      helper: "Verify payment and proof",
    },
    {
      label: "Pickup Schedule",
      value: "Pickup Schedule",
      helper: "Set release appointment",
    },
    {
      label: "Released Documents",
      value: "Released Documents",
      helper: "Upload completed documents",
    },
  ];

  const filteredRequests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return requests.filter((request) => {
      const documentName = getDocumentName(request);
      const searchableText = [
        request.citizen_name,
        request.email,
        documentName,
        request.receipt_number,
        request.payment_reference,
        request.status,
        request.payment_status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesStatus =
        activeFilter === "All" || request.status === activeFilter;

      const matchesSearch =
        !normalizedSearch || searchableText.includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [requests, activeFilter, searchTerm]);

  const openStatusFilter = (status) => {
    setActiveTab("Requests");
    setActiveFilter(status);
  };

  const renderRequirementAndProofLinks = (request) => {
    const requirementFileUrl = getFileUrl(
      request.requirement_file_path || request.file_path
    );

    const paymentProofUrl = getFileUrl(
      request.payment_proof_file_path || request.payment_proof_path
    );

    return (
      <>
        {requirementFileUrl ? (
          <a
            href={requirementFileUrl}
            target="_blank"
            rel="noreferrer"
            className="admin-file-link"
          >
            View Requirement
          </a>
        ) : (
          <p className="admin-muted">No requirement</p>
        )}

        {paymentProofUrl ? (
          <a
            href={paymentProofUrl}
            target="_blank"
            rel="noreferrer"
            className="admin-file-link"
          >
            View Payment Proof
          </a>
        ) : (
          <p className="admin-muted">No payment proof</p>
        )}
      </>
    );
  };

  const renderReleasedDocumentLink = (request) => {
    const releasedFileUrl = getFileUrl(
      request.released_document_file_path ||
        request.released_document_path ||
        request.release_file_path
    );

    if (!releasedFileUrl) {
      return <p className="admin-muted">No completed document uploaded</p>;
    }

    return (
      <a
        href={releasedFileUrl}
        target="_blank"
        rel="noreferrer"
        className="admin-file-link"
      >
        View Released Document
      </a>
    );
  };

  const renderDetails = (request) => {
    const applicantDetails = getApplicantDetails(request);

    if (applicantDetails.length === 0) {
      return null;
    }

    return (
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
    );
  };

  const renderMobileCards = () => {
    if (filteredRequests.length === 0) {
      return (
        <div className="admin-mobile-empty">
          No requests found for <strong>{activeFilter}</strong>.
        </div>
      );
    }

    return (
      <div className="admin-mobile-cards">
        {filteredRequests.map((request) => {
          const documentName = getDocumentName(request);

          return (
            <div className="admin-request-card" key={request.id}>
              <div className="admin-request-card-top">
                <div>
                  <h3>{documentName}</h3>
                  <p>{request.citizen_name || "Unknown Citizen"}</p>
                  <small>{request.email || "No email"}</small>
                </div>

                <span className={getStatusClass(request.status)}>
                  {request.status || "Pending"}
                </span>
              </div>

              <div className="admin-card-grid">
                <div>
                  <span>Date Submitted</span>
                  <strong>{formatDate(request.created_at)}</strong>
                </div>

                <div>
                  <span>Payment</span>
                  <strong>{request.payment_status || "Unpaid"}</strong>
                </div>

                <div>
                  <span>Total</span>
                  <strong>
                    {formatAmount(request.total_amount || request.amount_due)}
                  </strong>
                </div>

                <div>
                  <span>Pickup</span>
                  <strong>
                    {request.pickup_date || request.appointment_date
                      ? `${formatDate(
                          request.pickup_date || request.appointment_date
                        )} ${formatTime(
                          request.pickup_time || request.appointment_time
                        )}`
                      : "Not scheduled"}
                  </strong>
                </div>
              </div>

              <div className="admin-mobile-section">
                <h4>Files</h4>
                {renderRequirementAndProofLinks(request)}
                {renderReleasedDocumentLink(request)}
              </div>

              <div className="admin-mobile-section">
                <h4>Actions</h4>

                <div className="admin-actions">
                  {!isSuperadmin && (
                    <>
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

                      {request.payment_status !== "Paid" &&
                        request.payment_status !== "Waived" && (
                          <button
                            type="button"
                            className="admin-pay-btn"
                            onClick={() => updatePayment(request, "Paid")}
                          >
                            Mark Paid
                          </button>
                        )}
                    </>
                  )}

                  {isSuperadmin && (
                    <>
                      <p className="admin-small-text">Request editing is locked for superadmin.</p>
                      <button
                        type="button"
                        className="admin-pay-btn danger"
                        onClick={() => deleteRequest(request.id)}
                      >
                        Delete Request
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderRequestsTable = () => {
    return (
      <table>
        <thead>
          <tr>
            <th>Citizen</th>
            <th>Document</th>
            <th>Date Submitted</th>
            <th>Status</th>
            <th>Payment</th>
            <th>Files</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {filteredRequests.length > 0 ? (
            filteredRequests.map((request) => (
              <tr key={request.id}>
                <td>
                  <strong>{request.citizen_name || "Unknown"}</strong>
                  <p className="admin-small-text">{request.email}</p>
                </td>

                <td>
                  <strong>{getDocumentName(request)}</strong>
                  {renderDetails(request)}

                  {request.receipt_number && (
                    <p className="admin-small-text">
                      Receipt: {request.receipt_number}
                    </p>
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
                </td>

                <td>{renderRequirementAndProofLinks(request)}</td>

                <td>
                  <div className="admin-actions">
                    {!isSuperadmin && (
                      <>
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

                        {request.payment_status !== "Paid" &&
                          request.payment_status !== "Waived" && (
                            <button
                              type="button"
                              className="admin-pay-btn"
                              onClick={() => updatePayment(request, "Paid")}
                            >
                              Mark Paid
                            </button>
                          )}
                      </>
                    )}

                    {isSuperadmin && (
                      <>
                        <p className="admin-small-text">Request editing is locked for superadmin.</p>
                        <button
                          type="button"
                          className="admin-pay-btn danger"
                          onClick={() => deleteRequest(request.id)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="admin-empty">
                No requests found for <strong>{activeFilter}</strong>.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    );
  };

  const renderPaymentsTable = () => {
    return (
      <table>
        <thead>
          <tr>
            <th>Citizen</th>
            <th>Document</th>
            <th>Payment Status</th>
            <th>Amount</th>
            <th>Payment Details</th>
            <th>Payment Proof</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {filteredRequests.length > 0 ? (
            filteredRequests.map((request) => {
              const paymentProofUrl = getFileUrl(
                request.payment_proof_file_path || request.payment_proof_path
              );

              return (
                <tr key={request.id}>
                  <td>
                    <strong>{request.citizen_name || "Unknown"}</strong>
                    <p className="admin-small-text">{request.email}</p>
                  </td>

                  <td>
                    <strong>{getDocumentName(request)}</strong>
                    <p className="admin-small-text">
                      Receipt: {request.receipt_number || "—"}
                    </p>
                  </td>

                  <td>
                    <span className={getPaymentClass(request.payment_status)}>
                      {request.payment_status || "Unpaid"}
                    </span>
                  </td>

                  <td>
                    <p className="admin-small-text">
                      Document Fee: {formatAmount(request.document_fee)}
                    </p>
                    <p className="admin-small-text">
                      System Fee: {formatAmount(request.system_fee)}
                    </p>
                    <p className="admin-small-text">
                      Discount: {formatAmount(request.discount_amount)}
                    </p>
                    <strong>
                      Total: {formatAmount(request.total_amount || request.amount_due)}
                    </strong>
                  </td>

                  <td>
                    <p className="admin-small-text">
                      Method: {request.payment_method || "None"}
                    </p>
                    <p className="admin-small-text">
                      Ref: {request.payment_reference || "—"}
                    </p>
                  </td>

                  <td>
                    {paymentProofUrl ? (
                      <a
                        href={paymentProofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="admin-file-link"
                      >
                        View Payment Proof
                      </a>
                    ) : (
                      <p className="admin-muted">No payment proof</p>
                    )}
                  </td>

                  <td>
                    <div className="admin-actions">
                      {request.payment_status !== "Paid" && (
                        <button
                          type="button"
                          className="admin-pay-btn"
                          onClick={() => updatePayment(request, "Paid")}
                        >
                          Mark Paid
                        </button>
                      )}

                      {request.payment_status !== "Waived" && (
                        <button
                          type="button"
                          className="admin-pay-btn secondary"
                          onClick={() => updatePayment(request, "Waived")}
                        >
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
              <td colSpan="7" className="admin-empty">
                No payment records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    );
  };

  const renderPickupTable = () => {
    return (
      <table>
        <thead>
          <tr>
            <th>Citizen</th>
            <th>Document</th>
            <th>Current Schedule</th>
            <th>Request Status</th>
            <th>Set New Pickup</th>
          </tr>
        </thead>

        <tbody>
          {filteredRequests.length > 0 ? (
            filteredRequests.map((request) => (
              <tr key={request.id}>
                <td>
                  <strong>{request.citizen_name || "Unknown"}</strong>
                  <p className="admin-small-text">{request.email}</p>
                </td>

                <td>
                  <strong>{getDocumentName(request)}</strong>
                  <p className="admin-small-text">
                    Receipt: {request.receipt_number || "—"}
                  </p>
                </td>

                <td>
                  {request.pickup_date || request.appointment_date ? (
                    <>
                      <p className="admin-small-text">
                        Date:{" "}
                        {formatDate(
                          request.pickup_date || request.appointment_date
                        )}
                      </p>
                      <p className="admin-small-text">
                        Time:{" "}
                        {formatTime(
                          request.pickup_time || request.appointment_time
                        )}
                      </p>
                    </>
                  ) : (
                    <p className="admin-muted">Not scheduled</p>
                  )}
                </td>

                <td>
                  <span className={getStatusClass(request.status)}>
                    {request.status || "Pending"}
                  </span>
                </td>

                <td>
                  <div className="admin-actions horizontal">
                    <input
                      type="date"
                      min={todayDateValue}
                      value={pickupInputs[request.id]?.pickup_date || ""}
                      onChange={(e) =>
                        updatePickupInput(
                          request.id,
                          "pickup_date",
                          e.target.value
                        )
                      }
                    />

                    <input
                      type="time"
                      value={pickupInputs[request.id]?.pickup_time || ""}
                      onChange={(e) =>
                        updatePickupInput(
                          request.id,
                          "pickup_time",
                          e.target.value
                        )
                      }
                    />

                    <button
                      type="button"
                      className="admin-pay-btn"
                      onClick={() => setPickupSchedule(request.id)}
                    >
                      Save Pickup
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="admin-empty">
                No pickup records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    );
  };

  const renderReleasedDocumentsTable = () => {
    return (
      <table>
        <thead>
          <tr>
            <th>Citizen</th>
            <th>Document</th>
            <th>Status</th>
            <th>Released Document</th>
            <th>Upload Completed Document</th>
          </tr>
        </thead>

        <tbody>
          {filteredRequests.length > 0 ? (
            filteredRequests.map((request) => (
              <tr key={request.id}>
                <td>
                  <strong>{request.citizen_name || "Unknown"}</strong>
                  <p className="admin-small-text">{request.email}</p>
                </td>

                <td>
                  <strong>{getDocumentName(request)}</strong>
                  <p className="admin-small-text">
                    Receipt: {request.receipt_number || "—"}
                  </p>
                </td>

                <td>
                  <span className={getStatusClass(request.status)}>
                    {request.status || "Pending"}
                  </span>
                </td>

                <td>{renderReleasedDocumentLink(request)}</td>

                <td>
                  <div className="admin-actions release-upload">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) =>
                        handleReleaseFileChange(
                          request.id,
                          e.target.files?.[0] || null
                        )
                      }
                    />

                    <button
                      type="button"
                      className="admin-pay-btn"
                      onClick={() => uploadReleasedDocument(request.id)}
                    >
                      Upload Released Document
                    </button>

                    <p className="admin-small-text">
                      This is the completed document prepared by the office.
                    </p>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="admin-empty">
                No released document records found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    );
  };

  const renderActiveTable = () => {
    if (activeTab === "Payments") {
      return renderPaymentsTable();
    }

    if (activeTab === "Pickup Schedule") {
      return renderPickupTable();
    }

    if (activeTab === "Released Documents") {
      return renderReleasedDocumentsTable();
    }

    return renderRequestsTable();
  };

  return (
    <>
      <Navbar />

      <div className="admin-page">
        <div className="admin-header">
          <h1>
            {isSuperadmin ? "Superadmin Dashboard" : "Admin Dashboard"}
          </h1>
          <p>
            Welcome, {user?.full_name || "Admin"}{" "}
            <span className="admin-small-text">({user?.role})</span>
          </p>

          {isSuperadmin && (
            <p className="admin-small-text">
              Superadmin can manage system data. Citizen-uploaded files remain
              read-only for data integrity.
            </p>
          )}
        </div>

        <div className="admin-cards">
          <button
            type="button"
            className="admin-card clickable"
            onClick={() => openStatusFilter("All")}
          >
            <h2>{totalRequests}</h2>
            <p>Total Requests</p>
          </button>

          <button
            type="button"
            className="admin-card clickable"
            onClick={() => openStatusFilter("Pending")}
          >
            <h2>{pendingRequests}</h2>
            <p>Pending</p>
          </button>

          <button
            type="button"
            className="admin-card clickable"
            onClick={() => openStatusFilter("Processing")}
          >
            <h2>{processingRequests}</h2>
            <p>Processing</p>
          </button>

          <button
            type="button"
            className="admin-card clickable"
            onClick={() => openStatusFilter("Completed")}
          >
            <h2>{completedRequests}</h2>
            <p>Completed</p>
          </button>

          <button
            type="button"
            className="admin-card clickable"
            onClick={() => {
              setActiveTab("Payments");
              setActiveFilter("All");
            }}
          >
            <h2>{paidTransactions}</h2>
            <p>Paid Transactions</p>
          </button>

          <button
            type="button"
            className="admin-card clickable"
            onClick={() => {
              setActiveTab("Payments");
              setActiveFilter("All");
            }}
          >
            <h2>{formatAmount(totalCollection)}</h2>
            <p>Total Collection</p>
          </button>

          <button
            type="button"
            className="admin-card clickable"
            onClick={() => {
              setActiveTab("Pickup Schedule");
              setActiveFilter("Ready for Pickup");
            }}
          >
            <h2>{readyRequests}</h2>
            <p>Ready for Pickup</p>
          </button>

          <button
            type="button"
            className="admin-card clickable"
            onClick={() => {
              setActiveTab("Released Documents");
              setActiveFilter("All");
            }}
          >
            <h2>{releasedDocuments}</h2>
            <p>Released Documents</p>
          </button>
        </div>

        <div className="admin-table-container">
          <div className="admin-table-header">
            <div>
              <h2>Document Requests</h2>
              <p>
                Search, filter, process payments, schedule pickups, and upload
                released documents.
              </p>
            </div>

            <button type="button" onClick={fetchRequests} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          <div className="admin-main-tabs">
            {mainTabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                className={
                  activeTab === tab.value
                    ? "admin-main-tab active"
                    : "admin-main-tab"
                }
                onClick={() => setActiveTab(tab.value)}
              >
                <span>{tab.label}</span>
                <small>{tab.helper}</small>
              </button>
            ))}
          </div>

          <div className="admin-toolbar">
            <div className="admin-search-box">
              <span>🔎</span>

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search citizen, document, receipt number, or reference..."
              />

              {searchTerm && (
                <button type="button" onClick={() => setSearchTerm("")}>
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="admin-filter-bar">
            {filterOptions.map((filter) => (
              <button
                key={filter.value}
                type="button"
                className={
                  activeFilter === filter.value
                    ? "admin-filter-btn active"
                    : "admin-filter-btn"
                }
                onClick={() => setActiveFilter(filter.value)}
              >
                <span>{filter.label}</span>
                <strong>{filter.count}</strong>
              </button>
            ))}
          </div>

          <div className="admin-filter-summary">
            <p>
              Tab: <strong>{activeTab}</strong>
            </p>
            <p>
              Status: <strong>{activeFilter}</strong>
            </p>
            <p>
              Results: <strong>{filteredRequests.length}</strong>
            </p>
          </div>

          {message && <p className="admin-message">{message}</p>}

          {loading ? (
            <p className="admin-loading">Loading requests...</p>
          ) : (
            <>
              <div className="admin-desktop-table">{renderActiveTable()}</div>
              <div className="admin-mobile-only">{renderMobileCards()}</div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
