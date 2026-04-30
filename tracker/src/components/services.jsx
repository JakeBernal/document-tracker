import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { documentRequirements } from "../data/documentRequirements.js";
import "../css/services.css";

export default function Services() {
  const navigate = useNavigate();

  const ITEMS_PER_PAGE = 4;

  const [activeTab, setActiveTab] = useState("All");
  const [showAll, setShowAll] = useState(false);

  const documents = Object.entries(documentRequirements).map(([title, data]) => ({
    title,
    ...data,
  }));

  const filteredDocuments =
    activeTab === "All"
      ? documents
      : documents.filter((doc) => doc.category === activeTab);

  const displayedDocuments = showAll
    ? filteredDocuments
    : filteredDocuments.slice(0, ITEMS_PER_PAGE);

  const getLoggedInUser = () => {
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

  const handleChoose = (document) => {
    const user = getLoggedInUser();

    if (!user || user.role !== "citizen") {
      navigate("/signin");
      return;
    }

    navigate("/request", { state: { document } });
  };

  const handleSeeMore = () => {
    const user = getLoggedInUser();

    if (!user || user.role !== "citizen") {
      navigate("/signin");
      return;
    }

    setShowAll(!showAll);
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
        {displayedDocuments.map((doc) => (
          <div
            key={doc.title}
            className="service-card clickable-card"
            onClick={() => handleChoose(doc)}
          >
            <div className="service-card-top">
              <span
                className={`service-badge ${
                  doc.category === "Barangay" ? "barangay-badge" : "lgu-badge"
                }`}
              >
                {doc.category}
              </span>

              {doc.images?.length > 1 && (
                <span className="page-badge">{doc.images.length} pages</span>
              )}
            </div>

            <img
              src={doc.images?.[0]}
              alt={doc.title}
              className="service-document-img"
            />

            <h3>{doc.title}</h3>

            <p>{doc.description}</p>

            <span className="fee-badge">{doc.fee}</span>
          </div>
        ))}
      </div>

      {filteredDocuments.length > ITEMS_PER_PAGE && (
        <div className="see-more-container">
          <button
            type="button"
            className="see-more-btn"
            onClick={handleSeeMore}
          >
            {showAll ? "See less ↑" : "See more ↓"}
          </button>
        </div>
      )}
    </section>
  );
}