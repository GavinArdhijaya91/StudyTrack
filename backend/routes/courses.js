import { Router } from "express";
import { readDB, writeDB } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// MENGAPA DITARUH: Proteksi otentikasi menyeluruh pada modul mata kuliah.
// DAMPAK BAGI USER: Menjamin kurikulum dan daftar mata kuliah mahasiswa terlindungi secara privat.
router.use(requireAuth);

/**
 * GET /api/courses
 * Mengambil seluruh daftar mata kuliah milik mahasiswa yang sedang login.
 *
 * MENGAPA KODE INI PERLU DITARUH:
 *   Memenuhi Modul 2: Manajemen Mata Kuliah dari studi kasus Arkavidia 11.0 (slide 3),
 *   yaitu menampilkan mata kuliah yang sedang diambil mahasiswa pada semester berjalan.
 *
 * MENGAPA DIBUAT SEPERTI INI:
 *   Memfilter data dari database berbasis `user_id === req.user.id` sehingga pengguna
 *   hanya menerima daftar mata kuliah miliknya sendiri.
 *
 * DAMPAK BAGI USER:
 *   Mahasiswa dapat melihat ringkasan seluruh mata kuliah semester aktif mereka secara teratur,
 *   lengkap dengan kode perkuliahan dan dosen pengampu.
 */
router.get("/", (req, res) => {
  const db = readDB();
  const courses = db.courses.filter((c) => c.user_id === req.user.id);
  res.json({ courses });
});

/**
 * POST /api/courses
 * Menambahkan mata kuliah baru ke kurikulum semester mahasiswa.
 *
 * MENGAPA KODE INI PERLU DITARUH:
 *   Memfasilitasi mahasiswa saat awal semester atau saat masa revisi KRS (Kartu Rencana Studi)
 *   untuk mendaftarkan mata kuliah baru ke dalam sistem StudyTrack.
 *
 * MENGAPA DIBUAT SEPERTI INI:
 *   1. Memvalidasi bahwa nama mata kuliah wajib diisi, mencegah entri data kosong yang merusak UI.
 *   2. Properti `kode` (contoh: "CS 186") dan `dosen` (contoh: "Dr. Andi Wijaya") bersifat opsional
 *      sesuai struktur tabel Bagian 1 studi kasus (slide 4), namun default string kosong diberikan
 *      untuk menjaga konsistensi tipe data saat dirender di antarmuka frontend.
 *   3. Menghasilkan auto-increment ID unik dari `db.nextIds.course++`.
 *
 * DAMPAK BAGI USER:
 *   Mahasiswa dapat dengan mudah menyusun daftar mata kuliah yang sedang diambil, menjadi fondasi
 *   sebelum mereka mulai mengaitkan tugas-tugas kuliah.
 */
router.post("/", (req, res) => {
  const { name, kode, dosen } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Nama mata kuliah wajib diisi." });
  }

  const db = readDB();
  const newCourse = {
    id: db.nextIds.course++,
    user_id: req.user.id,
    name,
    kode: kode || "",
    dosen: dosen || ""
  };
  db.courses.push(newCourse);
  writeDB(db);
  res.status(201).json({ course: newCourse });
});

/**
 * PUT /api/courses/:id
 * Memperbarui informasi mata kuliah (nama, kode, atau dosen pengampu).
 *
 * MENGAPA KODE INI PERLU DITARUH:
 *   Memungkinkan pembaruan data jika terjadi perubahan dosen pengampu di tengah semester
 *   atau perbaikan salah ketik pada kode mata kuliah.
 *
 * MENGAPA DIBUAT SEPERTI INI:
 *   1. Memastikan mahasiswa hanya dapat mengedit mata kuliah miliknya (`user_id === req.user.id`).
 *   2. Menggunakan selective assignment (`!== undefined`) agar field yang tidak dikirim dalam payload
 *      tidak tertimpa menjadi null atau terhapus.
 *
 * DAMPAK BAGI USER:
 *   Data mata kuliah selalu fleksibel untuk disesuaikan tanpa perlu menghapus dan membuat ulang dari awal.
 */
router.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  const db = readDB();
  const course = db.courses.find((c) => c.id === id && c.user_id === req.user.id);
  if (!course) {
    return res.status(404).json({ error: "Mata kuliah tidak ditemukan." });
  }

  const { name, kode, dosen } = req.body;
  if (name !== undefined) course.name = name;
  if (kode !== undefined) course.kode = kode;
  if (dosen !== undefined) course.dosen = dosen;
  writeDB(db);
  res.json({ course });
});

/**
 * DELETE /api/courses/:id
 * Menghapus mata kuliah sekaligus menghapus seluruh tugas yang terkait di dalamnya (Cascade Delete).
 *
 * MENGAPA KODE INI PERLU DITARUH:
 *   Memberikan fitur pembatalan mata kuliah (misalnya saat mahasiswa drop mata kuliah).
 *
 * MENGAPA DIBUAT SEPERTI INI:
 *   Logika `db.tasks = db.tasks.filter((t) => t.mata_kuliah_id !== id)` menerapkan prinsip
 *   Cascade Delete pada layer aplikasi. Tanpa penghapusan kaskade ini, tugas-tugas yang terhubung
 *   ke mata kuliah yang dihapus akan menjadi "orphaned records" yang dapat memicu error `null reference`
 *   di frontend saat mencoba merender nama mata kuliah yang sudah tidak ada.
 *
 * DAMPAK BAGI USER:
 *   Menjaga kebersihan dan integritas sistem: mahasiswa tidak akan melihat tugas usang tanpa nama mata kuliah,
 *   serta terhindar dari bug visual atau error layar putih di dashboard.
 */
router.delete("/:id", (req, res) => {
  const id = Number(req.params.id);
  const db = readDB();
  const course = db.courses.find((c) => c.id === id && c.user_id === req.user.id);
  if (!course) {
    return res.status(404).json({ error: "Mata kuliah tidak ditemukan." });
  }

  // Menghapus entitas mata kuliah
  db.courses = db.courses.filter((c) => c.id !== id);
  // Menghapus seluruh tugas yang berelasi dengan mata kuliah tersebut (Cascade Delete)
  db.tasks = db.tasks.filter((t) => t.mata_kuliah_id !== id);
  writeDB(db);
  res.json({ success: true });
});

export default router;
