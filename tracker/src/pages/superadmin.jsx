import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import "../css/superadmin.css";

export default function SuperAdmin() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Promo form state
  const [promoForm, setPromoForm] = useState({
    code: "", description: "", discount_type: "fixed",
    discount_value: "", start_date: "", end_date: "",
  });
  const [promoSubmitting, setPromoSubmitting] = useState(false);

  // New admin form state
  const [adminForm, setAdminForm] = useState({
    full_name: "", email: "", password: "", role: "admin",
  });
  const [adminSubmitting, setAdminSubmitting] = useState(false);

  const token = localStorage.getItem("token");
  const userRaw = localStorage.getItem("user");

  useEffect(() => {
    if (!token || !userRaw) { navigate("/signin"); return; }
    const user = JSON.parse(userRaw);
    if (user.role !== "superadmin") { navigate("/admin"); return; }
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === "users") fetchUsers();
    if (activeTab === "promos") fetchPromos();
  }, [activeTab]);

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 4000);
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5001/api/superadmin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setStats(data);
      else showMessage(data.message || "Failed to load stats.", "error");
    } catch {
      showMessage("Cannot connect to server.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:5001/api/superadmin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setUsers(data.users || []);
    } catch {
      showMessage("Failed to load users.", "error");
    }
  };

  const fetchPromos = async () => {
    try {
      const res = await fetch("http://localhost:5001/api/admin/promo-codes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setPromoCodes(data.promo_codes || []);
    } catch {
      showMessage("Failed to load promo codes.", "error");
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    if (!window.confirm(`Change this user's role to "${newRole}"?`)) return;
    try {
      const res = await fetch(`http://localhost:5001/api/superadmin/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (res.ok) { showMessage(data.message); fetchUsers(); }
      else showMessage(data.message || "Failed to update role.", "error");
    } catch {
      showMessage("Cannot connect to server.", "error");
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Delete user "${userName}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`http://localhost:5001/api/superadmin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) { showMessage(data.message); fetchUsers(); }
      else showMessage(data.message || "Failed to delete user.", "error");
    } catch {
      showMessage("Cannot connect to server.", "error");
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!adminForm.full_name || !adminForm.email || !adminForm.password) {
      showMessage("Please fill in all fields.", "error"); return;
    }
    setAdminSubmitting(true);
    try {
      const res = await fetch("http://localhost:5001/api/superadmin/users/create-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(adminForm),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage(data.message);
        setAdminForm({ full_name: "", email: "", password: "", role: "admin" });
        fetchUsers();
      } else {
        showMessage(data.message || "Failed to create admin.", "error");
      }
    } catch {
      showMessage("Cannot connect to server.", "error");
    } finally {
      setAdminSubmitting(false);
    }
  };

  const handleCreatePromo = async (e) => {
    e.preventDefault();
    if (!promoForm.code || !promoForm.discount_type || promoForm.discount_value === "") {
      showMessage("Please fill in all required promo fields.", "error"); return;
    }
    setPromoSubmitting(true);
    try {
      const res = await fetch("http://localhost:5001/api/superadmin/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(promoForm),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage(data.message);
        setPromoForm({ code: "", description: "", discount_type: "fixed", discount_value: "", start_date: "", end_date: "" });
        fetchPromos();
      } else {
        showMessage(data.message || "Failed to create promo.", "error");
      }
    } catch {
      showMessage("Cannot connect to server.", "error");
    } finally {
      setPromoSubmitting(false);
    }
  };

  const handleTogglePromo = async (promo) => {
    try {
      const res = await fetch(`http://localhost:5001/api/superadmin/promo-codes/${promo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...promo, is_active: promo.is_active ? 0 : 1 }),
      });
      const data = await res.json();
      if (res.ok) { showMessage(data.message); fetchPromos(); }
      else showMessage(data.message || "Failed to update promo.", "error");
    } catch {
      showMessage("Cannot connect to server.", "error");
    }
  };

  const handleDeletePromo = async (promoId) => {
    if (!window.confirm("Delete this promo code? This cannot be undone.")) return;
    try {
      const res = await fetch(`http://localhost:5001/api/superadmin/promo-codes/${promoId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) { showMessage(data.message); fetchPromos(); }
      else showMessage(data.message || "Failed to delete promo.", "error");
    } catch {
      showMessage("Cannot connect to server.", "error");
    }
  };

  const formatDate = (d) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
  };

  const formatAmount = (a) =>
    Number(a || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" });

  const tabs = [
    { key: "overview", label: "📊 Overview" },
    { key: "users", label: "👥 User Management" },
    { key: "promos", label: "🎟️ Promo Codes" },
    { key: "create-admin", label: "➕ Create Admin" },
  ];

  return (
    <>
      <Navbar />
      <div className="superadmin-page">
        <div className="superadmin-header">
          <h1>⚙️ Superadmin Control Panel</h1>
          <p>System-wide management — users, promos, and analytics.</p>
        </div>

        {message.text && (
          <div className={`superadmin-message ${message.type}`}>{message.text}</div>
        )}

        {/* Tab Navigation */}
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

        {/* ── OVERVIEW TAB ── */}
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
                      Citizens: {stats.user_stats?.total_citizens || 0} |
                      Admins: {stats.user_stats?.total_admins || 0} |
                      Superadmins: {stats.user_stats?.total_superadmins || 0}
                    </small>
                  </div>

                  <div className="sa-stat-card green">
                    <h2>{stats.request_stats?.total_requests || 0}</h2>
                    <p>Total Requests</p>
                    <small>
                      Pending: {stats.request_stats?.pending || 0} |
                      Completed: {stats.request_stats?.completed || 0}
                    </small>
                  </div>

                  <div className="sa-stat-card purple">
                    <h2>{formatAmount(stats.request_stats?.total_revenue)}</h2>
                    <p>Total Revenue</p>
                    <small>From paid requests</small>
                  </div>

                  <div className="sa-stat-card orange">
                    <h2>{Number(stats.feedback_stats?.avg_rating || 0).toFixed(1)} ★</h2>
                    <p>Average Rating</p>
                    <small>{stats.feedback_stats?.total_feedback || 0} total feedback</small>
                  </div>

                  <div className="sa-stat-card teal">
                    <h2>{stats.promo_stats?.active_promos || 0}</h2>
                    <p>Active Promos</p>
                    <small>{stats.promo_stats?.total_promos || 0} total created</small>
                  </div>

                  <div className="sa-stat-card red">
                    <h2>{stats.request_stats?.rejected || 0}</h2>
                    <p>Rejected Requests</p>
                    <small>Processing: {stats.request_stats?.processing || 0}</small>
                  </div>
                </div>

                <div className="sa-panel">
                  <h2>Recent Activity (Last 10 Requests)</h2>
                  {stats.recent_activity?.length > 0 ? (
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
                              <span className={`sa-badge ${item.status?.toLowerCase().replace(" ", "-")}`}>
                                {item.status}
                              </span>
                            </td>
                            <td>{formatDate(item.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="sa-empty">No recent activity.</p>
                  )}
                </div>

                <div className="sa-shortcut-row">
                  <button type="button" className="sa-btn" onClick={() => navigate("/admin")}>
                    Go to Admin Dashboard →
                  </button>
                  <button type="button" className="sa-btn secondary" onClick={() => navigate("/reports")}>
                    View Reports →
                  </button>
                  <button type="button" className="sa-btn secondary" onClick={() => navigate("/feedback")}>
                    View Feedback →
                  </button>
                  <button type="button" className="sa-btn" onClick={fetchStats}>
                    Refresh Stats
                  </button>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* ── USER MANAGEMENT TAB ── */}
        {activeTab === "users" && (
          <div className="sa-section">
            <div className="sa-panel">
              <div className="sa-panel-header">
                <h2>All Users ({users.length})</h2>
                <button type="button" className="sa-btn small" onClick={fetchUsers}>Refresh</button>
              </div>

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
                  {users.length > 0 ? users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.id}</td>
                      <td><strong>{u.full_name}</strong></td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`sa-role-badge ${u.role}`}>{u.role}</span>
                      </td>
                      <td>{formatDate(u.created_at)}</td>
                      <td>
                        <div className="sa-action-group">
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                            className="sa-select"
                          >
                            <option value="citizen">Citizen</option>
                            <option value="admin">Admin</option>
                            <option value="superadmin">Superadmin</option>
                          </select>
                          {u.role !== "superadmin" && (
                            <button
                              type="button"
                              className="sa-btn danger small"
                              onClick={() => handleDeleteUser(u.id, u.full_name)}
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
          </div>
        )}

        {/* ── PROMO CODES TAB ── */}
        {activeTab === "promos" && (
          <div className="sa-section">
            {/* Create Promo Form */}
            <div className="sa-panel">
              <h2>Create New Promo Code</h2>
              <form className="sa-form" onSubmit={handleCreatePromo}>
                <div className="sa-form-grid">
                  <div className="sa-form-group">
                    <label>Promo Code <span className="required-star">*</span></label>
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
                      onChange={(e) => setPromoForm({ ...promoForm, discount_type: e.target.value })}
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
                      value={promoForm.discount_value}
                      onChange={(e) => setPromoForm({ ...promoForm, discount_value: e.target.value })}
                      placeholder={promoForm.discount_type === "percentage" ? "e.g. 20 (for 20%)" : "e.g. 50"}
                      min="0"
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
                  {promoSubmitting ? "Creating..." : "Create Promo Code"}
                </button>
              </form>
            </div>

            {/* Promo list */}
            <div className="sa-panel">
              <div className="sa-panel-header">
                <h2>All Promo Codes ({promoCodes.length})</h2>
                <button type="button" className="sa-btn small" onClick={fetchPromos}>Refresh</button>
              </div>

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
                        {promo.discount_type === "waiver" ? "Full Waiver" :
                          promo.discount_type === "percentage"
                            ? `${promo.discount_value}%`
                            : `₱${promo.discount_value}`}
                      </td>
                      <td>{promo.description || "—"}</td>
                      <td style={{ fontSize: "13px" }}>
                        {promo.start_date ? formatDate(promo.start_date) : "Any"} –{" "}
                        {promo.end_date ? formatDate(promo.end_date) : "No expiry"}
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
                    <tr><td colSpan="7" className="sa-empty">No promo codes yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── CREATE ADMIN TAB ── */}
        {activeTab === "create-admin" && (
          <div className="sa-section">
            <div className="sa-panel" style={{ maxWidth: "600px" }}>
              <h2>Create Admin / Superadmin Account</h2>
              <p style={{ color: "#6b7280", marginBottom: "20px" }}>
                Create staff accounts with admin or superadmin privileges.
              </p>

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