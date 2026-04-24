import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import "../css/citizen.css";

export default function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/signin");
  };

  return (
    <nav className="navbar">
      {/* LOGO */}
      <div className="logo">
        <img className="img" src="/logo.png" alt="Logo" />
        PaperTrail<br />
        Digital Solutions
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
            <div className="profile-container">
            <div
              className="profile"
              onClick={() => setOpen(!open)}
              >
              <div className="avatar">
                {user?.name?.charAt(0) || "U"}
                {/* <h1>{user?.name || "User"}</h1> */}
              </div>
            </div>

            {open && (
              <div className="dropdown">
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