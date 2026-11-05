/**
 * Layer Persistensi Data Berbasis Berkas JSON (`backend/db.json`).
 *
 * MENGAPA KODE INI PERLU DITARUH:
 *   Menyediakan penyimpanan data terpusat untuk aplikasi StudyTrack tanpa memerlukan dependensi
 *   database server eksternal yang rumit (seperti PostgreSQL atau MySQL). Hal ini memudahkan
 *   evaluasi, pengujian lokal, maupun demonstrasi pada seleksi studi kasus Arkavidia 11.0.
 *
 * MENGAPA DIBUAT SEPERTI INI:
 *   1. Mengikuti skema struktur data pada Bagian 1 Dokumen Studi Kasus (slide 4):
 *      - `users`: entitas mahasiswa ({ id, nama, email, password_hash })
 *      - `courses`: mata kuliah terdaftar ({ id, user_id, name, kode, dosen })
 *      - `tasks`: daftar tugas kuliah ({ id, user_id, mata_kuliah_id, judul, deskripsi, deadline, status, created_at })
 *   2. Ditambahkan kolom `user_id` pada setiap entitas untuk memastikan isolasi data per mahasiswa.
 *   3. Di lingkungan cloud serverless (seperti Vercel), sistem berkas bersifat read-only kecuali direktori `/tmp`.
 *      Oleh karena itu, `DB_PATH` secara cerdas beralih ke `/tmp/db.json` saat variabel `process.env.VERCEL` aktif,
 *      dan menyalin data seed awal agar operasi penulisan (*write*) tidak memicu error EROFS.
 *
 * DAMPAK BAGI USER:
 *   Aplikasi siap digunakan secara langsung (*zero-setup*), dengan data seed awal yang langsung tersedia
 *   begitu server pertama kali dijalankan. Mahasiswa penguji dapat langsung login dan melihat tugas perkuliahan.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_DB_PATH = path.join(__dirname, "db.json");

// MENGAPA DIBUAT SEPERTI INI:
// Menjamin portabilitas antara pengujian lokal di mesin developer dan runtime serverless di cloud Vercel.
// Pada Vercel, fungsi Lambda hanya memiliki izin tulis pada direktori sementara `/tmp`.
const DB_PATH = process.env.VERCEL
  ? path.join("/tmp", "db.json")
  : (process.env.DB_PATH || SEED_DB_PATH);

/**
 * Menghasilkan data seed awal persis sesuai dengan dokumen studi kasus Arkavidia 11.0 (slide 4 & 5).
 *
 * MENGAPA KODE INI PERLU DITARUH:
 *   Menyediakan data uji realistis yang merefleksikan skenario nyata mahasiswa teknik informatika.
 *
 * MENGAPA DIBUAT SEPERTI INI:
 *   1. Password akun demo "demo1234" di-hash dengan bcrypt round 10 demi keseragaman format auth.
 *   2. Memasukkan 3 mata kuliah (CS 186, CS 61B, CS 169) dan 3 contoh tugas dengan variasi tenggat waktu:
 *      - Tugas 2 (BSTMap): deadline 2026-07-02 10:00 (digunakan untuk pengujian mendekati deadline)
 *      - Tugas 1 (Query Optimization): deadline 2026-07-03 23:59 (digunakan untuk pengujian overdue)
 *      - Tugas 3 (Sprint 2): deadline 2026-07-06 23:59 (digunakan untuk pengujian kategori normal)
 *
 * DAMPAK BAGI USER:
 *   Pengguna atau reviewer seleksi dapat langsung mencoba seluruh fitur (reminder, filter, badge, toggle)
 *   tanpa harus menginput data satu per satu dari awal.
 *
 * @returns {object} Struktur basis data JSON dalam kondisi awal.
 */
