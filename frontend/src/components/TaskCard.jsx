import React from "react";

/**
 * Memformat deadline ke tampilan lokal Indonesia, contoh: "03 Jul 2026, 23.59".
 *
 * @param {string} deadline Tanggal dan jam deadline dari API.
 * @returns {string}
 */
function formatDeadline(deadline) {
  const d = new Date(deadline);
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Mengembalikan konfigurasi tampilan berdasarkan kategori tugas.
 *
 * @param {"normal"|"mendekati_deadline"|"overdue"} kategori
 */
function getKategoriConfig(kategori) {
  if (kategori === "mendekati_deadline") {
    return {
      cardClass: "task-card--mendekati",
      stripeClass: "task-card__top-stripe--mendekati",
      badgeClass: "status-badge--mendekati",
      label: "Mendekati Deadline",
    };
  }
  if (kategori === "overdue") {
    return {
      cardClass: "task-card--overdue",
      stripeClass: "task-card__top-stripe--overdue",
      badgeClass: "status-badge--overdue",
      label: "Overdue",
    };
  }
  return {
    cardClass: "task-card--normal",
    stripeClass: "task-card__top-stripe--normal",
    badgeClass: "status-badge--normal",
    label: "Normal",
  };
}

/**
 * Card satu tugas pada halaman Daftar Tugas dengan nuansa LMS modern.
 *
 * @param {object} props
 * @param {object} props.task Data tugas dari API (termasuk `mata_kuliah`).
 * @param {(task: object) => void} props.onToggleStatus Dipanggil saat tombol status ditekan.
 * @param {(id: number) => void} props.onDelete Dipanggil saat tombol hapus ditekan.
 */
export default function TaskCard({ task, onToggleStatus, onDelete }) {
  const { cardClass, stripeClass, badgeClass, label } = getKategoriConfig(task.kategori);
  const isSelesai = task.status === "selesai";

  return (
    <article className={`task-card ${cardClass}`} aria-label={`Tugas: ${task.judul}`}>
      {/* Top accent stripe */}
      <div className={`task-card__top-stripe ${stripeClass}`} aria-hidden="true" />

      <div className="task-card__body">
        {/* Status kategori (Normal / Mendekati / Overdue) */}
        <div>
          <span className={`status-badge ${badgeClass}`}>
            <span className="dot" aria-hidden="true" />
            {label}
          </span>
        </div>

        {/* Judul & Mata Kuliah */}
        <div>
          <h3 className="task-card__title">{task.judul}</h3>
          <div className="task-card__course">
            <span aria-hidden="true">📖</span>
            {task.mata_kuliah}
          </div>
        </div>

        {/* Deadline */}
        <div className="task-card__meta">
          <span aria-hidden="true">📅</span>
          <time dateTime={task.deadline}>{formatDeadline(task.deadline)}</time>
        </div>

        {/* Deskripsi (opsional) */}
        {task.deskripsi && (
          <p className="task-card__desc">{task.deskripsi}</p>
        )}
      </div>

      {/* Footer: status selesai/belum + aksi */}
      <div className="task-card__footer">
        <span
          className={`completion-badge completion-badge--${isSelesai ? "selesai" : "belum"}`}
          aria-label={`Status: ${isSelesai ? "Selesai" : "Belum dikerjakan"}`}
        >
          <span className="dot" aria-hidden="true" />
          {isSelesai ? "Selesai" : "Belum"}
        </span>

        <div className="task-card__actions">
          <button
            id={`toggle-${task.id}`}
            className={`btn btn--sm ${isSelesai ? "btn--secondary" : "btn--success"}`}
            onClick={() => onToggleStatus(task)}
            title={isSelesai ? "Tandai sebagai belum selesai" : "Tandai sebagai selesai"}
          >
            {isSelesai ? "↩ Batal" : "✓ Selesai"}
          </button>
          <button
            id={`delete-${task.id}`}
            className="btn btn--sm btn--danger"
            onClick={() => onDelete(task.id)}
            title="Hapus tugas ini"
          >
            🗑
          </button>
        </div>
      </div>
    </article>
  );
}
