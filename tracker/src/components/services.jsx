import React from 'react'
import clearance from  "../assets/doc.png"
import certificate from "../assets/certificate.png"
import indigency from "../assets/contract.png"
import job from "../assets/job.png"

export default function services() {
  const services = [
    {title:"Barangay Clearance",
     desc: "For employment, IDs, and other requirements.",
     image: clearance},

    {title:"Certificate of Residency",
     desc: "Proof of residence within the baranggay.",
     image: certificate},

    {title: "Certificate of Indigency",
     desc:"Required for financial or medical assistance.",
     image: indigency
    }, 

    {title: "First Time Jobseeker",
     desc:"For first-time job seekers to waive pre-employment fees.",
     image: job
    }, 

  ];
 
  return (
   <section className='services'>
    <h2>Services</h2> 
      <div className="card-container">
        {services.map((service, index)=> (
          <div className="card" key={index}>
            <img src={service.image}/>
            <h3>{service.title}</h3>
            <p>{service.desc}</p>
          </div>
        ))}
      </div>
        <a href='#' className='seemore'>See more</a>
   </section>
  )
}
