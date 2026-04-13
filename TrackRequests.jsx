import { useEffect, useState } from 'react';

export default function TrackRequests() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/requests/my/1')
      .then(res => res.json())
      .then(data => setRequests(data));
  }, []);

  return (
    <div>
      <h2>My Requests</h2>

      {requests.map(r => (
        <div key={r.id}>
          <h4>{r.document_name}</h4>
          <p>Status: {r.status}</p>
          <p>Fee: ₱{r.fee}</p>
        </div>
      ))}
    </div>
  );
}