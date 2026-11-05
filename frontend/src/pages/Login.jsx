import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api.js";
import { useAuth } from "../AuthContext.jsx";

/**
 * Halaman Masuk Akun (Login) StudyTrack.
 *
 * MENGAPA KODE INI PERLU DITARUH:
 *   Memenuhi Modul 1: Autentikasi dari studi kasus Arkavidia 11.0 (slide 3):
 *   "Mahasiswa dapat masuk ke aplikasi menggunakan email dan password."
 *
 * MENGAPA DIBUAT SEPERTI INI:
 *   1. Form diinisialisasi secara bawaan dengan kredensial akun demo:
 *      Email: `demo@studytrack.test`, Password: `demo1234` sesuai data seed studi kasus (slide 5).
 *      Hal ini mempermudah proses evaluasi seleksi tanpa perlu mengetik berulang kali.
 *   2. Memanfaatkan fungsi `login(token, user)` dari `useAuth()` untuk menyimpan sesi ke `localStorage`
 *      dan langsung mengarahkan mahasiswa ke dashboard `/tasks`.
 *
 * DAMPAK BAGI USER:
 *   Proses masuk berlangsung cepat dan mudah. Jika pengguna salah memasukkan password, pesan kesalahan
 *   deskriptif ditampilkan di bawah formulir tanpa mereset input yang sudah diketik.
 */
export default function Login() {
  const [email, setEmail] = useState("demo@studytrack.test");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      login(res.data.token, res.data.user);
      navigate("/tasks");
    } catch (err) {
      setError(err.response?.data?.error || "Gagal login. Periksa email dan password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        {/* Identitas Brand Aplikasi */}
        <div className="auth-logo">
          <div className="auth-logo-icon" aria-hidden="true">🎓</div>
          <div>
            <div className="auth-title">StudyTrack</div>
            <div className="auth-subtitle">Track your tasks. Stay on track.</div>
          </div>
        </div>

        {/* Formulir Login */}
        <h2 className="auth-form-title">Masuk ke Akun</h2>
        <form onSubmit={handleSubmit} id="form-login" noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="error" role="alert">
              ⚠️ {error}
            </p>
          )}

          <button type="submit" disabled={loading} id="btn-login" style={{ width: "100%", marginTop: 8 }}>
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        {/* Informasi Akun Demo Arkavidia 11.0 untuk Kemudahan Pengujian */}
        <div className="auth-demo-hint">
          <strong>Akun Demo (Arkavidia 11.0):</strong>
          <code>demo@studytrack.test / demo1234</code>
        </div>

        {/* Navigasi Pendaftaran Akun Baru */}
        <div className="auth-footer">
          Belum punya akun? <Link to="/register">Daftar di sini</Link>
        </div>
      </div>
    </div>
  );
}
