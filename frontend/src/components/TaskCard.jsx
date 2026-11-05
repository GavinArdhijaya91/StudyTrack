import React from "react";

/**
 * Memformat string timestamp deadline ke dalam format waktu lokal Indonesia yang mudah dibaca.
 *
 * MENGAPA KODE INI PERLU DITARUH:
 *   Nilai `deadline` mentah dari backend berformat ISO datetime lokal (misal "2026-07-03T23:59:00").
 *   Mahasiswa memerlukan representasi tanggal dan jam yang ramah dan familiar ("03 Jul 2026, 23.59").
 *
 * MENGAPA DIBUAT SEPERTI INI:
 *   Menggunakan `toLocaleString("id-ID", ...)` dengan opsi 2-digit untuk hari, nama bulan singkatan,
 *   tahun numerik, serta jam dan menit.
 *
 * DAMPAK BAGI USER:
 *   Mahasiswa dapat membaca batas waktu secara seketika tanpa kebingungan menginterpretasikan format mesin ISO.
 *
 * @param {string} deadline Tanggal dan jam deadline dari API.
 * @returns {string} Contoh: "03 Jul 2026, 23.59"
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
 * Mengembalikan konfigurasi gaya visual dan penanda badge berdasarkan kategori tugas.
 *
 * MENGAPA KODE INI PERLU DITARUH:
 *   Mengimplementasikan rancangan visual Layer C: Frontend pada studi kasus Arkavidia 11.0 (slide 13):
 *   - "MENDEKATI DEADLINE": Badge oranye, background aksen kuning/oranye (F02: penanda visual yang jelas).
 *   - "OVERDUE": Badge merah, background aksen merah muda (F03: penanda yang berbeda dari mendekati deadline).
 *   - "NORMAL": Badge hijau, background netral/putih.
 *
 * MENGAPA DIBUAT SEPERTI INI:
 *   Memisahkan pemetaan kategori ke CSS class murni melalui fungsi deterministik, sehingga komponen kartu
 *   bersifat stateless dan murni bertugas merender UI (*presentational component*).
 *
 * DAMPAK BAGI USER:
 *   Mahasiswa memiliki hierarki visual yang sangat kontras: kartu tugas mendekati deadline langsung "menyala"
 *   dan menarik atensi, sedangkan tugas normal memberi ketenangan visual.
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
 * Komponen Card Tugas untuk menyajikan informasi tugas kuliah dengan estetika LMS modern.
 *
 * MENGAPA KODE INI PERLU DITARUH:
 *   Merupakan antarmuka inti tempat mahasiswa berinteraksi langsung dengan tugas mereka, melihat status
 *   kategori deadline, serta melakukan aksi penyelesaian atau penghapusan tugas.
 *
 * MENGAPA DIBUAT SEPERTI INI:
 *   1. Memiliki garis aksen atas (*top accent stripe*) dan badge berkedip/berwarna yang mencerminkan urgensi.
 *   2. Memisahkan antara badge urgensi deadline (Normal / Mendekati / Overdue) dengan status pengerjaan (Belum / Selesai).
 *      Hal ini sesuai dengan skenario verifikasi no. 2 pada dokumen Arkavidia 11.0: tugas yang sudah selesai
 *      namun tenggatnya lewat tetap menampilkan badge merah (tidak hilang) agar mahasiswa memiliki histori transparan.
 *   3. Dilengkapi tombol aksi cepat: Toggle Selesai/Batal dan Hapus dengan konfirmasi visual.
 *
 * DAMPAK BAGI USER:
 *   Mahasiswa dapat memantau prioritas tugas dalam sekejap mata, menyelesaikan tugas dengan rasa puas melalui tombol interaktif,
 *   dan menikmati tampilan yang teratur layaknya platform LMS profesional.
 *
 * @param {object} props
 * @param {object} props.task Data tugas dari API (termasuk `mata_kuliah` dan `kategori`).
 * @param {(task: object) => void} props.onToggleStatus Callback saat tombol ubah status ditekan.
 * @param {(id: number) => void} props.onDelete Callback saat tombol hapus tugas ditekan.
 */
export default function TaskCard({ task, onToggleStatus, onDelete }) {
  const { cardClass, stripeClass, badgeClass, label } = getKategoriConfig(task.kategori);
  const isSelesai = task.status === "selesai";

  return (
    <article className={`task-card ${cardClass}`} aria-label={`Tugas: ${task.judul}`}>
      {/* Garis aksen penanda warna urgensi di bagian atas kartu */}
      <div className={`task-card__top-stripe ${stripeClass}`} aria-hidden="true" />

      <div className="task-card__body">
        {/* Status kategori deadline real-time (Normal / Mendekati Deadline / Overdue) */}
        <div>
          <span className={`status-badge ${badgeClass}`}>
            <span className="dot" aria-hidden="true" />
            {label}
          </span>
        </div>

        {/* Informasi Utama: Judul Tugas & Nama Mata Kuliah Terkait */}
        <div>
          <h3 className="task-card__title">{task.judul}</h3>
          <div className="task-card__course">
            <span aria-hidden="true">📖</span>
            {task.mata_kuliah}
          </div>
        </div>

        {/* Batas Waktu Pengumpulan (Deadline) */}
        <div className="task-card__meta">
          <span aria-hidden="true">📅</span>
          <time dateTime={task.deadline}>{formatDeadline(task.deadline)}</time>
        </div>

        {/* Catatan / Deskripsi Tugas (Opsional) */}
        {task.deskripsi && (
          <p className="task-card__desc">{task.deskripsi}</p>
        )}
      </div>

      {/* Bagian Bawah Kartu: Status Pengerjaan & Tombol Aksi */}
      <div className="task-card__footer">
        <span
          className={`completion-badge completion-badge--${isSelesai ? "selesai" : "belum"}`}
          aria-label={`Status: ${isSelesai ? "Selesai" : "Belum dikerjakan"}`}
        >
          <span className="dot" aria-hidden="true" />
          {isSelesai ? "Selesai" : "Belum"}
        </span>

        <div className="task-card__actions">
          {/* Tombol alih status: memberi umpan balik instan saat tugas diselesaikan */}
          <button
            id={`toggle-${task.id}`}
            className={`btn btn--sm ${isSelesai ? "btn--secondary" : "btn--success"}`}
            onClick={() => onToggleStatus(task)}
            title={isSelesai ? "Tandai sebagai belum selesai" : "Tandai sebagai selesai"}
          >
            {isSelesai ? "↩ Batal" : "✓ Selesai"}
          </button>
          {/* Tombol hapus tugas jika sudah tidak relevan */}
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
