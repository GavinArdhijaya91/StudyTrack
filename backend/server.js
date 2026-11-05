/**
 * Entry Point Backend StudyTrack.
 *
 * MENGAPA KODE INI PERLU DITARUH:
 *   Menginisialisasi framework Express, mendaftarkan middleware global, menghubungkan router
 *   tiap modul (autentikasi, mata kuliah, dan tugas), serta menyediakan handler serverless untuk Vercel.
 *
 * MENGAPA DIBUAT SEPERTI INI:
 *   1. Memisahkan middleware CORS dan JSON parser di level teratas sebelum rute dieksekusi.
 *   2. Mendaftarkan seluruh rute dengan awalan `/api/` agar selaras dengan arsitektur multi-service
 *      dan proxy Vite di frontend (`/api/*`).
 *   3. Menyediakan proteksi pada endpoint dev reset (`/api/dev/reset`) agar hanya bisa diakses di luar mode production.
 *   4. Menyediakan ekspor default `app` dan membungkus `app.listen()` dengan pengecekan `!process.env.VERCEL`,
 *      sehingga berkas ini dapat berfungsi ganda: sebagai server mandiri saat pengembangan lokal, dan sebagai
 *      fungsi serverless saat di-deploy ke Vercel.
 *
 * DAMPAK BAGI USER:
 *   Layanan backend berjalan stabil, responsif, memiliki latensi rendah, serta aman dari akses liar
 *   pada endpoint sensitif.
 */
import express from "express";
import cors from "cors";

import { PORT } from "./config.js";
import authRoutes from "./routes/auth.js";
import courseRoutes from "./routes/courses.js";
import taskRoutes from "./routes/tasks.js";
import { resetDB } from "./db.js";

const app = express();

// MENGAPA DITARUH: Mengizinkan request lintas domain (Cross-Origin Resource Sharing).
// DAMPAK BAGI USER: Frontend React (port 5173 atau domain kustom Vercel) dapat berkomunikasi dengan lancar ke backend tanpa diblokir oleh browser.
app.use(cors());

// MENGAPA DITARUH: Mem-parsing payload request berformat application/json menjadi objek JavaScript pada `req.body`.
// DAMPAK BAGI USER: Mahasiswa dapat mengirim formulir registrasi, tugas, dan mata kuliah secara mulus.
app.use(express.json());

/**
 * GET /api/health
 * Endpoint pemeriksaan kesehatan (*health check*) server.
 *
 * MENGAPA KODE INI PERLU DITARUH:
 *   Memfasilitasi sistem monitoring, ping uptime, dan verifikasi kesiapan deployment.
 *
 * DAMPAK BAGI USER:
 *   Memberikan kepastian status server aktif sehingga mempermudah deteksi dini jika terjadi downtime.
 */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "StudyTrack backend is running." });
});

// Pendaftaran rute utama aplikasi StudyTrack sesuai modul spesifikasi Arkavidia 11.0:
app.use("/api/auth", authRoutes);       // Modul 1: Autentikasi (login, register, me)
app.use("/api/courses", courseRoutes);  // Modul 2: Manajemen Mata Kuliah
app.use("/api/tasks", taskRoutes);      // Modul 3 & 4: Manajemen Tugas & Reminder Deadline

/**
 * POST /api/dev/reset
 * Mengembalikan data basis data ke kondisi seed awal Arkavidia 11.0.
 *
 * MENGAPA KODE INI PERLU DITARUH:
 *   Memudahkan penguji atau penilai seleksi studi kasus untuk mereset data uji tanpa harus menghapus berkas manual.
 *
 * MENGAPA DIBUAT SEPERTI INI:
 *   Hanya didaftarkan di luar lingkungan production (`NODE_ENV !== "production"`) untuk mencegah penghapusan
 *   data massal yang tidak disengaja saat aplikasi sudah dipakai mahasiswa secara riil di publik.
 *
 * DAMPAK BAGI USER:
 *   Data mahasiswa di lingkungan produksi terlindungi dari aksi reset yang tidak diinginkan.
 */
if (process.env.NODE_ENV !== "production") {
  app.post("/api/dev/reset", (req, res) => {
    resetDB();
    res.json({ success: true, message: "Database direset ke data seed awal." });
  });
}

/**
 * Fallback Handler untuk endpoint yang tidak terdaftar.
 *
 * MENGAPA KODE INI PERLU DITARUH:
 *   Menangkap seluruh request ke URL yang tidak dikenali dengan respons JSON standar alih-alih halaman HTML bawaan Express.
 *
 * DAMPAK BAGI USER:
 *   Frontend menerima respons format JSON yang konsisten (HTTP 404) sehingga dapat menampilkan pesan kesalahan yang ramah.
 */
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint tidak ditemukan." });
});

// MENGAPA DIBUAT SEPERTI INI:
// Menghindari konflik port listen di Vercel Functions runtime, namun tetap menjalankan server listener lokal di port 4000.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`StudyTrack backend berjalan di http://localhost:${PORT}`);
  });
}

export default app;
