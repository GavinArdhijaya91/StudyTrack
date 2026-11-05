import React, { useEffect, useState } from "react";
import api from "../api.js";
import Layout from "../components/Layout.jsx";

/**
 * Halaman Manajemen Mata Kuliah (LMS Style).
 *
 * MENGAPA KODE INI PERLU DITARUH:
 *   Mengimplementasikan Modul 2 dari studi kasus Arkavidia 11.0 (slide 3):
 *   "Mahasiswa dapat menambahkan mata kuliah yang sedang diambil pada semester berjalan."
 *   Mata kuliah berfungsi sebagai entitas induk (*parent entity*) yang memayungi tugas-tugas kuliah.
 *
 * MENGAPA DIBUAT SEPERTI INI:
 *   1. Menyajikan daftar mata kuliah aktif lengkap dengan kode mata kuliah (contoh: "CS 186")
 *      dan dosen pengampu (contoh: "Dr. Andi Wijaya") sesuai Bagian 1 studi kasus (slide 4).
 *   2. Memungkinkan penambahan mata kuliah baru dan penghapusan mata kuliah yang sudah tidak aktif.
 *
 * DAMPAK BAGI USER:
 *   Mahasiswa dapat menyusun direktori kurikulum semester mereka dengan rapi, sehingga saat membuat
 *   tugas baru di dashboard, mata kuliah terkait sudah tersedia di menu pilihan.
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

  /**
   * Mengambil data seluruh mata kuliah milik pengguna dari backend.
   *
   * MENGAPA KODE INI PERLU DITARUH:
   *   Mengambil daftar kurikulum terkini dari endpoint `GET /api/courses`.
   *
   * DAMPAK BAGI USER:
   *   Data mata kuliah selalu tersinkronisasi dan langsung tampil saat mahasiswa membuka halaman ini.
   */
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

  /**
   * Menangani submit form penambahan mata kuliah.
   *
   * MENGAPA KODE INI PERLU DITARUH:
   *   Mendaftarkan mata kuliah baru ke sistem via `POST /api/courses`.
   *
   * MENGAPA DIBUAT SEPERTI INI:
   *   1. Mengunci tombol submit dengan flag `submitting` untuk mencegah double click.
   *   2. Mengosongkan field input setelah penyimpanan berhasil agar siap digunakan kembali.
   *
   * DAMPAK BAGI USER:
   *   Penambahan mata kuliah berlangsung instan, dan mata kuliah yang baru ditambah langsung
   *   dapat dipilih saat membuat tugas kuliah di halaman dashboard.
   */
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

  /**
   * Menghapus mata kuliah dari kurikulum mahasiswa.
   *
   * MENGAPA KODE INI PERLU DITARUH:
   *   Memberikan kontrol kepada mahasiswa untuk membatalkan mata kuliah yang di-drop.
   *
   * MENGAPA DIBUAT SEPERTI INI:
   *   Menyertakan modal konfirmasi `window.confirm` browser sebelum request `DELETE /api/courses/:id` dikirim.
   *   Hal ini penting karena penghapusan mata kuliah memicu Cascade Delete pada backend yang menghapus
   *   seluruh tugas di dalamnya.
   *
   * DAMPAK BAGI USER:
   *   Mencegah hilangnya tugas-tugas penting secara tidak sengaja (*accidental deletion protection*).
   */
  async function handleDelete(id) {
    if (window.confirm("Apakah kamu yakin ingin menghapus mata kuliah ini? Seluruh tugas terkait juga akan terhapus.")) {
      await api.delete(`/courses/${id}`);
      loadCourses();
    }
  }

  return (
    <Layout>
      {/* Header Halaman Mata Kuliah */}
      <div className="page-header">
        <h1 className="page-title">Mata Kuliah</h1>
        <p className="page-subtitle">
          Daftarkan mata kuliah aktif semester ini untuk mengelompokkan tugas dan proyek akademikmu.
        </p>
      </div>

      {/* Ringkasan Statistik Jumlah Mata Kuliah */}
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

      {/* Formulir Pendaftaran Mata Kuliah Baru */}
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
                    placeholder="Contoh: CS 186"
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
                  placeholder="Contoh: Dr. Andi Wijaya"
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

      {/* Header Bagian Daftar Mata Kuliah */}
      <div className="section-header">
        <span className="section-title">Daftar Mata Kuliah Semester Ini</span>
        <span className="task-count-chip">{courses.length} mata kuliah</span>
      </div>

      {/* Kondisi Tampilan: Memuat, Kosong, atau Grid Kartu Mata Kuliah */}
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
