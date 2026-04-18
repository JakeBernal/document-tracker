import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import clearance from "../assets/doc.png"
import certificate from "../assets/certificate.png"
import indigency from "../assets/contract.png"
import job from "../assets/job.png"
import approve from "../assets/approve.png"

const allServices = [
  {
    id: 1,
    category: "Barangay",
    title: "Barangay Clearance",
    desc: "For employment, IDs, and other requirements.",
    image: clearance,
    fee: "₱50.00",
    fullDesc: "A Barangay Clearance certifies that the holder is a person of good moral character and has no derogatory record in the barangay."
  },
  {
    id: 2,
    category: "Barangay",
    title: "Certificate of Residency",
    desc: "Proof of residence within the barangay.",
    image: certificate,
    fee: "₱30.00",
    fullDesc: "A Certificate of Residency confirms that the applicant is a bonafide resident of the barangay, required for school enrollment, government IDs, and other transactions."
  },
  {
    id: 3,
    category: "Barangay",
    title: "Certificate of Indigency",
    desc: "Required for financial or medical assistance.",
    image: indigency,
    fee: "Free",
    fullDesc: "A Certificate of Indigency is issued to qualified low-income residents who need financial, medical, or legal assistance from government agencies."
  },
  {
    id: 4,
    category: "Barangay",
    title: "First Time Jobseeker",
    desc: "For first-time job seekers to waive pre-employment fees.",
    image: job,
    fee: "Free",
    fullDesc: "Under RA 11261, first-time jobseekers are entitled to free services such as NBI clearance, police clearance, and other pre-employment document fees."
  },
  {
    id: 5,
    category: "LGU",
    title: "Business Permit (Mayor's)",
    desc: "Required for all business establishments.",
    image: approve,
    fee: "Varies",
    fullDesc: "A Mayor's Business Permit is required before operating any business in the city or municipality. Issued by the local government unit."
  },
  {
    id: 6,
    category: "LGU",
    title: "Community Tax Certificate",
    desc: "Also known as Cedula. Required for various transactions.",
    image: clearance,
    fee: "₱30.00",
    fullDesc: "A Community Tax Certificate (Cedula) is issued to individuals and corporations upon payment of the community tax, required in many government transactions."
  },
]

export default function Services() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("All")
  const [selected, setSelected] = useState(null)
  const [viewFull, setViewFull] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const filtered =
    activeTab === "All"
      ? allServices
      : allServices.filter(
          (service) => service.category === activeTab
        )

  const displayed = showAll ? filtered : filtered.slice(0, 5)

  const openModal = (service) => {
    setSelected(service)
    setViewFull(false)
  }

  const closeModal = () => {
    setSelected(null)
    setViewFull(false)
  }

  const handleChoose = () => {
    closeModal()
    navigate("/request", { state: { document: selected } })
  }

  return (
    <section className="services" id="services">
      <h2>Services</h2>

      <div className="service-tabs">
        <button
          className={activeTab === "All" ? "tab active" : "tab"}
          onClick={() => setActiveTab("All")}
        >
          All
        </button>
        <button
          className={activeTab === "Barangay" ? "tab active" : "tab"}
          onClick={() => {
          setActiveTab("Barangay")
          setShowAll(false)
        }}
          
        >
          Barangay
        </button>
        <button
          className={activeTab === "LGU" ? "tab active" : "tab"}
          onClick={() => setActiveTab("LGU")}
        >
          LGU
        </button>
      </div>

      <div className="card-container">
        {displayed.map((service) => (
          <div
            className="card clickable-card"
            key={service.id}
            onClick={() => openModal(service)}
          >
            <span
              className={`service-badge ${
                service.category === "Barangay" ? "barangay-badge" : "lgu-badge"
              }`}
            >
              {service.category}
            </span>

            <img src={service.image} alt={service.title} />
            <h3>{service.title}</h3>
            <p>{service.desc}</p>
            <span className="fee-badge">{service.fee}</span>
          </div>
        ))}
      </div> 

      {filtered.length > 5 && (
        <div className="see-more-container">
          <button
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
                <div className="modal-fullimg-wrap">
                  <img
                    src={selected.image}
                    alt={selected.title}
                    className="modal-fullimg"
                  />
                </div>
                <button
                  className="modal-back-btn"
                  onClick={() => setViewFull(false)}
                >
                  Back
                </button>
              </>
            ) : (
              <>
                <button className="modal-close-btn" onClick={closeModal}>
                  X
                </button>

                <div className="modal-img-wrap">
                  <img
                    src={selected.image}
                    alt={selected.title}
                    className="modal-img"
                  />
                </div>

                <p className="modal-category">{selected.category} Document</p>
                <p className="modal-title">{selected.title}</p>
                <p className="modal-fulldesc">{selected.fullDesc}</p>
                <p className="modal-fee">
                  Processing fee: <strong>{selected.fee}</strong>
                </p>

                <div className="modal-actions">
                  <button
                    className="modal-btn view-btn"
                    onClick={() => setViewFull(true)}
                  >
                    View
                  </button>
                  <button
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
  )
}