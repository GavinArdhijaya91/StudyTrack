import { Router } from "express";
import { readDB, writeDB } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

/**
 * Pemetaan bobot prioritas untuk pengurutan tugas.
 *
 * MENGAPA KODE INI PERLU DITARUH:
 *   Memenuhi kebutuhan teknis F02 dan F03 dari dokumen studi kasus Arkavidia 11.0 (slide 7 & 10):
 *   - F02: Tugas mendekati deadline wajib ditampilkan di urutan paling atas.
 *   - F03: Tugas overdue (terlewat) tetap ditampilkan di urutan tengah.
 *   - Normal: Tugas dengan tenggat lebih longgar diletakkan di bagian terbawah.
 *
 * MENGAPA DIBUAT SEPERTI INI:
 *   Nilai numerik (1, 2, 3) memungkinkan sorting array dilakukan secara deterministik dan cepat
 *   melalui operasi aritmatika sederhana: `priority[a] - priority[b]`. Jika bobot kategori sama,
 *   sistem melakukan fallback ke waktu pembuatan tugas terbaru (`created_at`).
 *
 * DAMPAK BAGI USER:
 *   Begitu mahasiswa membuka dashboard/daftar tugas, perhatian mereka langsung tertuju pada tugas
 *   yang paling genting dan berisiko terlambat. Mereka tidak perlu memilah-milah secara manual
 *   atau takut melewatkan tugas penting.
 */
const kategoriPrioritas = {
  mendekati_deadline: 1,
  overdue: 2,
  normal: 3
};

/**
 * Menghitung kategori status tenggat waktu tugas secara real-time.
 *
 * MENGAPA KODE INI PERLU DITARUH:
 *   Mengimplementasikan aturan bisnis utama F01 dari studi kasus Arkavidia 11.0:
 *   "Tugas dikategorikan sebagai mendekati deadline apabila sisa waktu hingga deadline
 *   kurang dari 24 jam sejak waktu saat ini."
 *
 * MENGAPA DIBUAT SEPERTI INI:
 *   1. Sesuai rekomendasi teknis P1 & P2 (slide 8-9), sistem TIDAK menambahkan kolom kategori baru
 *      ke tabel database, melainkan menghitungnya secara dinamis saat runtime (real-time). Hal ini
 *      mencegah data kedaluwarsa akibat perubahan waktu tanpa perlu cron job batch yang kompleks.
 *   2. Ambang batas 24 jam (24 * 60 * 60 * 1000 ms) bersifat konstan/tetap sesuai arahan dokumen.
 *   3. Penanganan Edge Case (slide 14 studi kasus):
 *      - Menggunakan operator `<` pada `batasWaktu < sekarang`. Bila waktu sekarang TEPAT SAMA
 *        dengan deadline (selisih 0 ms), tugas diklasifikasikan sebagai `mendekati_deadline`,
 *        bukan `overdue`. Ini memberikan kesempatan toleransi terakhir bagi mahasiswa.
 *
 * DAMPAK BAGI USER:
 *   Status tugas selalu presisi detik demi detik terhadap waktu nyata. Mahasiswa mendapatkan
 *   sinyal peringatan akurat tanpa risiko bug status basi (stale data).
 *
 * @param {string|Date} deadline Tanggal batas pengumpulan tugas.
 * @param {Date} [sekarang=new Date()] Waktu acuan saat ini (dapat di-inject untuk unit testing/verifikasi).
 * @returns {"overdue"|"mendekati_deadline"|"normal"}
 */
export function kategorisasiTugas(deadline, sekarang = new Date()) {
  const batasWaktu = new Date(deadline);
  const selisihMs = batasWaktu - sekarang;
  const jamDalamMs = 24 * 60 * 60 * 1000;

  // Kasus 1: Deadline sudah lewat dari waktu sekarang
  if (batasWaktu < sekarang) {
    return "overdue";
  }
  // Kasus 2: Sisa waktu kurang dari 24 jam (termasuk selisih tepat 0 ms sesuai verifikasi skenario 3)
  if (selisihMs < jamDalamMs) {
    return "mendekati_deadline";
  }
  // Kasus 3: Sisa waktu masih 24 jam atau lebih
  return "normal";
}

