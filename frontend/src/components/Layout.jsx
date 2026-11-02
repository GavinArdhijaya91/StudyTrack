import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

/** Menghasilkan inisial dari nama pengguna. */
function getInitials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/** Format jam digital untuk topbar. */
function useClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

const NAV_ITEMS = [
  { to: "/tasks",   icon: "✅", label: "Daftar Tugas" },
  { to: "/courses", icon: "📚", label: "Mata Kuliah"  },
];

const PAGE_TITLES = {
  "/tasks":   { title: "Daftar Tugas",  crumb: "Tugas" },
  "/courses": { title: "Mata Kuliah",   crumb: "Mata Kuliah" },
};

/**
 * Shell layout dengan sidebar kiri + topbar + konten utama.
 * Digunakan untuk semua halaman yang sudah login.
 */
export default function Layout({ children, overdueCount = 0 }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const clock = useClock();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const pageInfo = PAGE_TITLES[location.pathname] || { title: "StudyTrack", crumb: "Halaman" };

  return (
    <div className="app-shell">
      {/* ===== SIDEBAR ===== */}
      <aside className="sidebar" aria-label="Navigasi utama">
        {/* Brand */}
        <Link to="/tasks" className="sidebar-brand">
          <div className="sidebar-brand-icon" aria-hidden="true">🎓</div>
          <div>
            <div className="sidebar-brand-name">StudyTrack</div>
            <div className="sidebar-brand-sub">Track your tasks.</div>
          </div>
        </Link>

        {/* Navigation */}
        <div className="sidebar-section">Menu</div>
        <nav className="sidebar-nav" aria-label="Menu utama">
          {NAV_ITEMS.map(({ to, icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`sidebar-link${location.pathname === to ? " active" : ""}`}
              aria-current={location.pathname === to ? "page" : undefined}
            >
              <span className="s-icon" aria-hidden="true">{icon}</span>
              {label}
              {to === "/tasks" && overdueCount > 0 && (
                <span className="s-badge" aria-label={`${overdueCount} tugas overdue`}>
                  {overdueCount}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* User + Logout */}
        <div className="sidebar-footer">
          {user && (
            <div className="sidebar-user">
              <div className="sidebar-avatar" aria-hidden="true">
                {getInitials(user.nama)}
              </div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{user.nama}</div>
                <div className="sidebar-user-role">Mahasiswa</div>
              </div>
            </div>
          )}
          <button
            className="sidebar-logout"
            onClick={handleLogout}
            aria-label="Keluar dari StudyTrack"
          >
            <span aria-hidden="true">🚪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* ===== MAIN ===== */}
      <div className="main-wrap">
        {/* Topbar */}
        <header className="topbar" role="banner">
          <div className="topbar-breadcrumb">
            <span>StudyTrack</span>
            <span className="sep" aria-hidden="true">/</span>
            <span className="crumb">{pageInfo.crumb}</span>
          </div>
          <div className="topbar-right">
            <span className="topbar-time" aria-label="Waktu sekarang">
              🕐 {clock}
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content" id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
