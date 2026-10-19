// ==========================================
// KONFIGURASI SISTEM FRONTEND
// ==========================================

// Ganti nilai di bawah ini dengan URL Web App Google Apps Script Anda (pastikan berakhiran /exec)
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwRQHIgJQl7PytRuaD1-t7JcIQoHbWSA5ZXMv54u2IzzuQaEcN7lIX_49I4fa_TOig-/exec";

// --- TEMA WARNA APLIKASI ---
// Satu pengaturan ini mengubah warna header, tombol, fokus input, dan aksen di seluruh halaman.
// 15 pilihan warna:
//   Biru/hijau : "blue", "sky" (biru langit), "cyan", "teal" (toska), "emerald" (zamrud), "green"
//   Ungu/merah : "indigo", "violet", "purple", "pink", "rose"
//   Hangat     : "orange", "amber"
//   Netral     : "slate" (abu kebiruan), "stone" (abu kecoklatan)
// Opsional: isi paletKustom dengan 11 warna hex (tingkat 50-950) untuk warna sendiri, contoh:
//   paletKustom: { 50:"#...", 100:"#...", 200:"#...", 300:"#...", 400:"#...", 500:"#...", 600:"#...", 700:"#...", 800:"#...", 900:"#...", 950:"#..." }
const CONFIG_TEMA = {
  warna: "teal"
};

// --- CATATAN PENYESUAIAN: KONFIGURASI HEADER ---
// Objek CONFIG_HEADER berfungsi untuk memisahkan data identitas instansi dari kode HTML.
// Pengelola dapat dengan mudah mengganti nama, menambah logo, dan mengubah skema warna di sini.
// --- KONFIGURASI HEADER ---
const CONFIG_HEADER = {
  namaPemda: "Pemerintah Kabupaten Kota", // Muncul sebagai lencana (badge) di atas
  namaAplikasi: "SISTEM LAYANAN PENGADUAN PUBLIK", // Judul utama (h1)
  keterangan: "Dinas Pendidikan dan Kebudayaan Kabupaten Kota ", // Teks penjelasan kecil di bawah
  
  logoUrl: "./public/asset/logo.svg", // Path relatif logo
  
  // --- WARNA HEADER ---
  // Secara bawaan mengikuti CONFIG_TEMA di atas (kelas "tema-*"), jadi TIDAK perlu diubah
  // saat berganti tema. Ubah hanya bila ingin warna header berbeda dari tema halaman;
  // isi dengan kelas Tailwind biasa (mis. "bg-slate-900"). Pakai warna GELAP karena teks header putih.
  warnaLatar: "bg-tema-900",       // warna utama header
  warnaAksen: "bg-tema-950",       // kotak latar tombol tab (Form Aduan / Lacak Status / Admin)
  warnaTeks: "text-tema-200",      // teks keterangan kecil & teks tab yang tidak aktif
  warnaBorder: "border-tema-800",  // garis bawah header & garis tepi kotak tab
  warnaTabAktif: "bg-tema-700",    // warna tab yang sedang dipilih
  warnaLencana: "bg-tema-800/50 text-tema-100 border-tema-700/50" // lencana nama pemda
};

// --- CATATAN PENYESUAIAN: KONFIGURASI KATEGORI ---
// Tambah/Ubah/Hapus kategori cukup dari array di bawah ini
const CONFIG_KATEGORI = [
  "Pujian dan Aspirasi",
  "Pengaduan dan Keluhan",
  "Saran & Masukan Konstruktif",
  "Lainnya",
];
