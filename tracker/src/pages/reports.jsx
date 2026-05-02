import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import "../css/reports.css";

export default function Reports() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [mostRequestedDocuments, setMostRequestedDocuments] = useState([]);
  const [statusBreakdown, setStatusBreakdown] = useState([]);
  const [paymentBreakdown, setPaymentBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const fetchReports = async () => {
    const token = localStorage.getItem("token");
    const userRaw = localStorage.getItem("user");

    if (!token || !userRaw) {
      navigate("/signin");
      return;
    }

    const user = JSON.parse(userRaw);

    if (user.role !== "admin" && user.role !== "superadmin") {
      navigate("/citizen");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const res = await fetch(
        "http://localhost:5001/api/admin/reports/summary",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Failed to load reports.");
        return;
      }

      setSummary(data.summary);
      setMostRequestedDocuments(data.most_requested_documents || []);
      setStatusBreakdown(data.status_breakdown || []);
      setPaymentBreakdown(data.payment_breakdown || []);
    } catch (error) {
      console.error("FETCH REPORTS ERROR:", error);
      setMessage("Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const formatAmount = (amount) => {
    return Number(amount || 0).toLocaleString("en-PH", {
      style: "currency",
      currency: "PHP",
    });
  };

  return (
    <>
      <Navbar />

      <section className="reports-page">
        <div className="reports-header">
          <h1>Report Generation</h1>
          <p>View system performance, request totals, and revenue summary.</p>
        </div>

        {loading && <p className="reports-message">Loading reports...</p>}

        {!loading && message && (
          <p className="reports-message error">{message}</p>
        )}

        {!loading && summary && (
          <>
            <div className="reports-grid">
              <div className="report-card">
                <p>Total Requests</p>
                <h2>{summary.total_requests}</h2>
              </div>

              <div className="report-card">
                <p>Pending Requests</p>
                <h2>{summary.pending_requests}</h2>
              </div>

              <div className="report-card">
                <p>Approved Requests</p>
                <h2>{summary.approved_requests}</h2>
              </div>

              <div className="report-card">
                <p>Completed Requests</p>
                <h2>{summary.completed_requests}</h2>
              </div>

              <div className="report-card wide">
                <p>Total Payment Collected</p>
                <h2>{formatAmount(summary.total_payment_collected)}</h2>
              </div>

              <div className="report-card wide">
                <p>Total System Fee Revenue</p>
                <h2>{formatAmount(summary.total_system_fee_revenue)}</h2>
              </div>
            </div>

            <div className="reports-sections">
              <div className="report-panel">
                <h2>Most Requested Documents</h2>

                {mostRequestedDocuments.length > 0 ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Document</th>
                        <th>Total Requests</th>
                      </tr>
                    </thead>

                    <tbody>
                      {mostRequestedDocuments.map((item, index) => (
                        <tr key={index}>
                          <td>{item.document_name}</td>
                          <td>{item.total_requests}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="empty-report">No document request data yet.</p>
                )}
              </div>

              <div className="report-panel">
                <h2>Status Breakdown</h2>

                {statusBreakdown.length > 0 ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Total</th>
                      </tr>
                    </thead>

                    <tbody>
                      {statusBreakdown.map((item, index) => (
                        <tr key={index}>
                          <td>{item.status || "Pending"}</td>
                          <td>{item.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="empty-report">No status data yet.</p>
                )}
              </div>

              <div className="report-panel">
                <h2>Payment Breakdown</h2>

                {paymentBreakdown.length > 0 ? (
                  <table>
                    <thead>
                      <tr>
                        <th>Payment Status</th>
                        <th>Total</th>
                      </tr>
                    </thead>

                    <tbody>
                      {paymentBreakdown.map((item, index) => (
                        <tr key={index}>
                          <td>{item.payment_status || "Unpaid"}</td>
                          <td>{item.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="empty-report">No payment data yet.</p>
                )}
              </div>
            </div>

            <div className="reports-actions">
              <button type="button" onClick={fetchReports}>
                Refresh Report
              </button>

              <button type="button" onClick={() => window.print()}>
                Print Report
              </button>
            </div>
          </>
        )}
      </section>
    </>
  );
}