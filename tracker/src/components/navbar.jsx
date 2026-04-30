import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import "../css/navbar.css";

export default function Navbar() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setOpen(false);
    navigate("/signin");
  };

  const scrollToServices = () => {
    if (window.location.pathname !== "/") {
      navigate("/");

      setTimeout(() => {
        const services = document.getElementById("services");
        if (services) {
          services.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);

      return;
    }

    const services = document.getElementById("services");
    if (services) {
      services.scrollIntoView({ behavior: "smooth" });
    }
  };

  const goToDashboard = () => {
    if (!user) {
      navigate("/signin");
      return;
    }

    if (user.role === "admin") {
      navigate("/admin");
    } else {
      navigate("/citizen");
    }
  };

  const firstLetter = user?.full_name
    ? user.full_name.charAt(0).toUpperCase()
    : "U";

  return (
    <nav className="navbar">
      <div className="logo" onClick={() => navigate("/")}>
        <img className="img" src="/logo.png" alt="Logo" />
        <span>
          PaperTrail
          <br />
          Digital Solutions
        </span>
      </div>

      <div className="nav-txt">
        <ul>
          <li onClick={() => navigate("/")}>Home</li>
          <li onClick={scrollToServices}>Services</li>
          <li>About</li>
          <li>Contact</li>
        </ul>
      </div>

      <div className="nav-actions">
        {!user ? (
          <button className="btn-signin" onClick={() => navigate("/signin")}>
            Sign In
          </button>
        ) : (
          <div className="profile-container" ref={dropdownRef}>
            <button
              type="button"
              className="profile"
              onClick={() => setOpen(!open)}
            >
              <div className="avatar">{firstLetter}</div>
            </button>

            {open && (
              <div className="dropdown">
                <div className="dropdown-header">
                  <p className="user-name">{user.full_name}</p>
                  <small className="user-email">{user.email}</small>
                </div>

                <hr />

                <p onClick={goToDashboard}>Dashboard</p>

                <p onClick={() => navigate("/profile")}>My Profile</p>

                {user.role === "citizen" && (
                  <p onClick={() => navigate("/documents")}>
                    Request Document
                  </p>
                )}

                <hr />

                <p className="logout" onClick={handleLogout}>
                  Logout
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}