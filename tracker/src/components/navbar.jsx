
import { useNavigate } from "react-router-dom";
import "../css/navbar.css";

export default function navbar() {
  const navigate = useNavigate();
  

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" }); // smooth scrolling
    }
  };


  return (
  <nav className="navbar">
    <div className="logo">
     <img className="img" src={'logo.png'} alt="Logo" />
     PaperTrail<br></br>
     Digital Solutions
   </div>
   <div className="nav-txt">
    <ul>
     <li onClick={() => navigate("/")}>Home </li>
     <li onClick={() => scrollToSection("services")}>Services</li>
     <li>About</li>
     <li>Contact</li>
    </ul>
   </div>
  <div className="nav-actions">
      <button className="btn-signin" onClick={() => navigate("/signin")}>Sign In</button>
  </div>
</nav>
  )
}
