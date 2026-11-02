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
    minute: "2-digit"
  });
}

function getBadgeKategori(kategori) {
  if (kategori === "mendekati_deadline") {
    return {
      label: "⚠️ Mendekati Deadline",
      cardStyle: { backgroundColor: "#FFFBEB" },
      style: {
        backgroundColor: "#FEF3C7",
        color: "#D97706",
        border: "1px solid #F59E0B"
      }
    };
  }
  if (kategori === "overdue") {
    return {
      label: "🔴 Overdue",
      cardStyle: { backgroundColor: "#FEF2F2" },
      style: {
        backgroundColor: "#FEE2E2",
        color: "#DC2626",
        border: "1px solid #EF4444"
      }
    };
  }
  return {
    label: "🟢 Normal",
    cardStyle: { backgroundColor: "#FFFFFF" },
    style: {
      backgroundColor: "#D1FAE5",
      color: "#059669",
      border: "1px solid #10B981"
    }
  };
}

/**
 * Card satu tugas pada halaman Daftar Tugas.
 *
 * @param {object} props
 * @param {object} props.task Data tugas dari API (termasuk `mata_kuliah`).
 * @param {(task: object) => void} props.onToggleStatus Dipanggil saat tombol status ditekan.
 * @param {(id: number) => void} props.onDelete Dipanggil saat tombol hapus ditekan.
 *
 */
export default function TaskCard({ task, onToggleStatus, onDelete }) {
  const badgeKategori = getBadgeKategori(task.kategori);

  return (
    <div className="card task-card" style={badgeKategori.cardStyle}>
      <div>
        <strong>{task.judul}</strong>
        <div className="meta">{task.mata_kuliah}</div>
        <div className="meta">Deadline: {formatDeadline(task.deadline)}</div>
        {task.deskripsi && <div className="meta">{task.deskripsi}</div>}
      </div>
      <div style={{ textAlign: "right" }}>
        <div>
          <span className="badge" style={badgeKategori.style}>{badgeKategori.label}</span>
        </div>
        <span className={`badge ${task.status}`}>
          {task.status === "selesai" ? "Selesai" : "Belum"}
        </span>
        <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
          <button className="btn" onClick={() => onToggleStatus(task)}>
            {task.status === "selesai" ? "Tandai Belum" : "Tandai Selesai"}
          </button>
          <button className="btn" onClick={() => onDelete(task.id)}>
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}
