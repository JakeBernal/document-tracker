import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import "../css/navbar.css";
import NotificationBell from "./notificationbell";

export default function Navbar() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      setUser(null);
      return;
    }

    try {
      setUser(JSON.parse(storedUser));
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
    ? "Super Admin"
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
    if (!user) {
      goTo("/signin");
      return;
    }

    if (isSuperadmin) {
      goTo("/superadmin");
      return;
    }

    if (isAdmin) {
      goTo("/admin");
      return;
    }

    goTo("/citizen");
  };

  const scrollToSection = (id) => {
    setOpen(false);

    if (window.location.pathname !== "/") {
      navigate("/");

      setTimeout(() => {
        const section = document.getElementById(id);

        if (section) {
          section.scrollIntoView({ behavior: "smooth" });
        }
      }, 120);

      return;
    }

    const section = document.getElementById(id);

    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="navbar">
      <button
        type="button"
        className="logo"
        onClick={() => navigate("/")}
        aria-label="Go to homepage"
      >
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
          <button
            type="button"
            className="btn-signin"
            onClick={() => navigate("/signin")}
          >
            Sign In
          </button>
        ) : (
          <>
            <NotificationBell />

            <div className="profile-container" ref={dropdownRef}>
              <button
                type="button"
                className="profile"
                onClick={() => setOpen((prev) => !prev)}
                aria-label="Open account menu"
              >
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
                    </div>
                  </div>

                  <hr />

                  <button
                    type="button"
                    className="dropdown-item"
                    onClick={goToDashboard}
                  >
                    <span className="menu-icon">📊</span>
                    <span className="menu-text">
                      {isSuperadmin
                        ? "Superadmin Dashboard"
                        : isAdmin
                        ? "Admin Dashboard"
                        : "Citizen Dashboard"}
                    </span>
                  </button>

                  {isCitizen && (
                    <>
                      <button
                        type="button"
                        className="dropdown-item"
                        onClick={() => goTo("/documents")}
                      >
                        <span className="menu-icon">📄</span>
                        <span className="menu-text">Request Document</span>
                      </button>

                      <button
                        type="button"
                        className="dropdown-item"
                        onClick={() => goTo("/calendar")}
                      >
                        <span className="menu-icon">📅</span>
                        <span className="menu-text">Pickup Calendar</span>
                      </button>
                    </>
                  )}

                  {isAdminUser && (
                    <>
                      <button
                        type="button"
                        className="dropdown-item"
                        onClick={() => goTo("/calendar")}
                      >
                        <span className="menu-icon">📅</span>
                        <span className="menu-text">Calendar Schedule</span>
                      </button>

                      <button
                        type="button"
                        className="dropdown-item"
                        onClick={() => goTo("/reports")}
                      >
                        <span className="menu-icon">📈</span>
                        <span className="menu-text">Reports</span>
                      </button>

                      <button
                        type="button"
                        className="dropdown-item"
                        onClick={() => goTo("/feedback")}
                      >
                        <span className="menu-icon">⭐</span>
                        <span className="menu-text">Feedback</span>
                      </button>
                    </>
                  )}

                  <hr />

                  <button
                    type="button"
                    className="dropdown-item logout-item"
                    onClick={handleLogout}
                  >
                    <span className="menu-icon">🚪</span>
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