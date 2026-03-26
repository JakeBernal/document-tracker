import React from 'react'

export default function services() {
  const services = [
    "Barangay Clearance",
    "Certificate of Residency",
    "Certificate of Indigency",
  ];

  return (
   <section className='services'>

    <h2>Services</h2>
      <div className="card-container">
        {services.map((service, index) => (
          <div className="card" key={index}>
            📄
            <p>{service}</p>
          </div>
        ))}
      </div>
   </section>
  )
}
