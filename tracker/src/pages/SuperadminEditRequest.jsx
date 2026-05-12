import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import "../css/requestform.css";
import "../css/admin.css";

export default function SuperadminEditRequest() {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <section className="request-page">
        <div className="request-header">
          <h1>Request Editing Locked</h1>
          <p>
            Superadmin access is read-only for request information. Superadmin can remove request records,
            manage users, document types, and promo codes, but cannot edit citizen-submitted request data,
            payment details, fees, notes, uploaded files, pickup details, or raw form information.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap", marginTop: "1rem" }}>
            <button type="button" className="primary-btn" onClick={() => navigate("/superadmin")}>
              Back to Superadmin Dashboard
            </button>
            <button type="button" className="secondary-btn" onClick={() => navigate("/admin")}>
              View Admin Dashboard
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
