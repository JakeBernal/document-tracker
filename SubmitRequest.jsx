import { useState } from 'react';

export default function SubmitRequest() {
  const [documentType, setDocumentType] = useState('');

  const submitRequest = async () => {
    const res = await fetch('http://localhost:5000/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 1, // TEMP
        document_type_id: documentType
      })
    });

    const data = await res.json();
    alert("Request submitted ID: " + data.request_id);
  };

  return (
    <div>
      <h2>Request Document</h2>

      <select onChange={(e) => setDocumentType(e.target.value)}>
        <option value="">Select Document</option>
        <option value="1">Barangay Clearance</option>
        <option value="2">Certificate of Indigency</option>
      </select>

      <button onClick={submitRequest}>Submit</button>
    </div>
  );
}