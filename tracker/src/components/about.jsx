import React from "react";
import "../css/about.css";

function About() {
  return (
    <section className="about-container" id="about">
      <div className="about-card">

        {/* Top: split panel */}
        <div className="about-card-top">

          {/* Left — tag + headline */}
          <div className="about-card-left">
            <span className="about-tag">ABOUT US</span>
            <h1>PaperTrail Digital Solutions</h1>
          </div>

          {/* Right — blue panel with copy */}
          <div className="about-card-right">
            <div>
              <p className="about-section-label">What we do</p>
              <p>
                A smart document request and tracking platform that lets citizens
                request official documents in advance — so paperwork is
                prepared and ready for pickup when you arrive.
              </p>
            </div>  
            <div>
              <p className="about-section-label">Our mission</p>
              <p>
                Reduce manual paperwork, speed up processing, and deliver
                real-time tracking for a better user experience.
              </p>
            </div>
          </div>

        </div>

        {/* Stats row */}
        <div className="about-stats">
          <div className="about-stat">
            <span className="about-stat-number">Reserve</span>
            <span className="about-stat-label">Documents online</span>
          </div>
          <div className="about-stat">
            <span className="about-stat-number">Real-time</span>
            <span className="about-stat-label">Request tracking</span>
          </div>
          <div className="about-stat">
            <span className="about-stat-number">24/7</span>
            <span className="about-stat-label">System availability</span>
          </div>
        </div>

        {/* Bottom — tagline + CTAs */}
        <div className="about-card-bottom">
          <p>
            Serving citizens and local government units with a smarter way
            to manage official documents.
          </p>
          <div className="about-buttons">
            <button className="secondary">Contact Us</button>
            <button className="primary">Learn More</button>
          </div>
        </div>

      </div>
    </section>
  );
}

export default About;