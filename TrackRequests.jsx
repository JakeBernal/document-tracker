import { useEffect, useState } from "react";

export default function TrackRequests() {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const user = JSON.parse(localStorage.getItem("user"));
      const token = localStorage.getItem("token");

      if (!user || !token) {
        setError("Please login first.");
        setRequests([]);
        return;
      }

      const res = await fetch(`http://localhost:5001/api/requests/my/${user.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Failed to fetch requests.");
        setRequests([]);
        return;
      }

      setRequests(data.requests || []);
    } catch (err) {
      console.error("FETCH REQUESTS ERROR:", err);
      setError("Cannot connect to server. Please check your backend.");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <div>
      <h2>My Requests</h2>

      {loading && <p>Loading requests...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {requests.length > 0 ? (
        requests.map((r) => (
          <div key={r.id}>
            <h4>{r.document_name || r.form_data?.document_name}</h4>
            <p>Status: {r.status}</p>
            <p>Fee: ₱{r.fee}</p>
          </div>
        ))
      ) : (
        !loading && <p>No requests found</p>
      )}
    </div>
  );
}