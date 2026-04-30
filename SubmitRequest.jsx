import { useState } from "react";

export default function SubmitRequest() {
  const [documentType, setDocumentType] = useState("");

  const submitRequest = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = localStorage.getItem("token");

      if (!user || !token) {
        alert("Please login first.");
        return;
      }

      if (!documentType) {
        alert("Please select a document type.");
        return;
      }

      const res = await fetch("http://localhost:5001/api/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: user.id,
          document_type_id: documentType,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        alert(`Request submitted! ID: ${data.request_id}`);
      } else {
        alert(data.message || "Failed to submit request.");
      }
    } catch (err) {
      console.error("SUBMIT REQUEST ERROR:", err);
      alert("Error connecting to server. Please try again.");
    }
  };

  return (
    <div>
      <h2>Request Document</h2>

      <select onChange={(e) => setDocumentType(e.target.value)} value={documentType}>
        <option value="">Select Document</option>
        <option value="1">Barangay Clearance</option>
        <option value="2">Certificate of Residency</option>
        <option value="3">Certificate of Indigency</option>
        <option value="4">First Time Jobseeker</option>
        <option value="5">Application of Marriage License</option>
        {/* Add more document types as needed */}
      </select>

      <button onClick={submitRequest}>Submit</button>
    </div>
  );
}