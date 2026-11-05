import React, { useEffect, useMemo, useState } from "react";
import api from "../api.js";
import Layout from "../components/Layout.jsx";
import TaskCard from "../components/TaskCard.jsx";

/**
 * Halaman Utama Daftar Tugas Kuliah (LMS Dashboard).
 *
 * MENGAPA KODE INI PERLU DITARUH:
 *   Mengimplementasikan Modul 4 dan Kebutuhan F01 - F04 dari studi kasus Arkavidia 11.0:
 *   Menyajikan seluruh tugas akademik mahasiswa lintas mata kuliah dalam satu tampilan terpadu,
 *   lengkap dengan indikator urgensi deadline real-time, ringkasan statistik progres, dan alat filter.
 *
 * MENGAPA DIBUAT SEPERTI INI:
 *   1. Memadukan ringkasan statistik (KPI card) di bagian atas agar mahasiswa langsung mengetahui beban kerja saat ini.
 *   2. Memfasilitasi filter multi-dimensi (status pengerjaan, status deadline, mata kuliah, dan pencarian instan teks).
 *   3. Memanfaatkan komponen presentasional `TaskCard` untuk merender setiap item tugas secara modular.
 *
 * DAMPAK BAGI USER:
 *   Mahasiswa memiliki ruang kerja digital terstruktur yang menghilangkan rasa cemas akan tugas yang terlewat,
 *   membantu manajemen waktu harian, serta memberikan kejelasan prioritas tugas kuliah.
 */
