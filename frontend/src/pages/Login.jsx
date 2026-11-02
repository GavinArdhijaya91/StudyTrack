import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api.js";
import { useAuth } from "../AuthContext.jsx";

/** Halaman login. Field sudah terisi akun demo agar mudah dicoba. */
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
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon" aria-hidden="true">🎓</div>
          <div>
            <div className="auth-title">StudyTrack</div>
            <div className="auth-subtitle">Track your tasks. Stay on track.</div>
          </div>
        </div>

        {/* Form */}
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
              autoComplete="email"
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
              autoComplete="current-password"
            />
          </div>
          {error && (
            <p className="error" role="alert">⚠️ {error}</p>
          )}
          <button type="submit" id="btn-login" disabled={loading}>
            {loading ? "Masuk..." : "🚀 Masuk"}
          </button>
        </form>

        {/* Demo Note */}
        <div className="auth-demo-note" role="note">
          💡 Akun demo sudah terisi otomatis. Langsung klik Masuk!
        </div>

        {/* Footer */}
        <p className="auth-footer">
          Belum punya akun?{" "}
          <Link to="/register">Daftar di sini</Link>
        </p>
      </div>
    </div>
  );
}
