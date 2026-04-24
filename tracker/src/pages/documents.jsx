import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import "../css/documents.css";
import { documentRequirements } from "../data/documentRequirements";

export default function Documents() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("All");
  const [selected, setSelected] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [zoomImage, setZoomImage] = useState(null);

  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const handleChooseSubDocument = (choice) => {
  const chosenDocument = {
    ...selected,
    title: choice.title,
    images: choice.images,
    desc: choice.description,
    fullDesc: choice.description,
    requirement: choice.uploadLabel,
    uploadLabel: choice.uploadLabel,
    selectedChoiceId: choice.id,
    parentTitle: selected.title,
  };

  navigate("/request", { state: { document: chosenDocument } });

  setShowChoiceModal(false);
  closeModal();
};

const documents = useMemo(() => {
  return Object.entries(documentRequirements)
    .filter(([_, doc]) => !doc.hideFromList)
    .map(([title, doc]) => ({
      id: doc.id,
      title,
      category: doc.category,
      desc: doc.description,
      images: doc.images || [],
      fee: doc.fee,
      time: doc.time,
      requirement: doc.uploadLabel,
      uploadLabel: doc.uploadLabel,
      fullDesc: doc.description,
      fields: doc.fields || [],

      // IMPORTANT FOR FIRST TIME JOBSEEKER CHOICES
      hasChoices: doc.hasChoices || false,
      choices: doc.choices || [],
    }));
}, []);

  const filteredDocuments =
    activeTab === "All"
      ? documents
      : documents.filter((doc) => doc.category === activeTab);

  const displayedDocuments = showAll
    ? filteredDocuments
    : filteredDocuments.slice(0, 10);

    {showChoiceModal && selected && (
  <div
    className="document-modal-overlay"
    onClick={() => setShowChoiceModal(false)}
  >
    <div
      className="document-modal choice-modal"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="document-modal-close"
        onClick={() => setShowChoiceModal(false)}
      >
        ×
      </button>

      <h2>Choose First Time Jobseeker Form</h2>
      <p className="document-modal-desc">
        Please choose only one form to request.
      </p>

      <div className="choice-documents-grid">
        {selected.choices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            className="choice-document-card"
            onClick={() => handleChooseSubDocument(choice)}
          >
            <img src={choice.images[0]} alt={choice.title} />
            <h3>{choice.title}</h3>
            <p>{choice.description}</p>
          </button>
        ))}
      </div>
    </div>
  </div>
)}

  const openModal = (document) => {
    setSelected(document);
    setActiveImageIndex(0);
    setZoomImage(null);
  };

  const closeModal = () => {
    setSelected(null);
    setActiveImageIndex(0);
    setZoomImage(null);
  };

    const handleChoose = () => {
    if (selected?.hasChoices && selected?.choices?.length > 0) {
    setShowChoiceModal(true);
    return;
  }

  const handleChooseSubDocument = (choice) => {
  const chosenDocument = {
    ...selected,
    title: choice.title,
    images: choice.images,
    desc: choice.description,
    fullDesc: choice.description,
    description: choice.description,
    uploadLabel: choice.uploadLabel,
    requirement: choice.uploadLabel,
    fields: choice.fields || selected.fields || [],
    selectedChoiceId: choice.id,
    parentTitle: selected.title,
  };

  navigate("/request", { state: { document: chosenDocument } });

  setShowChoiceModal(false);
  closeModal();
};

  navigate("/request", { state: { document: selected } });
  closeModal();
};

  const goPrevImage = () => {
    if (!selected?.images?.length) return;

    setActiveImageIndex((prev) =>
      prev === 0 ? selected.images.length - 1 : prev - 1
    );
  };

  const goNextImage = () => {
    if (!selected?.images?.length) return;

    setActiveImageIndex((prev) =>
      prev === selected.images.length - 1 ? 0 : prev + 1
    );
  };

  return (
    <>
      <Navbar />

      <section className="documents-page">
        <div className="documents-header">
          <h1>Choose Document</h1>
          <p>
            Select the document you need from Barangay or LGU services before
            submitting your request.
          </p>
        </div>

        <div className="document-tabs">
          {["All", "Barangay", "LGU"].map((tab) => (
            <button
              key={tab}
              type="button"
              className={activeTab === tab ? "doc-tab active" : "doc-tab"}
              onClick={() => {
                setActiveTab(tab);
                setShowAll(false);
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="documents-grid">
          {displayedDocuments.map((document) => (
            <div
              className="document-card"
              key={`${document.category}-${document.id}-${document.title}`}
              onClick={() => openModal(document)}
            >
              <span
                className={
                  document.category === "Barangay"
                    ? "document-badge barangay"
                    : "document-badge lgu"
                }
              >
                {document.category}
              </span>

              {document.images.length > 1 && (
                <span className="page-count-badge">
                  {document.images.length} pages
                </span>
              )}

              <div className="document-card-img-wrap">
                {document.images[0] ? (
                  <img src={document.images[0]} alt={document.title} />
                ) : (
                  <div className="document-no-image">No Preview</div>
                )}
              </div>

              <h3>{document.title}</h3>
              <p>{document.desc}</p>

              <span className="document-fee">{document.fee}</span>
            </div>
          ))}
        </div>

        {filteredDocuments.length > 10 && (
          <div className="show-more-container">
            <button
              type="button"
              className="show-more-btn"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? "Show Less ↑" : "Show More ↓"}
            </button>
          </div>
        )}

        {selected && (
          <div className="document-modal-overlay" onClick={closeModal}>
            <div
              className="document-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="document-modal-close"
                onClick={closeModal}
              >
                ×
              </button>

              <div className="document-preview-box">
                {selected.images.length > 1 && (
                  <button
                    type="button"
                    className="image-nav-btn image-nav-left"
                    onClick={goPrevImage}
                  >
                    ‹
                  </button>
                )}

                {selected.images[activeImageIndex] ? (
                  <img
                    src={selected.images[activeImageIndex]}
                    alt={`${selected.title} page ${activeImageIndex + 1}`}
                    className="document-modal-img"
                    onClick={() =>
                      setZoomImage(selected.images[activeImageIndex])
                    }
                  />
                ) : (
                  <div className="document-no-image large">No Preview</div>
                )}

                {selected.images.length > 1 && (
                  <button
                    type="button"
                    className="image-nav-btn image-nav-right"
                    onClick={goNextImage}
                  >
                    ›
                  </button>
                )}
              </div>

              <p className="zoom-hint">Click image to zoom</p>

              {selected.images.length > 1 && (
                <div className="thumbnail-row">
                  {selected.images.map((img, index) => (
                    <button
                      key={index}
                      type="button"
                      className={
                        activeImageIndex === index
                          ? "thumbnail-btn active"
                          : "thumbnail-btn"
                      }
                      onClick={() => setActiveImageIndex(index)}
                    >
                      <img
                        src={img}
                        alt={`${selected.title} thumbnail ${index + 1}`}
                      />
                      <span>Page {index + 1}</span>
                    </button>
                  ))}
                </div>
              )}

              <h2>{selected.title}</h2>

              <span
                className={
                  selected.category === "Barangay"
                    ? "document-badge barangay"
                    : "document-badge lgu"
                }
              >
                {selected.category}
              </span>

              <p className="document-modal-desc">{selected.fullDesc}</p>

              <div className="document-modal-info">
                <p>
                  <strong>Fee:</strong> {selected.fee}
                </p>
                <p>
                  <strong>Processing Time:</strong> {selected.time}
                </p>
                <p>
                  <strong>Required Attachment:</strong> {selected.requirement}
                </p>
              </div>

              <div className="document-modal-actions">
                <button type="button" className="cancel-btn" onClick={closeModal}>
                  Cancel
                </button>

                <button
                  type="button"
                  className="choose-document-btn"
                  onClick={handleChoose}
                >
                  Choose Document
                </button>
              </div>
            </div>
          </div>
        )}

        {showChoiceModal && selected && (
  <div
    className="document-modal-overlay"
    onClick={() => setShowChoiceModal(false)}
  >
    <div
      className="document-modal choice-modal"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="document-modal-close"
        onClick={() => setShowChoiceModal(false)}
      >
        ×
      </button>

      <h2>Choose First Time Jobseeker Form</h2>

      <p className="document-modal-desc">
        Please choose only one form to request.
      </p>

      <div className="choice-documents-grid">
        {selected.choices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            className="choice-document-card"
            onClick={() => handleChooseSubDocument(choice)}
          >
            <img src={choice.images[0]} alt={choice.title} />
            <h3>{choice.title}</h3>
            <p>{choice.description}</p>
          </button>
        ))}
      </div>
    </div>
  </div>
)}

        {zoomImage && (
          <div className="zoom-modal-overlay" onClick={() => setZoomImage(null)}>
            <div className="zoom-modal" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                className="zoom-modal-close"
                onClick={() => setZoomImage(null)}
              >
                ×
              </button>

              <img src={zoomImage} alt="Zoomed document" />
            </div>
          </div>
        )}
      </section>
    </>
  );
}