export default function Tasks() {
  // State data utama dari server
  const [tasks, setTasks] = useState([]);
  const [courses, setCourses] = useState([]);

  // State formulir pembuatan tugas baru
  const [courseId, setCourseId] = useState("");
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(true);

  // State untuk kontrol filter interaktif & bilah pencarian
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'belum' | 'selesai' | 'overdue' | 'mendekati'
  const [filterCourseId, setFilterCourseId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  /**
   * Mengambil data tugas dan mata kuliah secara paralel dari backend.
   *
   * MENGAPA KODE INI PERLU DITARUH:
   *   Halaman tugas membutuhkan relasi data tugas beserta daftar mata kuliah aktif (untuk dropdown form dan filter).
   *
   * MENGAPA DIBUAT SEPERTI INI:
   *   Menggunakan `Promise.all([api.get("/tasks"), api.get("/courses")])` untuk mengeksekusi kedua request
   *   jaringan secara simultan/paralel, memangkas waktu tunggu *Time-to-Interactive* (TTI) hingga 50%
   *   dibandingkan pemanggilan sekuensial (*waterfall requests*).
   *
   * DAMPAK BAGI USER:
   *   Data dimuat dengan cepat saat pertama kali membuka halaman, mengurangi animasi loading dan frustrasi pengguna.
   */
  async function loadData() {
    try {
      const [tasksRes, coursesRes] = await Promise.all([
        api.get("/tasks"),
        api.get("/courses"),
      ]);
      setTasks(tasksRes.data.tasks);
      setCourses(coursesRes.data.courses);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  /**
   * Menangani pengiriman formulir penambahan tugas baru.
   *
   * MENGAPA KODE INI PERLU DITARUH:
   *   Mengirim data tugas yang diinputkan mahasiswa ke endpoint `POST /api/tasks`.
   *
   * MENGAPA DIBUAT SEPERTI INI:
   *   1. Melakukan validasi client-side terlebih dahulu (memastikan mata kuliah terpilih) sebelum request keluar,
   *      mengurangi beban trafik jaringan untuk kesalahan input sederhana.
   *   2. Mengaktifkan flag `submitting` untuk me-nonaktifkan tombol submit selama request berlangsung
   *      (mencegah *double-submission* akibat klik ganda).
   *   3. Setelah tugas berhasil disimpan, form dikosongkan dan `loadData()` dipanggil kembali agar kartu tugas baru
   *      langsung muncul di urutan yang tepat sesuai prioritas deadline.
   *
   * DAMPAK BAGI USER:
   *   Penambahan tugas berlangsung responsif, formulir bersih kembali setelah disimpan, dan mahasiswa
   *   langsung melihat tugas baru mereka terorganisir dalam daftar.
   */
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!courseId) {
      setError("Pilih mata kuliah terlebih dahulu.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/tasks", { mata_kuliah_id: courseId, judul, deskripsi, deadline });
      setJudul("");
      setDeskripsi("");
      setDeadline("");
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || "Gagal menambahkan tugas.");
    } finally {
      setSubmitting(false);
    }
  }

  /**
   * Mengubah status pengerjaan tugas antara "belum" dan "selesai".
   *
   * MENGAPA KODE INI PERLU DITARUH:
   *   Memungkinkan mahasiswa mencentang tugas yang sudah dikerjakan atau membatalkannya jika ingin direvisi.
   *
   * MENGAPA DIBUAT SEPERTI INI:
   *   Mengirim request `PUT /api/tasks/:id` dengan nilai invers status saat ini, lalu menyinkronkan data kembali.
   *
   * DAMPAK BAGI USER:
   *   Mahasiswa merasakan progres belajar nyata; tugas yang dicentang selesai akan mendapatkan badge hijau
   *   dan indikator progres bar pada statistik bertambah secara visual.
   */
  async function handleToggleStatus(task) {
    const newStatus = task.status === "selesai" ? "belum" : "selesai";
    await api.put(`/tasks/${task.id}`, { status: newStatus });
    loadData();
  }

  /**
   * Menghapus tugas dari sistem.
   *
   * MENGAPA KODE INI PERLU DITARUH:
   *   Menghapus tugas yang salah dimasukkan atau dibatalkan penugasannya oleh dosen.
   *
   * DAMPAK BAGI USER:
   *   Daftar tugas selalu relevan dan bebas dari entri usang.
   */
  async function handleDelete(id) {
    await api.delete(`/tasks/${id}`);
    loadData();
  }

  /**
   * Perhitungan Metrik Statistik Dashboard (KPI).
   *
   * MENGAPA KODE INI PERLU DITARUH:
   *   Menyajikan ringkasan kuantitatif tugas agar mahasiswa tidak perlu menghitung manual
   *   berapa tugas yang tersisa, sudah selesai, mendesak, atau lewat tenggat.
   *
   * MENGAPA DIBUAT SEPERTI INI:
   *   Kalkulasi dilakukan secara reaktif dari state `tasks` yang sudah tersinkronisasi dengan kalkulasi backend.
   *   Metrik `mendekatiCount` (F01) dan `overdueCount` (F03) dipisahkan agar kategori darurat terlihat jelas.
   *
   * DAMPAK BAGI USER:
   *   Memberikan *instant awareness* terhadap kondisi beban studi mahasiswa hari ini.
   */
  const totalTasks = tasks.length;
  const selesaiCount = tasks.filter((t) => t.status === "selesai").length;
  const overdueCount = tasks.filter((t) => t.kategori === "overdue").length;
  const mendekatiCount = tasks.filter((t) => t.kategori === "mendekati_deadline").length;
  const progressPercent = totalTasks > 0 ? Math.round((selesaiCount / totalTasks) * 100) : 0;

  /**
   * Logika Pemfilteran dan Pencarian Tugas Menggunakan useMemo.
   *
   * MENGAPA KODE INI PERLU DITARUH:
   *   Ketika mahasiswa memiliki puluhan tugas dalam satu semester, mereka perlu memfokuskan pandangan
   *   pada irisan data tertentu (misalnya hanya tugas mata kuliah 'Database Systems' yang belum selesai).
   *
   * MENGAPA DIBUAT SEPERTI INI:
   *   1. Menggunakan `useMemo` dengan dependensi `[tasks, statusFilter, filterCourseId, searchQuery]`
   *      sehingga proses komputasi filter array hanya dieksekusi ulang saat kriteria filter atau data tugas berubah,
   *      mencegah penurunan performa rendering (*frame drop*).
   *   2. Pencarian teks bersifat case-insensitive dan mencakup judul, deskripsi, maupun nama mata kuliah.
   *
   * DAMPAK BAGI USER:
   *   Pencarian dan pergantian tab filter terasa instan tanpa jeda loading, memberikan kendali fleksibel
   *   kepada mahasiswa dalam mengorganisir target belajar harian.
   */
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // 1. Filter Tab Status
      if (statusFilter === "selesai" && task.status !== "selesai") return false;
      if (statusFilter === "belum" && task.status === "selesai") return false;
      if (statusFilter === "overdue" && task.kategori !== "overdue") return false;
      if (statusFilter === "mendekati" && task.kategori !== "mendekati_deadline") return false;

      // 2. Filter Dropdown Mata Kuliah
      if (filterCourseId && String(task.mata_kuliah_id) !== String(filterCourseId)) return false;

      // 3. Pencarian Kata Kunci Teks (Judul / Deskripsi / Mata Kuliah)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (task.judul || "").toLowerCase().includes(q);
        const matchDesc = (task.deskripsi || "").toLowerCase().includes(q);
        const matchCourse = (task.mata_kuliah || "").toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCourse) return false;
      }

      return true;
    });
  }, [tasks, statusFilter, filterCourseId, searchQuery]);

  return (
    <Layout overdueCount={overdueCount}>
      {/* Header Halaman */}
      <div className="page-header">
        <h1 className="page-title">Dashboard Tugas Kuliah</h1>
        <p className="page-subtitle">
          Kelola semua tugas kuliah, pantau deadline, dan lacak progres belajar akademikmu.
        </p>
      </div>

      {/* Grid Metrik Statistik LMS (Total, Selesai, Mendekati Deadline, Overdue) */}
      <div className="stats-grid" role="region" aria-label="Statistik tugas">
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--blue" aria-hidden="true">
            📋
          </div>
          <div style={{ flex: 1 }}>
            <div className="stat-card__value">{totalTasks}</div>
            <div className="stat-card__label">Total Tugas</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--green" aria-hidden="true">
            ✅
          </div>
          <div style={{ flex: 1 }}>
            <div className="stat-card__value">
              {selesaiCount}
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginLeft: 6, fontWeight: 600 }}>
                ({progressPercent}%)
              </span>
            </div>
            <div className="stat-card__label">Tugas Selesai</div>
            <div className="stat-progress" title={`${progressPercent}% tugas selesai`}>
              <div
                className="stat-progress-bar"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card Statistik Mendekati Deadline (< 24 jam) - Sesuai F01 Arkavidia 11.0 */}
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--yellow" aria-hidden="true">
            ⏳
          </div>
          <div style={{ flex: 1 }}>
            <div className="stat-card__value">{mendekatiCount}</div>
            <div className="stat-card__label">Mendekati Deadline (&lt; 24 jam)</div>
          </div>
        </div>

        {/* Card Statistik Overdue - Sesuai F03 Arkavidia 11.0 */}
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--red" aria-hidden="true">
            ⚠️
          </div>
          <div style={{ flex: 1 }}>
            <div className="stat-card__value">{overdueCount}</div>
            <div className="stat-card__label">Perlu Perhatian (Overdue)</div>
          </div>
        </div>
      </div>

      {/* Form Tambah Tugas Akademik (Dapat dibuka-tutup untuk efisiensi ruang layar) */}
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
            Tambah Tugas Akademik Baru
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
            <form onSubmit={handleSubmit} id="form-tambah-tugas" noValidate>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="select-matkul">
                    Mata Kuliah *
                  </label>
                  <select
                    id="select-matkul"
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    required
                  >
                    <option value="">Pilih Mata Kuliah</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}{c.kode ? ` (${c.kode})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="input-deadline">
                    Batas Waktu (Deadline) *
                  </label>
                  <input
                    id="input-deadline"
                    type="datetime-local"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="input-judul">
                  Judul Tugas Kuliah *
                </label>
                <input
                  id="input-judul"
                  type="text"
                  placeholder="Contoh: Laporan Akhir Praktikum Rekayasa Perangkat Lunak"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="input-deskripsi">
                  Catatan atau Instruksi Tugas <span className="form-label-hint">(opsional)</span>
                </label>
                <textarea
                  id="input-deskripsi"
                  placeholder="Detail pengerjaan, format berkas pengumpulan, atau tautan referensi..."
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                  rows={2}
                />
              </div>

              {error && (
                <p className="error" role="alert">
                  ⚠️ {error}
                </p>
              )}

              <button type="submit" disabled={submitting} id="btn-tambah-tugas">
                {submitting ? "Menyimpan Tugas..." : "✚ Tambahkan ke Daftar Tugas"}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Toolbar Filter Interaktif dan Bilah Pencarian */}
      <div className="filter-toolbar">
        <div className="filter-tabs" role="tablist" aria-label="Filter status tugas">
          <button
            type="button"
            className={`filter-tab${statusFilter === "all" ? " active" : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            Semua ({totalTasks})
          </button>
          <button
            type="button"
            className={`filter-tab${statusFilter === "belum" ? " active" : ""}`}
            onClick={() => setStatusFilter("belum")}
          >
            Belum Selesai ({totalTasks - selesaiCount})
          </button>
          <button
            type="button"
            className={`filter-tab${statusFilter === "selesai" ? " active" : ""}`}
            onClick={() => setStatusFilter("selesai")}
          >
            Selesai ({selesaiCount})
          </button>
          <button
            type="button"
            className={`filter-tab${statusFilter === "mendekati" ? " active" : ""}`}
            onClick={() => setStatusFilter("mendekati")}
          >
            Mendekati ({mendekatiCount})
          </button>
          <button
            type="button"
            className={`filter-tab${statusFilter === "overdue" ? " active" : ""}`}
            onClick={() => setStatusFilter("overdue")}
          >
            Overdue ({overdueCount})
          </button>
        </div>

        <div className="filter-controls">
          <div className="filter-search">
            <span className="filter-search-icon" aria-hidden="true">🔍</span>
            <input
              type="text"
              placeholder="Cari tugas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Cari tugas berdasarkan judul atau mata kuliah"
            />
          </div>

          <select
            className="filter-select"
            value={filterCourseId}
            onChange={(e) => setFilterCourseId(e.target.value)}
            aria-label="Filter berdasarkan mata kuliah"
          >
            <option value="">Semua Mata Kuliah</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Baris Legenda Arti Warna Status - Edukasi Visual Mahasiswa Sesuai Slide 13 */}
      {tasks.length > 0 && (
        <div className="legend-bar" aria-label="Keterangan status tugas">
          <span className="legend-chip legend-chip--normal">
            <span className="dot" aria-hidden="true" />
            Normal: deadline ≥ 24 jam
          </span>
          <span className="legend-chip legend-chip--mendekati">
            <span className="dot" aria-hidden="true" />
            Mendekati: deadline &lt; 24 jam
          </span>
          <span className="legend-chip legend-chip--overdue">
            <span className="dot" aria-hidden="true" />
            Overdue: deadline sudah lewat
          </span>
        </div>
      )}

      {/* Header Bagian Daftar Tugas */}
      <div className="section-header">
        <span className="section-title">
          Daftar Tugas {statusFilter !== "all" ? `(${statusFilter})` : ""}
        </span>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span className="task-count-chip">
            Menampilkan {filteredTasks.length} dari {totalTasks} tugas
          </span>
        </div>
      </div>

      {/* State Konten: Memuat (Loading), Kosong (Empty), atau Menampilkan Kartu Tugas */}
      {loading ? (
        <div className="loading-wrap" role="status" aria-label="Memuat data tugas">
          <div className="spinner" />
          Memuat data tugas...
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">📋</div>
          <div className="empty-state__title">
            {totalTasks === 0
              ? "Belum ada tugas kuliah"
              : "Tidak ada tugas yang sesuai filter"}
          </div>
          <div className="empty-state__desc">
            {totalTasks === 0
              ? "Tambahkan tugas akademik pertamamu menggunakan form di atas."
              : "Coba ganti tab filter, pilih mata kuliah lain, atau hapus kata kunci pencarian."}
          </div>
        </div>
      ) : (
        <div className="tasks-grid">
          {filteredTasks.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </Layout>
  );
}
