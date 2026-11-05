import axios from "axios";

/**
 * Kunci penyimpanan token otentikasi di localStorage browser.
 *
 * MENGAPA KODE INI PERLU DITARUH:
 *   Sebagai identifier konstanta terpusat agar tidak terjadi salah ketik (typo) di berbagai komponen yang mengakses token.
 */
export const TOKEN_KEY = "studytrack_token";

/**
 * Instance Axios terpusat untuk seluruh pemanggilan API backend StudyTrack.
 *
 * MENGAPA KODE INI PERLU DITARUH:
 *   Mengonsolidasikan konfigurasi HTTP client, base URL, dan penyematan kredensial otentikasi di satu tempat.
 *
 * MENGAPA DIBUAT SEPERTI INI:
 *   1. Menggunakan relative path `baseURL: "/api"`.
 *      - Pada mode development, request `/api/*` diteruskan oleh proxy server Vite ke `http://localhost:4000`.
 *      - Pada mode production Vercel, request `/api/*` secara otomatis diarahkan ke service Express oleh rewrite rule di `vercel.json`.
 *      Hal ini mengeliminasi kebutuhan mengotak-atik URL hardcoded antar lingkungan hosting.
 *   2. Memanfaatkan Axios Request Interceptor untuk secara dinamis menyuntikkan header `Authorization: Bearer <token>`
 *      pada setiap request jika mahasiswa telah login.
 *
 * DAMPAK BAGI USER:
 *   Setiap aksi mahasiswa (memuat tugas, menambah mata kuliah, mengubah status) berjalan mulus tanpa masalah CORS,
 *   dan mahasiswa tidak perlu menginput token manual di setiap halaman.
 */
const api = axios.create({
  baseURL: "/api"
});

// Menyisipkan token JWT yang tersimpan di localStorage ke setiap request keluar.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