function seedData() {
  const passwordHash = bcrypt.hashSync("demo1234", 10);
  return {
    nextIds: { user: 2, course: 4, task: 4 },
    users: [
      { id: 1, nama: "Demo Mahasiswa", email: "demo@studytrack.test", password_hash: passwordHash }
    ],
    courses: [
      { id: 1, user_id: 1, name: "Database Systems", kode: "CS 186", dosen: "Dr. Andi Wijaya" },
      { id: 2, user_id: 1, name: "Data Structures", kode: "CS 61B", dosen: "Dr. Sari Lestari" },
      { id: 3, user_id: 1, name: "Software Engineering", kode: "CS 169", dosen: "Dr. Budi Santoso" }
    ],
    tasks: [
      {
        id: 1,
        user_id: 1,
        mata_kuliah_id: 1,
        judul: "Lab 4: Query Optimization Report",
        deskripsi: "Laporan hasil eksperimen optimasi query beserta analisis query plan.",
        deadline: "2026-07-03T23:59:00",
        status: "belum",
        created_at: "2026-06-15T09:00:00"
      },
      {
        id: 2,
        user_id: 1,
        mata_kuliah_id: 2,
        judul: "Project 3: BSTMap Implementation",
        deskripsi: "Implementasi BSTMap beserta pengujian dasarnya.",
        deadline: "2026-07-02T10:00:00",
        status: "belum",
        created_at: "2026-06-16T14:00:00"
      },
      {
        id: 3,
        user_id: 1,
        mata_kuliah_id: 3,
        judul: "Sprint 2: Backend API Integration",
        deskripsi: "Integrasi endpoint backend ke frontend untuk sprint 2.",
        deadline: "2026-07-06T23:59:00",
        status: "belum",
        created_at: "2026-06-17T11:00:00"
      }
    ]
  };
}

/**
 * Membaca seluruh isi database dari disk.
 *
 * MENGAPA KODE INI PERLU DITARUH:
 *   Mengambil snapshot data terkini untuk setiap operasi query dan verifikasi relasi.
 *
 * MENGAPA DIBUAT SEPERTI INI:
 *   Menerapkan pola lazy initialization: jika berkas database belum tercipta di path target,
 *   sistem secara otomatis menyalin berkas seed atau membuatnya on-the-fly.
 *
 * DAMPAK BAGI USER:
 *   Aplikasi tidak pernah mengalami crash akibat "file not found" saat pertama kali diakses.
 */
export function readDB() {
  if (!fs.existsSync(DB_PATH)) {
    if (fs.existsSync(SEED_DB_PATH) && DB_PATH !== SEED_DB_PATH) {
      fs.copyFileSync(SEED_DB_PATH, DB_PATH);
    } else {
      writeDB(seedData());
    }
  }
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}

/**
 * Menyimpan seluruh struktur data ke berkas JSON dengan format rapi (*indented*).
 *
 * MENGAPA KODE INI PERLU DITARUH:
 *   Memastikan setiap penambahan, modifikasi, atau penghapusan data bersifat permanen (persisted).
 *
 * MENGAPA DIBUAT SEPERTI INI:
 *   Menggunakan `JSON.stringify(db, null, 2)` untuk mempermudah audit manual berkas `db.json`
 *   oleh developer saat proses debugging.
 *
 * DAMPAK BAGI USER:
 *   Seluruh aksi pengguna (menandai tugas selesai, menambah mata kuliah baru) tersimpan dengan aman
 *   dan tidak akan hilang saat server di-restart.
 */
export function writeDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

/**
 * Mereset isi database kembali ke data seed awal Arkavidia 11.0.
 *
 * MENGAPA KODE INI PERLU DITARUH:
 *   Memfasilitasi kebutuhan pengujian berulang dan demonstrasi fitur seleksi studi kasus.
 *
 * MENGAPA DIBUAT SEPERTI INI:
 *   Memanggil `seedData()` dan langsung menimpanya ke `writeDB()`, mengembalikan seluruh ID auto-increment
 *   dan 3 tugas standar ke kondisi murni.
 *
 * DAMPAK BAGI USER:
 *   Pengguna dapat membersihkan data uji kapan saja dengan sekali klik atau perintah API, mengembalikan
 *   lingkungan belajar ke skenario studi kasus awal.
 */
export function resetDB() {
  const db = seedData();
  writeDB(db);
  return db;
}
