import React, { createContext, useContext, useEffect, useState } from "react";
import api, { TOKEN_KEY } from "./api.js";

const AuthContext = createContext(null);

/**
 * Provider Konteks Otentikasi Global StudyTrack.
 *
 * MENGAPA KODE INI PERLU DITARUH:
 *   Menyediakan single source of truth untuk status otentikasi mahasiswa (apakah sedang login, siapa profilnya,
 *   dan kapan token kedaluwarsa) ke seluruh pohon komponen React tanpa perlu prop drilling.
 *
 * MENGAPA DIBUAT SEPERTI INI:
 *   1. Saat aplikasi pertama kali dimuat di browser (`useEffect`), sistem memeriksa token yang tersimpan di `localStorage`.
 *   2. Jika token ditemukan, sistem memvalidasinya ke endpoint backend `GET /api/auth/me`.
 *   3. Jika token sah, state `user` diisi dengan data profil asli dari server.
 *   4. Jika token tidak valid atau kedaluwarsa, token lama langsung dibersihkan dari `localStorage` untuk mencegah
 *      kondisi 'ghost session' (terlihat login padahal request API akan 401).
 *   5. Selama proses verifikasi berlangsung, state `loading` bernilai `true` agar antarmuka tidak melompat (*flicker*)
 *      ke halaman login sebelum token selesai dicek.
 *
 * DAMPAK BAGI USER:
 *   Mahasiswa menikmati pengalaman aplikasi yang mulus (*seamless session persistence*): saat membuka tab baru
 *   atau me-refresh browser, mereka tidak dipaksa login berulang kali.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  /**
   * Menyimpan token dan data profil pengguna setelah registrasi atau login sukses.
   *
   * DAMPAK BAGI USER:
   *   Mahasiswa langsung diarahkan ke halaman tugas dengan identitas personal yang telah terkonfigurasi.
   */
  function login(token, userData) {
    localStorage.setItem(TOKEN_KEY, token);
    setUser(userData);
  }

  /**
   * Menghapus token dari localStorage dan mengosongkan state user.
   *
   * DAMPAK BAGI USER:
   *   Menjamin privasi mahasiswa saat menggunakan komputer umum/laboratorium kampus,
   *   sehingga orang lain tidak dapat melihat tugas atau mata kuliah mereka setelah tombol logout ditekan.
   */
  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom Hook untuk mempermudah akses status otentikasi di setiap komponen.
 *
 * MENGAPA KODE INI PERLU DITARUH:
 *   Menyederhanakan pemanggilan `useContext(AuthContext)` agar lebih ringkas dan terhindar dari boilerplate import.
 *
 * @returns {{ user: object|null, loading: boolean, login: Function, logout: Function }}
 */
export function useAuth() {
  return useContext(AuthContext);
}
