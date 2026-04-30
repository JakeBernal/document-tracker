import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import clearance from "../assets/doc.png";
import certificate from "../assets/certificate.png";
import indigency from "../assets/contract.png";
import job from "../assets/job.png";
import approve from "../assets/approve.png";

import "../css/services.css";

export default function Services() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("All");
  const [selected, setSelected] = useState(null);
  const [viewFull, setViewFull] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const allServices = [
    {
      id: 1,
      category: "Barangay",
      title: "Barangay Clearance",
      desc: "For employment, IDs, and other requirements.",
      image: clearance,
      fee: "₱50.00",
      fullDesc:
        "A Barangay Clearance certifies that the holder is a person of good moral character and has no derogatory record in the barangay.",
    },
    {
      id: 2,
      category: "Barangay",
      title: "Certificate of Residency",
      desc: "Proof of residence within the barangay.",
      image: certificate,
      fee: "₱30.00",
      fullDesc:
        "A Certificate of Residency confirms that the applicant is a bonafide resident of the barangay.",
    },
    {
      id: 3,
      category: "Barangay",
      title: "Certificate of Indigency",
      desc: "Required for financial or medical assistance.",
      image: indigency,
      fee: "Free",
      fullDesc:
        "Issued to qualified low-income residents who need financial or medical assistance.",
    },
    {
      id: 4,
      category: "Barangay",
      title: "First Time Jobseeker",
      desc: "For first-time job seekers.",
      image: job,
      fee: "Free",
      fullDesc:
        "Under RA 11261, first-time jobseekers are entitled to free pre-employment documents.",
    },
    {
      id: 5,
      category: "LGU",
      title: "Business Permit",
      desc: "Required for all business establishments.",
      image: approve,
      fee: "Varies",
      fullDesc:
        "A Mayor's Permit is required before operating any business in the municipality.",
    },
  ];

  const filteredServices =
    activeTab === "All"
      ? allServices
      : allServices.filter((service) => service.category === activeTab);

  const displayedServices = showAll
    ? filteredServices
    : filteredServices.slice(0, 5);

  const getUser = () => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser);
    } catch (error) {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      return null;
    }
  };

  const openModal = (service) => {
    setSelected(service);
    setViewFull(false);
  };

  const closeModal = () => {
    setSelected(null);
    setViewFull(false);
  };

  const handleChoose = () => {
    const user = getUser();

    if (!user) {
      navigate("/signin");
      return;
    }

    navigate("/documents");
    closeModal();
  };

  return (
    <section className="services" id="services">
      <h2>Services</h2>

      <div className="service-tabs">
        {["All", "Barangay", "LGU"].map((tab) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? "tab active" : "tab"}
            onClick={() => {
              setActiveTab(tab);
              setShowAll(false);
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="card-container">
        {displayedServices.map((service) => (
          <div
            className="service-card clickable-card"
            key={service.id}
            onClick={() => openModal(service)}
          >
            <span className="service-badge">{service.category}</span>

            <img src={service.image} alt={service.title} />

            <h3>{service.title}</h3>

            <p>{service.desc}</p>

            <span className="fee-badge">{service.fee}</span>
          </div>
        ))}
      </div>

      {filteredServices.length > 5 && (
        <div className="see-more-container">
          <button
            type="button"
            className="see-more-btn"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? "See less ↑" : "See more ↓"}
          </button>
        </div>
      )}

      {selected && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            {viewFull ? (
              <>
                <img
                  src={selected.image}
                  alt={selected.title}
                  className="modal-fullimg"
                />

                <button
                  type="button"
                  className="modal-btn back-btn"
                  onClick={() => setViewFull(false)}
                >
                  Back
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={closeModal}
                >
                  ×
                </button>

                <img
                  src={selected.image}
                  alt={selected.title}
                  className="modal-img"
                />

                <h3 className="modal-title">{selected.title}</h3>

                <p className="modal-fulldesc">{selected.fullDesc}</p>

                <p className="modal-fee">
                  Fee: <strong>{selected.fee}</strong>
                </p>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="modal-btn view-btn"
                    onClick={() => setViewFull(true)}
                  >
                    View
                  </button>

                  <button
                    type="button"
                    className="modal-btn choose-btn"
                    onClick={handleChoose}
                  >
                    Choose
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}