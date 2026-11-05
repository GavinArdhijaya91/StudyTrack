import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./AuthContext.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Courses from "./pages/Courses.jsx";
import Tasks from "./pages/Tasks.jsx";

/**
 * Komponen Pembungkus Route Terproteksi (*Route Guard*).
 *
 * MENGAPA KODE INI PERLU DITARUH:
 *   Mencegah akses ilegal ke halaman internal aplikasi (Daftar Tugas dan Mata Kuliah)
 *   oleh pengguna yang belum terotentikasi.
 *
 * MENGAPA DIBUAT SEPERTI INI:
 *   1. Memeriksa state `loading` dari `useAuth()`. Jika proses verifikasi token sedang berlangsung,
 *      komponen menampilkan indikator loading ringan agar tidak terjadi lonjakan (*flicker*) ke rute login.
 *   2. Jika verifikasi selesai dan `user` bernilai `null`, request langsung dialihkan via `<Navigate to="/login" replace />`.
 *      Penggunaan opsi `replace` mencegah pengguna terjebak dalam loop tombol 'Back' browser.
 *
 * DAMPAK BAGI USER:
 *   Data privasi akademik mahasiswa aman dari intipan orang lain saat mengakses URL langsung.
 */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="container" style={{ padding: "2rem", textAlign: "center" }}>Memuat sesi...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

/**
 * Definisi Tabel Navigasi & Rute Aplikasi StudyTrack.
 *
 * MENGAPA KODE INI PERLU DITARUH:
 *   Mengatur pemetaan URL browser ke komponen halaman yang sesuai.
 *
 * MENGAPA DIBUAT SEPERTI INI:
 *   1. Rute akar `/` diarahkan langsung (*redirect*) ke `/tasks` sebagai halaman beranda utama (dashboard).
 *   2. Memisahkan rute publik (`/login`, `/register`) dan rute privat (`/courses`, `/tasks`).
 *
 * DAMPAK BAGI USER:
 *   Navigasi URL browser terasa alami (*Single Page Application* tanpa reload halaman),
 *   dan mahasiswa langsung diarahkan ke daftar tugas mereka saat membuka alamat situs.
 */
function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/courses"
        element={
          <ProtectedRoute>
            <Courses />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks"
        element={
          <ProtectedRoute>
            <Tasks />
          </ProtectedRoute>
        }
      />
      {/* Fallback rute akar otomatis membawa mahasiswa ke dashboard tugas */}
      <Route path="/" element={<Navigate to="/tasks" replace />} />
    </Routes>
  );
}

/**
 * Root Component Aplikasi StudyTrack.
 *
 * MENGAPA KODE INI PERLU DITARUH:
 *   Sebagai kontainer tertinggi yang membungkus seluruh hierarki rute aplikasi dengan `AuthProvider`.
 */
export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
