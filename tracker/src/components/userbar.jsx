import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import "../css/navbar.css";

export default function Userbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
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
    navigate("/signin");
  };

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

      <div className="nav-actions">
        {!user ? (
          <button className="btn-signin" onClick={() => navigate("/signin")}>
            Sign In
          </button>
        ) : (
          <div className="profile-container" ref={dropdownRef}>
            <div className="profile" onClick={() => setOpen(!open)}>
              <div className="avatar">
                {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            </div>

            {open && (
              <div className="dropdown">
                <div className="dropdown-header">
                  <p className="user-name">{user?.full_name}</p>
                  <small className="user-email">{user?.email}</small>
                </div>

                <hr />

                <p onClick={() => navigate("/profile")}>My Profile</p>
                <p onClick={() => navigate("/request")}>Request Document</p>

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