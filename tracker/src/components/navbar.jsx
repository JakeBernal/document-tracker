import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import "../css/citizen.css";

export default function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
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
    navigate("/signin");
  };

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="navbar">

      {/* LOGO */}
      <div className="logo" onClick={() => navigate("/")}>
        <img className="img" src="/logo.png" alt="Logo" />
        PaperTrail<br />
        Digital Solutions
      </div>

      {/* NAV LINKS */}
      <div className="nav-txt">
        <ul>
          <li onClick={() => navigate("/")}>Home</li>
          <li onClick={() => scrollToSection("services")}>Services</li>
          <li>About</li>
          <li>Contact</li>
        </ul>
      </div>

      {/* RIGHT SIDE */}
      <div className="nav-actions">

        {!user ? (
          <button
            className="btn-signin"
            onClick={() => navigate("/signin")}
          >
            Sign In
          </button>
        ) : (
          <div className="profile-container" ref={dropdownRef}>

            {/* AVATAR */}
            <div
              className="profile"
              onClick={() => setOpen(!open)}
            >
              <div className="avatar">
                {user?.full_name?.charAt(0) || "U"}
              </div>
            </div>

            {/* DROPDOWN */}
            {open && (
              <div className="dropdown">

                <div className="dropdown-header">
                  <p className="user-name">{user?.full_name}</p>
                  <small className="user-email">{user?.email}</small>
                </div>

                <hr />

                <p onClick={() => navigate("/profile")}>
                  My Profile
                </p>

                <p onClick={() => navigate("/request")}>
                  Request Document
                </p>

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