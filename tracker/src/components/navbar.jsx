import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import "../css/navbar.css";
import NotificationBell from "./notificationbell";

export default function Navbar() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [verificationStatus, setVerificationStatus] =
    useState("Not Verified");

  const dropdownRef = useRef(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!storedUser) {
      setUser(null);
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      if (parsedUser.role === "citizen" && token) {
        fetch("http://localhost:5001/api/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
          .then((res) => res.json())
          .then((data) => {
            setVerificationStatus(
              data?.profile?.verification_status || "Not Verified"
            );
          })
          .catch(() => {
            setVerificationStatus("Not Verified");
          });
      }
    } catch (error) {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      setUser(null);
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

  const isCitizen = user?.role === "citizen";
  const isAdmin = user?.role === "admin";
  const isSuperadmin = user?.role === "superadmin";
  const isAdminUser = isAdmin || isSuperadmin;

  const firstLetter = user?.full_name
    ? user.full_name.charAt(0).toUpperCase()
    : "U";

  const displayRole = isSuperadmin
    ? "Superadmin"
    : isAdmin
    ? "Admin"
    : "Citizen";

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setOpen(false);
    navigate("/signin", { replace: true });
  };

  const goTo = (path) => {
    setOpen(false);
    navigate(path);
  };

  const goToDashboard = () => {
    if (!user) return goTo("/signin");
    if (isSuperadmin) return goTo("/superadmin");
    if (isAdmin) return goTo("/admin");
    goTo("/citizen");
  };

  const scrollToSection = (id) => {
    setOpen(false);

    if (window.location.pathname !== "/") {
      navigate("/");

      setTimeout(() => {
        const section = document.getElementById(id);
        if (section) section.scrollIntoView({ behavior: "smooth" });
      }, 120);

      return;
    }

    const section = document.getElementById(id);
    if (section) section.scrollIntoView({ behavior: "smooth" });
  };

  // ===== MINIMAL ICONS =====
  const Icon = {
    dashboard: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M3 13h8V3H3v10zm10 8h8V3h-8v18zM3 21h8v-6H3v6z" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    user: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M20 21a8 8 0 10-16 0" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    file: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2" />
        <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    calendar: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M3 5h18M7 3v4M17 3v4M4 9h16v12H4V9z" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    chart: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M4 19V5M10 19V9M16 19V13M22 19H2" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    star: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 17l-5.5 3 1-6L3 9l6-.5L12 3l3 5.5 6 .5-4.5 4.5 1 6z" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    logout: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M10 17l5-5-5-5" stroke="currentColor" strokeWidth="2" />
        <path d="M15 12H3" stroke="currentColor" strokeWidth="2" />
        <path d="M21 3v18" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  };

  return (
    <nav className="navbar">
      <button className="logo" onClick={() => navigate("/")}>
        <img className="img" src="/logo.png" alt="PaperTrail logo" />
        <span>
          PaperTrail
          <br />
          Digital Solutions
        </span>
      </button>

      <div className="nav-txt">
        <ul>
          <li onClick={() => navigate("/")}>Home</li>
          <li onClick={() => scrollToSection("services")}>Services</li>
          <li onClick={() => scrollToSection("about")}>About</li>
          <li onClick={() => scrollToSection("contact")}>Contact</li>
        </ul>
      </div>

      <div className="nav-actions">
        {!user ? (
          <button className="btn-signin" onClick={() => navigate("/signin")}>
            Sign In
          </button>
        ) : (
          <>
            <NotificationBell />

            <div className="profile-container" ref={dropdownRef}>
              <button className="profile" onClick={() => setOpen(!open)}>
                <div className="avatar">{firstLetter}</div>
              </button>

              {open && (
                <div className="dropdown">
                  <div className="dropdown-header">
                    <div className="dropdown-avatar">{firstLetter}</div>
                    <div className="dropdown-user-info">
                      <p className="user-name">{user.full_name}</p>
                      <small className="user-email">{user.email}</small>
                      <span className="role-badge">{displayRole}</span>
                      {isCitizen && (
                        <span className="role-badge">{verificationStatus}</span>
                      )}
                    </div>
                  </div>

                  <hr />

                  <button className="dropdown-item" onClick={goToDashboard}>
                    <span className="menu-icon">{Icon.dashboard}</span>
                    <span className="menu-text">
                      {isSuperadmin ? "Superadmin Dashboard" : isAdmin ? "Admin Dashboard" : "Citizen Dashboard"}
                    </span>
                  </button>

                  {isCitizen && (
                    <>
                      <button className="dropdown-item" onClick={() => goTo("/profile")}>
                        <span className="menu-icon">{Icon.user}</span>
                        <span className="menu-text">Profile Verification</span>
                      </button>

                      <button className="dropdown-item" onClick={() => goTo("/documents")}>
                        <span className="menu-icon">{Icon.file}</span>
                        <span className="menu-text">Request Document</span>
                      </button>

                      <button className="dropdown-item" onClick={() => goTo("/calendar")}>
                        <span className="menu-icon">{Icon.calendar}</span>
                        <span className="menu-text">Pickup Calendar</span>
                      </button>
                    </>
                  )}

                  {isAdminUser && (
                    <>
                      {isSuperadmin && (
                        <button className="dropdown-item" onClick={() => goTo("/superadmin")}>
                          <span className="menu-icon">{Icon.dashboard}</span>
                          <span className="menu-text">Superadmin Panel</span>
                        </button>
                      )}

                      <button className="dropdown-item" onClick={() => goTo("/admin")}>
                        <span className="menu-icon">{Icon.dashboard}</span>
                        <span className="menu-text">Manage Requests</span>
                      </button>

                      <button className="dropdown-item" onClick={() => goTo("/calendar")}>
                        <span className="menu-icon">{Icon.calendar}</span>
                        <span className="menu-text">Calendar Schedule</span>
                      </button>

                      <button className="dropdown-item" onClick={() => goTo("/reports")}>
                        <span className="menu-icon">{Icon.chart}</span>
                        <span className="menu-text">Reports</span>
                      </button>

                      <button className="dropdown-item" onClick={() => goTo("/feedback")}>
                        <span className="menu-icon">{Icon.star}</span>
                        <span className="menu-text">Feedback</span>
                      </button>
                    </>
                  )}

                  <hr />

                  <button className="dropdown-item logout-item" onClick={handleLogout}>
                    <span className="menu-icon">{Icon.logout}</span>
                    <span className="menu-text">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </nav>
  );
}