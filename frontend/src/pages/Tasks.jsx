import React, { useEffect, useMemo, useState } from "react";
import api from "../api.js";
import Layout from "../components/Layout.jsx";
import TaskCard from "../components/TaskCard.jsx";

/**
 * Halaman Utama Tugas Kuliah (LMS Style).
 * Mengintegrasikan statistik dashboard, pencarian, filter mata kuliah & status,
 * serta penambahan dan manajemen tugas kuliah.
 */
export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [deadline, setDeadline] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(true);

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'belum' | 'selesai' | 'overdue' | 'mendekati'
  const [filterCourseId, setFilterCourseId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

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

  async function handleToggleStatus(task) {
    const newStatus = task.status === "selesai" ? "belum" : "selesai";
    await api.put(`/tasks/${task.id}`, { status: newStatus });
    loadData();
  }

  async function handleDelete(id) {
    await api.delete(`/tasks/${id}`);
    loadData();
  }

  // Dashboard Stats Calculations
  const totalTasks = tasks.length;
  const selesaiCount = tasks.filter((t) => t.status === "selesai").length;
  const overdueCount = tasks.filter((t) => t.kategori === "overdue").length;
  const mendekatiCount = tasks.filter((t) => t.kategori === "mendekati_deadline").length;
  const progressPercent = totalTasks > 0 ? Math.round((selesaiCount / totalTasks) * 100) : 0;

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Status filter
      if (statusFilter === "selesai" && task.status !== "selesai") return false;
      if (statusFilter === "belum" && task.status === "selesai") return false;
      if (statusFilter === "overdue" && task.kategori !== "overdue") return false;
      if (statusFilter === "mendekati" && task.kategori !== "mendekati_deadline") return false;

      // Course filter
      if (filterCourseId && String(task.mata_kuliah_id) !== String(filterCourseId)) return false;

      // Search query filter
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
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Dashboard Tugas Kuliah</h1>
        <p className="page-subtitle">
          Kelola semua tugas kuliah, pantau deadline, dan lacak progres belajar akademikmu.
        </p>
      </div>

      {/* LMS Stats Cards Grid */}
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

        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--yellow" aria-hidden="true">
            ⏳
          </div>
          <div style={{ flex: 1 }}>
            <div className="stat-card__value">{mendekatiCount}</div>
            <div className="stat-card__label">Mendekati Deadline (&lt; 24 jam)</div>
          </div>
        </div>

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

      {/* Form Tambah Tugas Card */}
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

      {/* Filter and Search Toolbar */}
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

      {/* Legend Bar */}
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

      {/* Task List Header */}
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

      {/* Content State */}
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
