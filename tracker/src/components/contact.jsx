import React from 'react';
import '../css/contact.css';

function Contact() {
  return (
    <footer className="footer">
     <section id='contact'>
      {/* Top section */}
      <div className="footer-top">

        {/* Brand col */}
        <div className="footer-brand">
          <span className="footer-logo">PaperTrail</span>
          <p>
            Reserve your barangay documents online and pick them up
            once they're processed and ready — no more long lines.
          </p>
        </div>

        {/* Follow Us */}
        <div className="footer-col">
          <h4>Follow Us</h4>
          <ul>
            <li><a href="#">Facebook — PaperTrail Digital Solutions</a></li>
            <li><a href="#">Instagram — PaperTrail Digital Solutions</a></li>
            <li><a href="#">Twitter/X — PaperTrail Digital Solutions</a></li>
            <li><a href="#">YouTube — PaperTrail Digital Solutions</a></li>
          </ul>
        </div>

        {/* Contact info */}
        <div className="footer-col">
          <h4>Contact Us</h4>
          <ul className="footer-contact-list">
            <li>
              <span className="footer-contact-label">Email</span>
              papertrail@barangay.gov.ph
            </li>
            <li>
              <span className="footer-contact-label">Phone</span>
              (075) 123-4567
            </li>
            <li>
              <span className="footer-contact-label">Address</span>
              Barangay Hall, Dagupan City, Pangasinan
            </li>
            <li>
              <span className="footer-contact-label">Hours</span>
              Mon – Fri, 8:00 AM – 5:00 PM
            </li>
          </ul>
        </div>

      </div>

      {/* Divider */}
      <div className="footer-divider" />

      {/* Bottom bar */}
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} PaperTrail Digital Solutions. All rights reserved.</p>
        <div className="footer-bottom-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Use</a>
        </div>
      </div>
    </section>
    </footer>
  );
}

export default Contact;