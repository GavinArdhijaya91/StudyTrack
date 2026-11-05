import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { readDB, writeDB } from "../db.js";
import { JWT_SECRET } from "../config.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

/**
 * Menghasilkan token JWT dengan masa berlaku 7 hari.
 *
 * MENGAPA KODE INI PERLU DITARUH:
 *   Sebagai mekanisme autentikasi stateless untuk mengenali identitas mahasiswa di setiap request HTTP berikutnya.
 *
 * MENGAPA DIBUAT SEPERTI INI:
 *   1. Token menyimpan payload minimal (`sub` untuk ID user, `nama`, dan `email`) sehingga tidak membebani ukuran header.
 *   2. Masa berlaku 7 hari dipilih agar mahasiswa tidak perlu login ulang berkali-kali setiap hari di perangkat pribadinya,
 *      namun tetap memiliki batasan masa kedaluwarsa demi alasan keamanan.
 *
 * DAMPAK BAGI USER:
 *   Mahasiswa tetap berada dalam sesi login yang aman tanpa terganggu oleh form login berulang kali.
 */
function signToken(user) {
  return jwt.sign(
    { sub: user.id, nama: user.nama, email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

/**
 * POST /api/auth/register
 * Mendaftarkan akun mahasiswa baru dan langsung mengembalikan token autentikasi.
 *
 * MENGAPA KODE INI PERLU DITARUH:
 *   Memenuhi Modul 1: Autentikasi dari spesifikasi Arkavidia 11.0 (slide 3):
 *   "Mahasiswa dapat mendaftarkan akun baru dan masuk ke aplikasi menggunakan email dan password."
 *
 * MENGAPA DIBUAT SEPERTI INI:
 *   1. Validasi keberadaan nama, email, dan panjang password minimal 6 karakter untuk mencegah akun rentan.
 *   2. Pengecekan duplikasi email dengan `toLowerCase()` untuk memastikan email bersifat unik tanpa terkendala
 *      perbedaan huruf besar/kecil (case-insensitive).
 *   3. Password di-hash menggunakan `bcrypt.hashSync(password, 10)` sehingga kata sandi asli mahasiswa tidak
 *      pernah tersimpan dalam teks terbuka (*plaintext*) di database.
 *   4. Begitu registrasi berhasil, server langsung mengembalikan token JWT dan objek profil pengguna. Ini merupakan
 *      pola onboarding modern agar mahasiswa langsung masuk ke dashboard tanpa langkah login ganda.
 *
 * DAMPAK BAGI USER:
 *   Pengalaman pendaftaran berlangsung cepat, mulus (*seamless*), dan data kredensial terproteksi dengan standar
 *   keamanan kriptografi industri.
 */
router.post("/register", (req, res) => {
  const { nama, email, password } = req.body;

  if (!nama || !email || !password) {
    return res.status(400).json({ error: "Nama, email, dan password wajib diisi." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password minimal 6 karakter." });
  }

  const db = readDB();
  const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: "Email sudah terdaftar." });
  }

  const newUser = {
    id: db.nextIds.user++,
    nama,
    email,
    password_hash: bcrypt.hashSync(password, 10)
  };
  db.users.push(newUser);
  writeDB(db);

  const token = signToken(newUser);
  res.status(201).json({
    token,
    user: { id: newUser.id, nama: newUser.nama, email: newUser.email }
  });
});

/**
 * POST /api/auth/login
 * Memverifikasi kredensial mahasiswa dan menerbitkan token login.
 *
 * MENGAPA KODE INI PERLU DITARUH:
 *   Sebagai gerbang masuk utama agar mahasiswa dapat mengakses data akademiknya yang telah tersimpan.
 *
 * MENGAPA DIBUAT SEPERTI INI:
 *   1. Memverifikasi kecocokan password menggunakan `bcrypt.compareSync` terhadap `password_hash` di database.
 *   2. Mengembalikan error seragam 401 "Email atau password salah" jika salah satu tidak cocok, mencegah
 *      kebocoran informasi apakah email terdaftar atau tidak (User Enumeration Protection).
 *
 * DAMPAK BAGI USER:
 *   Akses ke sistem terjamin aman dan hanya pemilik akun sah yang dapat mengelola tugas perkuliahan mereka.
 */
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email dan password wajib diisi." });
  }

  const db = readDB();
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Email atau password salah." });
  }

  const token = signToken(user);
  res.json({
    token,
    user: { id: user.id, nama: user.nama, email: user.email }
  });
});

/**
 * GET /api/auth/me
 * Mengambil profil mahasiswa berdasarkan token sesi aktif.
 *
 * MENGAPA KODE INI PERLU DITARUH:
 *   Diperlukan oleh frontend (terutama saat refresh halaman atau browser dibuka kembali) untuk
 *   memverifikasi apakah token yang tersimpan di localStorage masih sah atau sudah expired.
 *
 * MENGAPA DIBUAT SEPERTI INI:
 *   Dilindungi oleh middleware `requireAuth`, sehingga otomatis mengekstrak data identitas pengguna
 *   dari signature token tanpa perlu query tambahan yang rumit.
 *
 * DAMPAK BAGI USER:
 *   Sesi pengguna tidak hilang saat halaman di-refresh, membuat navigasi web terasa seperti aplikasi desktop asli.
 */
router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
