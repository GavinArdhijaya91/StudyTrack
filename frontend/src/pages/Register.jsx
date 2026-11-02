import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api.js";
import { useAuth } from "../AuthContext.jsx";

/** Halaman pendaftaran akun baru. Setelah berhasil, pengguna langsung login. */
export default function Register() {
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/register", { nama, email, password });
      login(res.data.token, res.data.user);
      navigate("/tasks");
    } catch (err) {
      setError(err.response?.data?.error || "Gagal mendaftar. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon" aria-hidden="true">🎓</div>
          <div>
            <div className="auth-title">StudyTrack</div>
            <div className="auth-subtitle">Track your tasks. Stay on track.</div>
          </div>
        </div>

        {/* Form */}
        <h2 className="auth-form-title">Buat Akun Baru</h2>
        <form onSubmit={handleSubmit} id="form-register" noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="register-nama">Nama Lengkap</label>
            <input
              id="register-nama"
              type="text"
              placeholder="Nama Lengkapmu"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              required
              autoComplete="name"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="register-email">Email</label>
            <input
              id="register-email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="register-password">Password <span style={{ opacity: 0.6, fontWeight: 400 }}>(min. 6 karakter)</span></label>
            <input
              id="register-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          {error && (
            <p className="error" role="alert">⚠️ {error}</p>
          )}
          <button type="submit" id="btn-register" disabled={loading}>
            {loading ? "Membuat akun..." : "✨ Buat Akun"}
          </button>
        </form>

        {/* Footer */}
        <p className="auth-footer">
          Sudah punya akun?{" "}
          <Link to="/login">Login di sini</Link>
        </p>
      </div>
    </div>
  );
}
