import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import "../css/superadmin.css";

const API_BASE = "http://localhost:5001/api";

const requestStatuses = [
  "Pending",
  "Processing",
  "Needs More Info",
  "Rejected",
  "Approved",
  "Ready for Pickup",
  "Completed",
];

const paymentStatuses = ["Unpaid", "Paid", "Waived"];

export default function SuperAdmin() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const [requestSearch, setRequestSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");

  const [promoForm, setPromoForm] = useState({
    code: "",
    description: "",
    discount_type: "fixed",
    discount_value: "",
    start_date: "",
    end_date: "",
  });
  const [promoSubmitting, setPromoSubmitting] = useState(false);

  const [adminForm, setAdminForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "admin",
  });
  const [adminSubmitting, setAdminSubmitting] = useState(false);

  const token = localStorage.getItem("token");
  const userRaw = localStorage.getItem("user");

  useEffect(() => {
    if (!token || !userRaw) {
      navigate("/signin");
      return;
    }

    try {
      const user = JSON.parse(userRaw);
      if (user.role !== "superadmin") {
        navigate("/admin");
        return;
      }
    } catch {
      navigate("/signin");
      return;
    }

    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === "overview") fetchStats(false);
    if (activeTab === "users") fetchUsers();
    if (activeTab === "requests") fetchRequests();
    if (activeTab === "promos") fetchPromos();
  }, [activeTab]);

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  const jsonHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 4000);
  };

  const fetchStats = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const res = await fetch(`${API_BASE}/superadmin/stats`, {
        headers: authHeaders,
      });
      const data = await res.json();

      if (res.ok) {
        setStats(data);
      } else {
        showMessage(data.message || "Failed to load stats.", "error");
      }
    } catch {
      showMessage("Cannot connect to server.", "error");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setSectionLoading(true);
      const res = await fetch(`${API_BASE}/superadmin/users`, {
        headers: authHeaders,
      });
      const data = await res.json();

      if (res.ok) {
        setUsers(data.users || []);
      } else {
        showMessage(data.message || "Failed to load users.", "error");
      }
    } catch {
      showMessage("Failed to load users.", "error");
    } finally {
      setSectionLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      setSectionLoading(true);
      const res = await fetch(`${API_BASE}/superadmin/requests`, {
        headers: authHeaders,
      });
      const data = await res.json();

      if (res.ok) {
        setRequests(data.requests || []);
      } else {
        showMessage(data.message || "Failed to load requests.", "error");
      }
    } catch {
      showMessage("Failed to load requests.", "error");
    } finally {
      setSectionLoading(false);
    }
  };

  const fetchPromos = async () => {
    try {
      setSectionLoading(true);
      const res = await fetch(`${API_BASE}/superadmin/promo-codes`, {
        headers: authHeaders,
      });
      const data = await res.json();

      if (res.ok) {
        setPromoCodes(data.promo_codes || []);
      } else {
        showMessage(data.message || "Failed to load discount and waiver codes.", "error");
      }
    } catch {
      showMessage("Failed to load discount and waiver codes.", "error");
    } finally {
      setSectionLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Change this user's role to "${newRole}"?`)) return;

    try {
      const res = await fetch(`${API_BASE}/superadmin/users/${userId}/role`, {
        method: "PUT",
        headers: jsonHeaders,
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();

      if (res.ok) {
        showMessage(data.message || "User role updated successfully.");
        fetchUsers();
        fetchStats(false);
      } else {
        showMessage(data.message || "Failed to update role.", "error");
      }
    } catch {
      showMessage("Cannot connect to server.", "error");
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Delete user "${userName}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`${API_BASE}/superadmin/users/${userId}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      const data = await res.json();

      if (res.ok) {
        showMessage(data.message || "User deleted successfully.");
        fetchUsers();
        fetchStats(false);
      } else {
        showMessage(data.message || "Failed to delete user.", "error");
      }
    } catch {
      showMessage("Cannot connect to server.", "error");
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();

    if (!adminForm.full_name || !adminForm.email || !adminForm.password) {
      showMessage("Please fill in all fields.", "error");
      return;
    }

    setAdminSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/superadmin/users/create-admin`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify(adminForm),
      });
      const data = await res.json();

      if (res.ok) {
        showMessage(data.message || "Account created successfully.");
        setAdminForm({ full_name: "", email: "", password: "", role: "admin" });
        fetchStats(false);
      } else {
        showMessage(data.message || "Failed to create account.", "error");
      }
    } catch {
      showMessage("Cannot connect to server.", "error");
    } finally {
      setAdminSubmitting(false);
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (!window.confirm(`Remove request #${requestId}? This cannot be undone.`)) return;

    try {
      const res = await fetch(`${API_BASE}/superadmin/requests/${requestId}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      const data = await res.json();

      if (res.ok) {
        showMessage(data.message || "Request removed successfully.");
        fetchRequests();
        fetchStats(false);
      } else {
        showMessage(data.message || "Failed to delete request.", "error");
      }
    } catch {
      showMessage("Cannot connect to server.", "error");
    }
  };

  const handleCreatePromo = async (e) => {
    e.preventDefault();

    if (!promoForm.code || !promoForm.discount_type) {
      showMessage("Please fill in all required fields.", "error");
      return;
    }

    if (promoForm.discount_type !== "waiver" && promoForm.discount_value === "") {
      showMessage("Please enter a discount value.", "error");
      return;
    }

    const payload = {
      ...promoForm,
      code: promoForm.code.trim().toUpperCase(),
      discount_value: promoForm.discount_type === "waiver" ? 0 : promoForm.discount_value,
      start_date: promoForm.start_date || null,
      end_date: promoForm.end_date || null,
    };

    setPromoSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/superadmin/promo-codes`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        showMessage(data.message || "Discount and waiver code created successfully.");
        setPromoForm({
          code: "",
          description: "",
          discount_type: "fixed",
          discount_value: "",
          start_date: "",
          end_date: "",
        });
        fetchPromos();
        fetchStats(false);
      } else {
        showMessage(data.message || "Failed to create code.", "error");
      }
    } catch {
      showMessage("Cannot connect to server.", "error");
    } finally {
      setPromoSubmitting(false);
    }
  };

  const handleTogglePromo = async (promo) => {
    try {
      const res = await fetch(`${API_BASE}/superadmin/promo-codes/${promo.id}`, {
        method: "PUT",
        headers: jsonHeaders,
        // Send only the field being changed. Sending the whole row can resend
        // MySQL DATE values as ISO strings and cause a database date error.
        body: JSON.stringify({ is_active: promo.is_active ? 0 : 1 }),
      });
      const data = await res.json();

      if (res.ok) {
        showMessage(data.message || "Code updated successfully.");
        fetchPromos();
        fetchStats(false);
      } else {
        showMessage(data.message || "Failed to update code.", "error");
      }
    } catch {
      showMessage("Cannot connect to server.", "error");
    }
  };

  const handleDeletePromo = async (promoId) => {
    if (!window.confirm("Delete this discount and waiver code? This cannot be undone.")) return;

    try {
      const res = await fetch(`${API_BASE}/superadmin/promo-codes/${promoId}`, {
        method: "DELETE",
        headers: authHeaders,
      });
      const data = await res.json();

      if (res.ok) {
        showMessage(data.message || "Code deleted successfully.");
        fetchPromos();
        fetchStats(false);
      } else {
        showMessage(data.message || "Failed to delete code.", "error");
      }
    } catch {
      showMessage("Cannot connect to server.", "error");
    }
  };

  const formatDate = (value) => {
    if (!value) return "—";
    return new Date(value).toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (value) => {
    if (!value) return "";
    return String(value).slice(0, 5);
  };

  const formatAmount = (amount) =>
    Number(amount || 0).toLocaleString("en-PH", {
      style: "currency",
      currency: "PHP",
    });

  const getStatusClass = (status) =>
    String(status || "")
      .toLowerCase()
      .replace(/\s+/g, "-");

  const filteredRequests = useMemo(() => {
    const search = requestSearch.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesSearch =
        !search ||
        String(request.id || "").includes(search) ||
        String(request.citizen_name || "").toLowerCase().includes(search) ||
        String(request.citizen_email || "").toLowerCase().includes(search) ||
        String(request.document_name || "").toLowerCase().includes(search);

      const matchesStatus = statusFilter === "All" || request.status === statusFilter;
      const matchesPayment = paymentFilter === "All" || request.payment_status === paymentFilter;

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [requests, requestSearch, statusFilter, paymentFilter]);

  const tabs = [
    { key: "overview", label: "📊 Overview" },
    { key: "users", label: "👥 User Management" },
    { key: "requests", label: "📄 Request Management" },
    { key: "promos", label: "🎟️ Discount & Waiver Codes" },
    { key: "create-admin", label: "➕ Create Admin" },
  ];

  return (
    <>
      <Navbar />
      <div className="superadmin-page">
        <div className="superadmin-header">
          <h1>⚙️ Superadmin Control Panel</h1>
          <p>System-wide management for users, requests, discounts, waivers, and analytics.</p>
        </div>

        {message.text && (
          <div className={`superadmin-message ${message.type}`}>{message.text}</div>
        )}

        <div className="superadmin-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={activeTab === tab.key ? "sa-tab active" : "sa-tab"}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="sa-section">
            {loading ? (
              <p className="sa-loading">Loading system stats...</p>
            ) : stats ? (
              <>
                <div className="sa-stats-grid">
                  <div className="sa-stat-card blue">
                    <h2>{stats.user_stats?.total_users || 0}</h2>
                    <p>Total Users</p>
                    <small>
                      Citizens: {stats.user_stats?.total_citizens || 0} | Admins: {stats.user_stats?.total_admins || 0} | Superadmins: {stats.user_stats?.total_superadmins || 0}
                    </small>
                  </div>

                  <div className="sa-stat-card green">
                    <h2>{stats.request_stats?.total_requests || 0}</h2>
                    <p>Total Requests</p>
                    <small>
                      Pending: {stats.request_stats?.pending || 0} | Completed: {stats.request_stats?.completed || 0}
                    </small>
                  </div>

                  <div className="sa-stat-card purple">
                    <h2>{formatAmount(stats.request_stats?.total_revenue)}</h2>
                    <p>Total Revenue</p>
                    <small>From paid requests</small>
                  </div>

                  <div className="sa-stat-card teal">
                    <h2>{stats.user_stats?.fully_verified_citizens || 0}</h2>
                    <p>Fully Verified Citizens</p>
                    <small>Citizens allowed to submit document requests</small>
                  </div>

                  <div className="sa-stat-card gray">
                    <h2>{stats.user_stats?.not_verified_citizens || 0}</h2>
                    <p>Not Verified Citizens</p>
                    <small>Citizens who still need profile verification</small>
                  </div>

                  <div className="sa-stat-card orange">
                    <h2>{Number(stats.feedback_stats?.avg_rating || 0).toFixed(1)} ★</h2>
                    <p>Average Rating</p>
                    <small>{stats.feedback_stats?.total_feedback || 0} total feedback</small>
                  </div>

                  <div className="sa-stat-card teal">
                    <h2>{stats.promo_stats?.active_promos || 0}</h2>
                    <p>Active Discount/Waiver Codes</p>
                    <small>{stats.promo_stats?.total_promos || 0} total created</small>
                  </div>

                  <div className="sa-stat-card red">
                    <h2>{stats.request_stats?.rejected || 0}</h2>
                    <p>Rejected Requests</p>
                    <small>Processing: {stats.request_stats?.processing || 0}</small>
                  </div>
                </div>

                <div className="sa-panel">
                  <div className="sa-panel-header">
                    <h2>Recent Activity (Last 8 Requests)</h2>
                    <button type="button" className="sa-btn small" onClick={() => setActiveTab("requests")}>
                      Open Request Management
                    </button>
                  </div>

                  {stats.recent_activity?.length > 0 ? (
                    <div className="sa-table-wrap">
                      <table className="sa-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Citizen</th>
                            <th>Document</th>
                            <th>Status</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.recent_activity.map((item) => (
                            <tr key={item.id}>
                              <td>{item.id}</td>
                              <td>{item.citizen_name || "—"}</td>
                              <td>{item.document_name || "—"}</td>
                              <td>
                                <span className={`sa-badge ${getStatusClass(item.status)}`}>
                                  {item.status}
                                </span>
                              </td>
                              <td>{formatDate(item.created_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="sa-empty">No recent activity.</p>
                  )}
                </div>

                <div className="sa-shortcut-row">
                  <button type="button" className="sa-btn" onClick={() => setActiveTab("requests")}>
                    Manage Requests
                  </button>
                  <button type="button" className="sa-btn secondary" onClick={() => navigate("/admin")}>
                    Go to Admin Dashboard
                  </button>
                  <button type="button" className="sa-btn secondary" onClick={() => navigate("/reports")}>
                    View Reports
                  </button>
                  <button type="button" className="sa-btn secondary" onClick={() => navigate("/feedback")}>
                    View Feedback
                  </button>
                  <button type="button" className="sa-btn" onClick={() => fetchStats()}>
                    Refresh Stats
                  </button>
                </div>
              </>
            ) : null}
          </div>
        )}

        {activeTab === "users" && (
          <div className="sa-section">
            <div className="sa-panel">
              <div className="sa-panel-header">
                <h2>All Users ({users.length})</h2>
                <button type="button" className="sa-btn small" onClick={fetchUsers}>Refresh</button>
              </div>

              {sectionLoading ? (
                <p className="sa-loading">Loading users...</p>
              ) : (
                <div className="sa-table-wrap">
                  <table className="sa-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Full Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Joined</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length > 0 ? users.map((user) => (
                        <tr key={user.id}>
                          <td>{user.id}</td>
                          <td><strong>{user.full_name || "Unnamed User"}</strong></td>
                          <td>{user.email}</td>
                          <td><span className={`sa-role-badge ${user.role}`}>{user.role}</span></td>
                          <td>{formatDate(user.created_at)}</td>
                          <td>
                            <div className="sa-action-group">
                              <select
                                value={user.role}
                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                className="sa-select"
                              >
                                <option value="citizen">Citizen</option>
                                <option value="admin">Admin</option>
                                <option value="superadmin">Superadmin</option>
                              </select>

                              {user.role !== "superadmin" && (
                                <button
                                  type="button"
                                  className="sa-btn danger small"
                                  onClick={() => handleDeleteUser(user.id, user.full_name || user.email)}
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan="6" className="sa-empty">No users found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "requests" && (
          <div className="sa-section">
            <div className="sa-panel">
              <div className="sa-panel-header stackable">
                <div>
                  <h2>Request Management ({filteredRequests.length})</h2>
                  <p className="sa-muted">Monitor request records. Superadmin can remove records but cannot edit raw request data.</p>
                </div>
                <button type="button" className="sa-btn small" onClick={fetchRequests}>Refresh</button>
              </div>

              <div className="sa-filter-row">
                <input
                  type="text"
                  className="sa-search-input"
                  placeholder="Search by ID, citizen, email, or document..."
                  value={requestSearch}
                  onChange={(e) => setRequestSearch(e.target.value)}
                />

                <select className="sa-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="All">All Statuses</option>
                  {requestStatuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>

                <select className="sa-select" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
                  <option value="All">All Payments</option>
                  {paymentStatuses.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              {sectionLoading ? (
                <p className="sa-loading">Loading requests...</p>
              ) : (
                <div className="sa-table-wrap">
                  <table className="sa-table request-management-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Citizen</th>
                        <th>Document</th>
                        <th>Status</th>
                        <th>Payment</th>
                        <th>Total</th>
                        <th>Pickup</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRequests.length > 0 ? filteredRequests.map((request) => (
                        <tr key={request.id}>
                          <td><strong>#{request.id}</strong></td>
                          <td>
                            <strong>{request.citizen_name || "Deleted Citizen"}</strong>
                            <span className="sa-subtext">{request.citizen_email || "No email"}</span>
                            <span className={`sa-mini-badge ${request.citizen_verification_status === "Fully Verified" ? "verified" : "unverified"}`}>
                              {request.citizen_verification_status || "Not Verified"}
                            </span>
                          </td>
                          <td>
                            {request.document_name || "Document Request"}
                            {request.person_named_in_document && (
                              <span className="sa-subtext">For: {request.person_named_in_document}</span>
                            )}
                          </td>
                          <td>
                            <span className={`sa-badge ${getStatusClass(request.status)}`}>
                              {request.status || "Pending"}
                            </span>
                          </td>
                          <td>
                            <span className={`sa-badge ${String(request.payment_status || "Unpaid").toLowerCase()}`}>
                              {request.payment_status || "Unpaid"}
                            </span>
                          </td>
                          <td>{formatAmount(request.total_amount)}</td>
                          <td>
                            {request.pickup_date ? `${formatDate(request.pickup_date)} ${formatTime(request.pickup_time)}` : "—"}
                          </td>
                          <td>{formatDate(request.created_at)}</td>
                          <td>
                            <div className="sa-action-group">
                              <button
                                type="button"
                                className="sa-btn danger small"
                                onClick={() => handleDeleteRequest(request.id)}
                                title="Remove this request record. Editing request data is locked for superadmin."
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan="9" className="sa-empty">No matching requests found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "promos" && (
          <div className="sa-section">
            <div className="sa-panel">
              <h2>Create Discount and Waiver Code</h2>
              <form className="sa-form" onSubmit={handleCreatePromo}>
                <div className="sa-form-grid">
                  <div className="sa-form-group">
                    <label>Code <span className="required-star">*</span></label>
                    <input
                      type="text"
                      value={promoForm.code}
                      onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                      placeholder="e.g. SENIOR20"
                    />
                  </div>

                  <div className="sa-form-group">
                    <label>Discount Type <span className="required-star">*</span></label>
                    <select
                      value={promoForm.discount_type}
                      onChange={(e) => {
                        const nextType = e.target.value;
                        setPromoForm({
                          ...promoForm,
                          discount_type: nextType,
                          discount_value: nextType === "waiver" ? "0" : promoForm.discount_value,
                        });
                      }}
                    >
                      <option value="fixed">Fixed Amount (₱)</option>
                      <option value="percentage">Percentage (%)</option>
                      <option value="waiver">Full Waiver</option>
                    </select>
                  </div>

                  <div className="sa-form-group">
                    <label>Discount Value <span className="required-star">*</span></label>
                    <input
                      type="number"
                      value={promoForm.discount_type === "waiver" ? "0" : promoForm.discount_value}
                      onChange={(e) => setPromoForm({ ...promoForm, discount_value: e.target.value })}
                      placeholder={promoForm.discount_type === "percentage" ? "e.g. 20" : "e.g. 50"}
                      min="0"
                      step="0.01"
                      disabled={promoForm.discount_type === "waiver"}
                    />
                  </div>

                  <div className="sa-form-group">
                    <label>Description</label>
                    <input
                      type="text"
                      value={promoForm.description}
                      onChange={(e) => setPromoForm({ ...promoForm, description: e.target.value })}
                      placeholder="e.g. Senior citizen discount"
                    />
                  </div>

                  <div className="sa-form-group">
                    <label>Start Date</label>
                    <input
                      type="date"
                      value={promoForm.start_date}
                      onChange={(e) => setPromoForm({ ...promoForm, start_date: e.target.value })}
                    />
                  </div>

                  <div className="sa-form-group">
                    <label>End Date</label>
                    <input
                      type="date"
                      value={promoForm.end_date}
                      onChange={(e) => setPromoForm({ ...promoForm, end_date: e.target.value })}
                    />
                  </div>
                </div>

                <button type="submit" className="sa-btn" disabled={promoSubmitting}>
                  {promoSubmitting ? "Creating..." : "Create Code"}
                </button>
              </form>
            </div>

            <div className="sa-panel">
              <div className="sa-panel-header">
                <h2>All Discount and Waiver Codes ({promoCodes.length})</h2>
                <button type="button" className="sa-btn small" onClick={fetchPromos}>Refresh</button>
              </div>

              {sectionLoading ? (
                <p className="sa-loading">Loading codes...</p>
              ) : (
                <div className="sa-table-wrap">
                  <table className="sa-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Type</th>
                        <th>Value</th>
                        <th>Description</th>
                        <th>Valid Period</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {promoCodes.length > 0 ? promoCodes.map((promo) => (
                        <tr key={promo.id}>
                          <td><strong>{promo.code}</strong></td>
                          <td style={{ textTransform: "capitalize" }}>{promo.discount_type}</td>
                          <td>
                            {promo.discount_type === "waiver" ? "Full Waiver" : promo.discount_type === "percentage" ? `${promo.discount_value}%` : `₱${promo.discount_value}`}
                          </td>
                          <td>{promo.description || "—"}</td>
                          <td style={{ fontSize: "13px" }}>
                            {promo.start_date ? formatDate(promo.start_date) : "Any"} to {promo.end_date ? formatDate(promo.end_date) : "No expiry"}
                          </td>
                          <td>
                            <span className={`sa-badge ${promo.is_active ? "active" : "inactive"}`}>
                              {promo.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td>
                            <div className="sa-action-group">
                              <button
                                type="button"
                                className={`sa-btn small ${promo.is_active ? "secondary" : ""}`}
                                onClick={() => handleTogglePromo(promo)}
                              >
                                {promo.is_active ? "Deactivate" : "Activate"}
                              </button>
                              <button
                                type="button"
                                className="sa-btn danger small"
                                onClick={() => handleDeletePromo(promo.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan="7" className="sa-empty">No discount or waiver codes yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "create-admin" && (
          <div className="sa-section">
            <div className="sa-panel" style={{ maxWidth: "640px" }}>
              <h2>Create Admin / Superadmin Account</h2>
              <p className="sa-muted">Create staff accounts with admin or superadmin privileges.</p>

              <form className="sa-form" onSubmit={handleCreateAdmin}>
                <div className="sa-form-group">
                  <label>Full Name <span className="required-star">*</span></label>
                  <input
                    type="text"
                    value={adminForm.full_name}
                    onChange={(e) => setAdminForm({ ...adminForm, full_name: e.target.value })}
                    placeholder="Enter full name"
                  />
                </div>

                <div className="sa-form-group">
                  <label>Email Address <span className="required-star">*</span></label>
                  <input
                    type="email"
                    value={adminForm.email}
                    onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                    placeholder="Enter email"
                  />
                </div>

                <div className="sa-form-group">
                  <label>Password <span className="required-star">*</span></label>
                  <input
                    type="password"
                    value={adminForm.password}
                    onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                    placeholder="Set a secure password"
                  />
                </div>

                <div className="sa-form-group">
                  <label>Role</label>
                  <select
                    value={adminForm.role}
                    onChange={(e) => setAdminForm({ ...adminForm, role: e.target.value })}
                  >
                    <option value="admin">Admin</option>
                    <option value="superadmin">Superadmin</option>
                  </select>
                </div>

                <button type="submit" className="sa-btn" disabled={adminSubmitting}>
                  {adminSubmitting ? "Creating..." : "Create Account"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
