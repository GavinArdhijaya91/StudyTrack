import React, { useEffect, useState } from "react";
import api from "../api.js";
import Layout from "../components/Layout.jsx";

/**
 * Halaman Mata Kuliah (LMS Style).
 * Mengelola daftar kurikulum mata kuliah, kode perkuliahan, dan dosen pengampu.
 */
export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [name, setName] = useState("");
  const [kode, setKode] = useState("");
  const [dosen, setDosen] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(true);

  async function loadCourses() {
    try {
      const res = await api.get("/courses");
      setCourses(res.data.courses);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCourses();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.post("/courses", { name, kode, dosen });
      setName("");
      setKode("");
      setDosen("");
      loadCourses();
    } catch (err) {
      setError(err.response?.data?.error || "Gagal menambahkan mata kuliah.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (window.confirm("Apakah kamu yakin ingin menghapus mata kuliah ini?")) {
      await api.delete(`/courses/${id}`);
      loadCourses();
    }
  }

  return (
    <Layout>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Mata Kuliah</h1>
        <p className="page-subtitle">
          Daftarkan mata kuliah aktif semester ini untuk mengelompokkan tugas dan proyek akademikmu.
        </p>
      </div>

      {/* Course Stats Card */}
      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--blue" aria-hidden="true">
            📚
          </div>
          <div>
            <div className="stat-card__value">{courses.length}</div>
            <div className="stat-card__label">Total Mata Kuliah Terdaftar</div>
          </div>
        </div>
      </div>

      {/* Form Tambah Mata Kuliah */}
      <div className="form-card">
        <div
          className="form-card__header"
          style={{ cursor: "pointer", userSelect: "none" }}
          onClick={() => setShowForm((prev) => !prev)}
        >
          <div className="form-card__header-icon" aria-hidden="true">
            {showForm ? "➖" : "➕"}
          </div>
          <div className="form-card__header-title">
            Daftarkan Mata Kuliah Baru
          </div>
          <button
            type="button"
            className="btn btn--sm btn--secondary"
            style={{ marginLeft: "auto", border: "none", background: "transparent" }}
            aria-expanded={showForm}
          >
            {showForm ? "Tutup Form ▲" : "Buka Form ▼"}
          </button>
        </div>

        {showForm && (
          <div className="form-card__body">
            <form onSubmit={handleSubmit} id="form-tambah-matkul" noValidate>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="input-nama-matkul">
                    Nama Mata Kuliah *
                  </label>
                  <input
                    id="input-nama-matkul"
                    type="text"
                    placeholder="Contoh: Pemrograman Berorientasi Objek"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="input-kode-matkul">
                    Kode Mata Kuliah <span className="form-label-hint">(opsional)</span>
                  </label>
                  <input
                    id="input-kode-matkul"
                    type="text"
                    placeholder="Contoh: IF2110"
                    value={kode}
                    onChange={(e) => setKode(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="input-dosen">
                  Dosen Pengampu <span className="form-label-hint">(opsional)</span>
                </label>
                <input
                  id="input-dosen"
                  type="text"
                  placeholder="Contoh: Dr. Ir. Inggriani Liem"
                  value={dosen}
                  onChange={(e) => setDosen(e.target.value)}
                />
              </div>

              {error && (
                <p className="error" role="alert">
                  ⚠️ {error}
                </p>
              )}

              <button type="submit" disabled={submitting} id="btn-tambah-matkul">
                {submitting ? "Menyimpan..." : "✚ Tambahkan Mata Kuliah"}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Course List Header */}
      <div className="section-header">
        <span className="section-title">Daftar Mata Kuliah Semester Ini</span>
        <span className="task-count-chip">{courses.length} mata kuliah</span>
      </div>

      {loading ? (
        <div className="loading-wrap" role="status" aria-label="Memuat data mata kuliah">
          <div className="spinner" />
          Memuat mata kuliah...
        </div>
      ) : courses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">🎓</div>
          <div className="empty-state__title">Belum ada mata kuliah yang didaftarkan</div>
          <div className="empty-state__desc">
            Tambahkan mata kuliah pertamamu menggunakan form di atas agar dapat dipilih saat membuat tugas.
          </div>
        </div>
      ) : (
        <div className="courses-grid">
          {courses.map((c) => (
            <article className="course-card" key={c.id} aria-label={`Mata kuliah: ${c.name}`}>
              <div className="course-card__stripe" aria-hidden="true" />
              <div className="course-card__body">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <h3 className="course-card__name">{c.name}</h3>
                  {c.kode && (
                    <span className="course-code-chip">{c.kode}</span>
                  )}
                </div>

                {c.dosen && (
                  <div className="course-card__dosen">
                    <span aria-hidden="true">👨‍🏫</span>
                    {c.dosen}
                  </div>
                )}
              </div>

              <div className="course-card__footer">
                <button
                  id={`delete-course-${c.id}`}
                  className="btn btn--sm btn--danger"
                  onClick={() => handleDelete(c.id)}
                  title={`Hapus mata kuliah ${c.name}`}
                  style={{ width: "100%" }}
                >
                  🗑 Hapus Mata Kuliah
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </Layout>
  );
}
