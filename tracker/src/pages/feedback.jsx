import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import "../css/feedback.css";

export default function Feedback() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const fetchFeedback = async () => {
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

      const res = await fetch("http://localhost:5001/api/admin/feedback", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message || "Failed to load feedback.");
        return;
      }

      setSummary(data.summary);
      setFeedback(data.feedback || []);
    } catch (error) {
      console.error("FETCH FEEDBACK ERROR:", error);
      setMessage("Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const formatDate = (dateValue) => {
    if (!dateValue) return "—";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const renderStars = (rating) => {
    const finalRating = Number(rating || 0);

    return "★".repeat(finalRating) + "☆".repeat(5 - finalRating);
  };

  return (
    <>
      <Navbar />

      <section className="feedback-page">
        <div className="feedback-header">
          <h1>Review and Feedback</h1>
          <p>View citizen ratings and service feedback.</p>
        </div>

        {loading && <p className="feedback-message">Loading feedback...</p>}

        {!loading && message && (
          <p className="feedback-message error">{message}</p>
        )}

        {!loading && summary && (
          <>
            <div className="feedback-summary-grid">
              <div className="feedback-summary-card">
                <p>Total Feedback</p>
                <h2>{summary.total_feedback}</h2>
              </div>

              <div className="feedback-summary-card">
                <p>Average Rating</p>
                <h2>{Number(summary.average_rating).toFixed(1)}</h2>
              </div>

              <div className="feedback-summary-card">
                <p>5-Star Reviews</p>
                <h2>{summary.five_star_count}</h2>
              </div>

              <div className="feedback-summary-card">
                <p>Low Ratings</p>
                <h2>{summary.low_rating_count}</h2>
              </div>
            </div>

            <div className="feedback-list">
              {feedback.length > 0 ? (
                feedback.map((item) => (
                  <div className="feedback-card" key={item.id}>
                    <div className="feedback-card-top">
                      <div>
                        <h2>{item.citizen_name || "Citizen"}</h2>
                        <p>{item.citizen_email || "No email"}</p>
                      </div>

                      <div className="feedback-stars">
                        {renderStars(item.rating)}
                      </div>
                    </div>

                    <div className="feedback-detail-row">
                      <span>Document</span>
                      <strong>{item.document_name || "Document Request"}</strong>
                    </div>

                    <div className="feedback-detail-row">
                      <span>Request Status</span>
                      <strong>{item.request_status || "Completed"}</strong>
                    </div>

                    <div className="feedback-comment">
                      <p>{item.comment || "No comment provided."}</p>
                    </div>

                    <small>{formatDate(item.created_at)}</small>
                  </div>
                ))
              ) : (
                <div className="feedback-empty">
                  <h2>No Feedback Yet</h2>
                  <p>Citizen feedback will appear here once completed requests are rated.</p>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </>
  );
}