// MENGAPA DITARUH: Menjamin seluruh endpoint tugas terproteksi dan hanya dapat diakses
// oleh pengguna yang membawa token JWT valid.
// DAMPAK BAGI USER: Mencegah kebocoran data akademik dan manipulasi tugas oleh pihak tidak berwenang.
router.use(requireAuth);

/**
 * GET /api/tasks
 * Mengambil daftar seluruh tugas milik pengguna yang sedang login.
 *
 * MENGAPA KODE INI PERLU DITARUH:
 *   Menjawab Modul 4 & Kebutuhan F04 Arkavidia 11.0: "Fitur berlaku untuk seluruh tugas
 *   milik pengguna yang sedang login, lintas semua mata kuliah."
 *
 * MENGAPA DIBUAT SEPERTI INI:
 *   1. Data tugas difilter berdasarkan `req.user.id` untuk multi-tenant data isolation.
 *   2. Melakukan join lookup ke tabel `courses` menggunakan `mata_kuliah_id` untuk menyertakan nama
 *      mata kuliah asli tanpa memaksa frontend melakukan multiple request terpisah (N+1 query problem).
 *   3. Menyematkan atribut `kategori` hasil evaluasi real-time dari `kategorisasiTugas(t.deadline)`.
 *   4. Mengurutkan hasil secara bertingkat: kategori terpenting lebih dulu (`mendekati_deadline` ->
 *      `overdue` -> `normal`), lalu jika kategori sama diurutkan berdasarkan `created_at` terbaru.
 *
 * DAMPAK BAGI USER:
 *   Mahasiswa memiliki satu pusat kendali (single pane of glass) untuk seluruh tugas kuliah mereka.
 *   Daftar tugas otomatis tersaji dengan susunan yang memprioritaskan tugas mendesak, sehingga
 *   mahasiswa langsung tahu tugas apa yang harus diselesaikan terlebih dahulu hari ini.
 */
router.get("/", (req, res) => {
  const db = readDB();
  const tasks = db.tasks
    .filter((t) => t.user_id === req.user.id)
    .map((t) => {
      const course = db.courses.find((c) => c.id === t.mata_kuliah_id);
      return {
        ...t,
        mata_kuliah: course ? course.name : null,
        kategori: kategorisasiTugas(t.deadline)
      };
    })
    .sort((a, b) =>
      kategoriPrioritas[a.kategori] - kategoriPrioritas[b.kategori] ||
      new Date(b.created_at) - new Date(a.created_at)
    );

  res.json({ tasks });
});

/**
 * GET /api/tasks/:id
 * Mengambil data detail satu tugas.
 *
 * MENGAPA KODE INI PERLU DITARUH:
 *   Menyediakan akses langsung ke informasi spesifik suatu tugas untuk kebutuhan inspeksi atau modal edit.
 *
 * MENGAPA DIBUAT SEPERTI INI:
 *   Pencarian memverifikasi `t.id === id && t.user_id === req.user.id`. Pengecekan kepemilikan ganda
 *   ini mencegah serangan Insecure Direct Object Reference (IDOR).
 *
 * DAMPAK BAGI USER:
 *   Mahasiswa dapat melihat detail tugas dengan aman tanpa resiko membuka atau dibukakan data oleh mahasiswa lain.
 */
router.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  const db = readDB();
  const task = db.tasks.find((t) => t.id === id && t.user_id === req.user.id);
  if (!task) {
    return res.status(404).json({ error: "Tugas tidak ditemukan." });
  }
  res.json({ task });
});

/**
 * POST /api/tasks
 * Menambahkan tugas baru untuk suatu mata kuliah.
 *
 * MENGAPA KODE INI PERLU DITARUH:
 *   Memenuhi Modul 3: Manajemen Tugas pada spesifikasi Arkavidia 11.0.
 *
 * MENGAPA DIBUAT SEPERTI INI:
 *   1. Memvalidasi keberadaan field esensial (`mata_kuliah_id`, `judul`, `deadline`).
 *   2. Memverifikasi bahwa `mata_kuliah_id` benar-benar milik pengguna yang sedang login,
 *      menjaga integritas relasi antar tabel.
 *   3. Menetapkan status awal secara default ke `"belum"` dan mencatat timestamp `created_at`
 *      standar ISO 8601 UTC untuk menjaga konsistensi audit jejak waktu.
 *
 * DAMPAK BAGI USER:
 *   Mahasiswa dapat mencatat tugas baru secara instan kapan saja. Input yang tidak lengkap
 *   langsung diberi pesan error deskriptif sehingga tidak membingungkan pengguna.
 */
