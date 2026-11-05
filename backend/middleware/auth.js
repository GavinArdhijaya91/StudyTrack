import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";

/**
 * Middleware otentikasi berbasis JSON Web Token (JWT).
 *
 * MENGAPA KODE INI PERLU DITARUH:
 *   Sebagai dinding pertahanan (*access control guard*) yang memvalidasi setiap request yang masuk
 *   ke endpoint privat (seluruh modul tugas dan mata kuliah).
 *
 * MENGAPA DIBUAT SEPERTI INI:
 *   1. Memeriksa keberadaan header standar HTTP `Authorization: Bearer <token>`.
 *   2. Memverifikasi keaslian signature token menggunakan `jwt.verify(token, JWT_SECRET)`.
 *   3. Mengekstrak payload (`req.user = { id, nama, email }`) dan menyuntikkannya ke objek `req`,
 *      sehingga handler berikutnya dapat langsung memanfaatkan ID mahasiswa untuk isolasi data
 *      tanpa perlu melakukan query ulang ke database.
 *   4. Menangani kegagalan token (kedaluwarsa atau dimanipulasi) dengan respons status HTTP 401 Unauthorized.
 *
 * DAMPAK BAGI USER:
 *   Data mahasiswa terlindungi dari pembajakan sesi. Jika sesi telah kedaluwarsa, pengguna secara tertib
 *   diarahkan kembali ke halaman login demi menjaga keamanan data pribadi.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Token tidak ditemukan. Silakan login terlebih dahulu." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.sub, nama: payload.nama, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ error: "Token tidak valid atau sudah kedaluwarsa." });
  }
}
