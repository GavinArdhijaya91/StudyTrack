import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

/**
 * Menghasilkan inisial nama pengguna (maksimal 2 huruf) untuk avatar profil.
 *
 * MENGAPA KODE INI PERLU DITARUH:
 *   Memberikan personalisasi visual tanpa memerlukan penyimpanan berkas gambar avatar yang berat.
 *
 * DAMPAK BAGI USER:
 *   Mahasiswa merasa dikenali di platform dengan profil avatar personal di sudut kiri bawah sidebar.
 */
function getInitials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/**
 * Custom Hook untuk menyajikan jam digital real-time pada topbar.
 *
 * MENGAPA KODE INI PERLU DITARUH:
 *   Sesuai kebutuhan F01 & F02 pada studi kasus Arkavidia 11.0, reminder deadline bergantung pada
 *   waktu aktual saat ini (`NOW()`). Menampilkan jam di topbar memberi jangkar waktu bagi mahasiswa.
 *
 * MENGAPA DIBUAT SEPERTI INI:
 *   Interval 1 detik menyinkronkan jam lokal pengguna secara terus-menerus.
 *
 * DAMPAK BAGI USER:
 *   Mahasiswa selalu sadar akan waktu saat ini ketika membandingkan sisa waktu menuju deadline tugas kuliah.
 */
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
 * Shell Layout LMS Terpadu (Sidebar Kiri + Topbar + Konten Utama).
 *
 * MENGAPA KODE INI PERLU DITARUH:
 *   Sebagai bingkai navigasi konsisten untuk seluruh halaman setelah login, menciptakan pengalaman
 *   Learning Management System (LMS) modern yang profesional.
 *
 * MENGAPA DIBUAT SEPERTI INI:
 *   1. Menyertakan badge merah `overdueCount` pada tautan sidebar "Daftar Tugas".
 *      Bahkan saat mahasiswa sedang berada di halaman Mata Kuliah, mereka tetap diingatkan jika ada tugas
 *      yang overdue dan butuh perhatian segera.
 *   2. Memfasilitasi breadcrumb dan penunjuk halaman aktif secara dinamis sesuai `location.pathname`.
 *   3. Memiliki tombol logout yang mudah diakses dengan konfirmasi navigasi ke halaman login.
 *
 * DAMPAK BAGI USER:
 *   Pengalaman navigasi antar-modul terasa intuitif, cepat, dan mahasiswa tidak pernah kehilangan
 *   konteks urgensi tugas kuliah di mana pun mereka berada di dalam aplikasi.
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
      {/* ===== SIDEBAR NAVIGASI UTAMA ===== */}
      <aside className="sidebar" aria-label="Navigasi utama">
        {/* Brand & Identitas Aplikasi */}
        <Link to="/tasks" className="sidebar-brand">
          <div className="sidebar-brand-icon" aria-hidden="true">🎓</div>
          <div>
            <div className="sidebar-brand-name">StudyTrack</div>
            <div className="sidebar-brand-sub">Track your tasks.</div>
          </div>
        </Link>

        {/* Menu Navigasi Modul */}
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
              {/* Badge penanda tugas overdue di menu sidebar untuk atensi global */}
              {to === "/tasks" && overdueCount > 0 && (
                <span className="s-badge" aria-label={`${overdueCount} tugas overdue`}>
                  {overdueCount}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Info Mahasiswa yang Sedang Login & Tombol Logout */}
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

      {/* ===== AREA KONTEN UTAMA DENGAN TOPBAR ===== */}
      <div className="main-wrap">
        {/* Topbar dengan Breadcrumb dan Jam Digital */}
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

        {/* Area Konten Dinamis Halaman */}
        <main className="page-content" id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