router.post("/", (req, res) => {
  const { mata_kuliah_id, judul, deskripsi, deadline } = req.body;
  if (!mata_kuliah_id || !judul || !deadline) {
    return res.status(400).json({ error: "mata_kuliah_id, judul, dan deadline wajib diisi." });
  }

  const db = readDB();
  const course = db.courses.find((c) => c.id === Number(mata_kuliah_id) && c.user_id === req.user.id);
  if (!course) {
    return res.status(400).json({ error: "Mata kuliah tidak ditemukan untuk user ini." });
  }

  const newTask = {
    id: db.nextIds.task++,
    user_id: req.user.id,
    mata_kuliah_id: Number(mata_kuliah_id),
    judul,
    deskripsi: deskripsi || "",
    deadline,
    status: "belum",
    created_at: new Date().toISOString()
  };
  db.tasks.push(newTask);
  writeDB(db);
  res.status(201).json({ task: newTask });
});

/**
 * PUT /api/tasks/:id
 * Memperbarui data tugas atau mengganti status pengerjaan ("belum" / "selesai").
 *
 * MENGAPA KODE INI PERLU DITARUH:
 *   Memfasilitasi siklus hidup tugas mahasiswa saat pengerjaan berlangsung, termasuk
 *   menandai checklist tugas yang sudah rampung.
 *
 * MENGAPA DIBUAT SEPERTI INI:
 *   1. Menerapkan pembaruan parsial: hanya properti yang didefinisikan dalam `req.body` yang diubah.
 *   2. Memvalidasi enum nilai status hanya boleh `"belum"` atau `"selesai"`, menjaga kepatuhan
 *      terhadap skema database pada spesifikasi Bagian 1.
 *   3. Sesuai Skenario 2 (slide 14): tugas yang berstatus "selesai" tetap mempertahankan kalkulasi
 *      kategori deadline-nya dan tidak dihapus secara otomatis, agar riwayat belajar tetap tersimpan.
 *
 * DAMPAK BAGI USER:
 *   Mahasiswa merasakan kepuasan progresif saat mencentang tugas yang selesai, atau fleksibilitas
 *   untuk memperbarui deskripsi dan batas waktu jika ada ralat dari dosen pengampu.
 */
router.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  const db = readDB();
  const task = db.tasks.find((t) => t.id === id && t.user_id === req.user.id);
  if (!task) {
    return res.status(404).json({ error: "Tugas tidak ditemukan." });
  }

  const { judul, deskripsi, deadline, status } = req.body;
  if (judul !== undefined) task.judul = judul;
  if (deskripsi !== undefined) task.deskripsi = deskripsi;
  if (deadline !== undefined) task.deadline = deadline;
  if (status !== undefined) {
    if (!["belum", "selesai"].includes(status)) {
      return res.status(400).json({ error: "Status hanya boleh 'belum' atau 'selesai'." });
    }
    task.status = status;
  }
  writeDB(db);
  res.json({ task });
});

/**
 * DELETE /api/tasks/:id
 * Menghapus tugas secara permanen.
 *
 * MENGAPA KODE INI PERLU DITARUH:
 *   Memberikan kontrol penuh kepada mahasiswa untuk membersihkan tugas yang dibatalkan oleh dosen
 *   atau kesalahan entri data.
 *
 * MENGAPA DIBUAT SEPERTI INI:
 *   Mengisolasi filter penghapusan pada kombinasi `t.id !== id` dengan verifikasi kepemilikan
 *   pengguna login, memastikan tidak ada aksi hapus yang tidak disengaja terhadap tugas user lain.
 *
 * DAMPAK BAGI USER:
 *   Daftar tugas mahasiswa tetap rapi dan relevan, bebas dari tugas-tugas usang atau tidak valid.
 */
router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  const db = readDB();
  const task = db.tasks.find((t) => t.id === id && t.user_id === req.user.id);
  if (!task) {
    return res.status(404).json({ error: "Tugas tidak ditemukan." });
  }

  db.tasks = db.tasks.filter((t) => t.id !== id);
  writeDB(db);
  res.json({ success: true });
});

export default router;
