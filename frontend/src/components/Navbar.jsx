import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

/** Bilah navigasi atas. Menampilkan menu sesuai status login. */
export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  /** Menghasilkan inisial dari nama pengguna */
  function getInitials(name = "") {
    return name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  }

  return (
    <header className="navbar">
      {/* Branding */}
      <Link to="/" className="navbar-brand" style={{ textDecoration: "none" }}>
        <div className="navbar-logo-wrap" aria-hidden="true">
          🎓
        </div>
        <div>
          <div className="navbar-brand-name">StudyTrack</div>
          <div className="navbar-brand-tagline">Track your tasks. Stay on track.</div>
        </div>
      </Link>

      {/* Navigation */}
      <nav aria-label="Main navigation">
        {user ? (
          <>
            <div className="navbar-divider" aria-hidden="true" />
            <Link
              to="/courses"
              className={`navbar-link${location.pathname === "/courses" ? " active" : ""}`}
            >
              📚 Mata Kuliah
            </Link>
            <Link
              to="/tasks"
              className={`navbar-link${location.pathname === "/tasks" ? " active" : ""}`}
            >
              ✅ Daftar Tugas
            </Link>
            <div className="navbar-divider" aria-hidden="true" />
            <div className="navbar-user-chip">
              <div className="navbar-avatar" aria-hidden="true">
                {getInitials(user.nama)}
              </div>
              <span className="navbar-username">{user.nama}</span>
            </div>
            <button
              className="btn-logout"
              onClick={handleLogout}
              title="Logout dari StudyTrack"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className={`navbar-link${location.pathname === "/login" ? " active" : ""}`}
            >
              Login
            </Link>
            <Link
              to="/register"
              className="btn btn--primary"
              style={{ textDecoration: "none" }}
            >
              Daftar
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
