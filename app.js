// ================= UTILITAS & MEMORI LOKAL =================
const KUNCI_SESI_ADMIN = "sesiKodeAksesAdmin";
let kodeAksesAktif = sessionStorage.getItem(KUNCI_SESI_ADMIN) || "";
let pesanRekapanTerakhir = "";

// 1. Muat Draft dari Local Storage & Render UI saat halaman dimuat
document.addEventListener("DOMContentLoaded", () => {
  renderHeader();
  renderKategori(); // CATATAN PENYESUAIAN: Merender daftar kategori
  muatDraft();      // muatDraft dipanggil setelah kategori selesai dibuat
  mulaiJudulBerjalan(); // Menjalankan efek teks berjalan pada title tab browser
});

// --- FUNGSI JUDUL TAB BROWSER BERJALAN (MARQUEE) ---
function mulaiJudulBerjalan() {
  // Mengambil teks asli dari tag <title> di index.html
  const teksAsli = (document.title || `${CONFIG_HEADER.namaPemda} - ${CONFIG_HEADER.namaAplikasi}`).trim();
  // Tambahkan pemisah di ujung agar putaran teks terlihat rapi
  let teksBerjalan = teksAsli + "   •   ";
  
  setInterval(() => {
    teksBerjalan = teksBerjalan.substring(1) + teksBerjalan.substring(0, 1);
    document.title = teksBerjalan;
  }, 250); // Kecepatan geser (250 milidetik per huruf)
}

// --- WARNA HEADER DARI config.js (dengan nilai bawaan bila ada kunci yang belum diisi) ---
function warnaHeader() {
  return Object.assign({
    warnaLatar: "bg-tema-900",
    warnaAksen: "bg-tema-950",
    warnaTeks: "text-tema-200",
    warnaBorder: "border-tema-800",
    warnaTabAktif: "bg-tema-700",
    warnaLencana: "bg-tema-800/50 text-tema-100 border-tema-700/50"
  }, CONFIG_HEADER);
}

function daftarKelas(teks) { return String(teks || "").split(/\s+/).filter(Boolean); }

// Mengatur tampilan satu tombol tab (aktif / tidak aktif) sesuai warna di config.js
function setGayaTab(tab, aktif) {
  const btn = document.getElementById(`btnTab-${tab}`);
  if (!btn) return;
  const W = warnaHeader();
  const kelasAktif = daftarKelas(W.warnaTabAktif).concat(["text-white", "shadow-sm"]);
  const kelasPasif = daftarKelas(W.warnaTeks).concat(["hover:text-white"]);
  btn.classList.remove(...(aktif ? kelasPasif : kelasAktif));
  btn.classList.add(...(aktif ? kelasAktif : kelasPasif));
}

// --- FUNGSI RENDER HEADER DINAMIS ---
function renderHeader() {
  const headerEl = document.getElementById("headerInstansi");
  if (!headerEl) return;
  const W = warnaHeader();

  headerEl.className = `${W.warnaLatar} text-white shadow-lg border-b ${W.warnaBorder} font-sans relative z-10`;

  const logoHtml = CONFIG_HEADER.logoUrl 
    ? `<div class="relative shrink-0 flex items-center justify-center mb-1 md:mb-0">
         <img src="${esc(CONFIG_HEADER.logoUrl)}" alt="Logo Instansi" class="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 object-contain relative z-10 p-0.5 filter drop-shadow-xl">
       </div>` 
    : '';

  headerEl.innerHTML = `
    <div class="max-w-4xl mx-auto px-4 py-4 md:py-6 relative z-10">
      <div class="flex flex-col lg:flex-row items-center md:items-center justify-between gap-4 md:gap-4 w-full">
        
        <div class="flex flex-col lg:flex-row items-center justify-center md:justify-start gap-2 md:gap-4 min-w-0 w-full md:w-auto flex-1">
          ${logoHtml}
          
          <div class="min-w-0 space-y-0.5 sm:space-y-1 flex flex-col items-center md:items-start text-center md:text-left">
            <div class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest border ${W.warnaLencana} backdrop-blur-sm">
              <svg class="w-2.5 h-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"></path></svg>
              <span class="truncate">${esc(CONFIG_HEADER.namaPemda)}</span>
            </div>
            
            <h1 class="text-sm sm:text-lg md:text-xl lg:text-2xl font-black tracking-tight leading-tight drop-shadow-md text-white whitespace-normal break-words sm:truncate">
              ${esc(CONFIG_HEADER.namaAplikasi)}
            </h1>
            
            <p class="${W.warnaTeks} text-[9px] md:text-xs font-semibold leading-relaxed max-w-xl whitespace-normal break-words sm:truncate">
              ${esc(CONFIG_HEADER.keterangan)}
            </p>
          </div>
        </div>

        <div class="flex shrink-0 w-full md:w-auto overflow-x-auto justify-center ${W.warnaAksen} p-1 rounded-xl text-xs font-medium border ${W.warnaBorder} shadow-inner">
          <button onclick="pindahTab('form')" id="btnTab-form" class="tab-btn px-3 py-1.5 whitespace-nowrap flex-1 lg:flex-none text-center">Form Aduan</button>
          <button onclick="pindahTab('lacak')" id="btnTab-lacak" class="tab-btn px-3 py-1.5 whitespace-nowrap flex-1 lg:flex-none text-center">Lacak Status</button>
          <button onclick="pindahTab('admin')" id="btnTab-admin" class="tab-btn px-3 py-1.5 whitespace-nowrap flex-1 lg:flex-none text-center">Admin</button>
        </div>
        
      </div>
    </div>
  `;
  ['form', 'lacak', 'admin'].forEach(tab => setGayaTab(tab, tab === 'form'));
}

// --- CATATAN PENYESUAIAN: FUNGSI RENDER KATEGORI DINAMIS ---
function renderKategori() {
  const selectKategori = document.getElementById("inputKategori");
  // Pastikan elemen ada dan konfigurasi kategori telah dimuat dari config.js
  if (!selectKategori || typeof CONFIG_KATEGORI === 'undefined') return;
  
  selectKategori.innerHTML = ""; // Bersihkan opsi bawaan
  
  // Masukkan opsi baru berdasarkan array config
  CONFIG_KATEGORI.forEach(kategori => {
    const opt = document.createElement("option");
    opt.value = kategori;
    opt.textContent = kategori;
    selectKategori.appendChild(opt);
  });
}

function simpanDraft() {
  const draft = {
    nama: document.getElementById("inputNama").value,
    email: document.getElementById("inputEmail").value,
    kategori: document.getElementById("inputKategori").value,
    rincian: document.getElementById("inputRincian").value
  };
  localStorage.setItem("draftAduan", JSON.stringify(draft));
}

function muatDraft() {
  const draftStr = localStorage.getItem("draftAduan");
  // CATATAN PENYESUAIAN: Ambil item pertama dari config sebagai default jika memori lokal kosong
  const defaultKategori = (typeof CONFIG_KATEGORI !== 'undefined' && CONFIG_KATEGORI.length > 0) ? CONFIG_KATEGORI[0] : "";
  
  if (draftStr) {
    try {
      const draft = JSON.parse(draftStr);
      document.getElementById("inputNama").value = draft.nama || "";
      document.getElementById("inputEmail").value = draft.email || "";
      document.getElementById("inputKategori").value = draft.kategori || defaultKategori;
      document.getElementById("inputRincian").value = draft.rincian || "";
    } catch(e) {}
  }
}

// 2. Simpan otomatis ke memori lokal setiap kali pengguna mengetik
['inputNama', 'inputEmail', 'inputKategori', 'inputRincian'].forEach(id => {
  document.getElementById(id).addEventListener('input', simpanDraft);
});

// ================= UTILITAS UMUM =================
const STATUS_OPSI = [
  { value: "Menunggu Tindak Lanjut", label: "Menunggu" },
  { value: "Sedang Ditelaah", label: "Diproses" },
  { value: "Selesai", label: "Selesai" },
  { value: "Ditolak", label: "Ditolak" }
];

function esc(s) {
  return String(s === null || s === undefined ? "" : s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function warnaStatus(status) {
  if (status === "Selesai") return "bg-emerald-100 text-emerald-800";
  if (status === "Ditolak") return "bg-red-100 text-red-800";
  if (status === "Sedang Ditelaah") return "bg-amber-100 text-amber-800";
  return "bg-blue-100 text-blue-800";
}

function pindahTab(namaTab) {
  ['form', 'lacak', 'admin'].forEach(tab => {
    document.getElementById(`tab-${tab}`).classList.toggle('hidden', tab !== namaTab);
    setGayaTab(tab, tab === namaTab);
  });

  // Jika pindah ke tab admin dan sesi masih tersimpan di sessionStorage tetapi data belum dimuat (misal habis refresh halaman)
  if (namaTab === 'admin' && kodeAksesAktif && document.getElementById("adminDataBox").classList.contains("hidden")) {
    bukaRekapanAdmin();
  }
}

function toggleAnonim() {
  const isAnonim = document.getElementById("cekAnonim").checked;
  const inputNama = document.getElementById("inputNama");
  const inputEmail = document.getElementById("inputEmail");

  if (isAnonim) {
    // Kunci input nama dan isi dengan Anonim
    inputNama.value = "Anonim";
    inputNama.readOnly = true;
    inputNama.classList.add("bg-slate-100", "text-slate-500", "cursor-not-allowed");
    
    // Nonaktifkan dan kosongkan input email
    inputEmail.value = "";
    inputEmail.disabled = true;
    inputEmail.classList.add("bg-slate-100", "cursor-not-allowed");
    inputEmail.placeholder = "Email dinonaktifkan (Anonim)";
  } else {
    // Buka kembali input nama
    inputNama.value = "";
    inputNama.readOnly = false;
    inputNama.classList.remove("bg-slate-100", "text-slate-500", "cursor-not-allowed");
    
    // Buka kembali input email
    inputEmail.disabled = false;
    inputEmail.classList.remove("bg-slate-100", "cursor-not-allowed");
    inputEmail.placeholder = "contoh@gmail.com";
  }
}

// ================= FUNGSI MODAL (POP-UP) =================
function tampilkanModal(tipe, judul, pesan) {
  const modal = document.getElementById('customModal');
  const content = document.getElementById('modalContent');
  const icon = document.getElementById('modalIcon');
  document.getElementById('modalTitle').innerHTML = judul;
  document.getElementById('modalMessage').innerHTML = pesan;
  if (tipe === 'success') {
    icon.innerHTML = `<svg class="w-14 h-14 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
  } else {
    icon.innerHTML = `<svg class="w-14 h-14 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
  }
  modal.classList.remove('hidden');
  setTimeout(() => {
    content.classList.remove('scale-95');
    content.classList.add('scale-100');
  }, 10);
}

function tutupModal() {
  const modal = document.getElementById('customModal');
  const content = document.getElementById('modalContent');
  content.classList.remove('scale-100');
  content.classList.add('scale-95');
  setTimeout(() => { modal.classList.add('hidden'); }, 200);
}

// ================= KONVERSI & API =================
function getBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

async function panggilAPI(payload) {
  const res = await fetch(SCRIPT_URL, { method: "POST", body: JSON.stringify(payload) });
  const teks = await res.text();
  try { return JSON.parse(teks); } 
  catch (e) {
    console.error("[API] Respons server bukan JSON. HTTP", res.status, "| Awal isi:", teks.slice(0, 500));
    throw new Error("Respons server tidak valid (HTTP " + res.status + "). Buka Console (F12) untuk detail.");
  }
}

async function panggilAPIProgress(payload, onProgress) {
  let progress = 0;
  const intervalAnimasi = setInterval(() => {
    progress += Math.floor(Math.random() * 15) + 5; 
    if (progress > 90) progress = 90; 
    if (onProgress) onProgress(progress);
  }, 800);
  try {
    let res;
    try {
      res = await fetch(SCRIPT_URL, { method: "POST", body: JSON.stringify(payload) });
    } catch (e) {
      console.error("[API] Gagal menghubungi server:", e);
      throw new Error("Jaringan terputus atau koneksi tidak stabil.");
    }
    const teks = await res.text();
    if (onProgress) onProgress(100);
    try { return JSON.parse(teks); }
    catch (e) {
      console.error("[API] Respons server bukan JSON. HTTP", res.status, "| Awal isi:", teks.slice(0, 500));
      throw new Error("Respons server tidak valid (HTTP " + res.status + "). Buka Console (F12) untuk detail.");
    }
  } finally {
    clearInterval(intervalAnimasi);
  }
}

// ================= LOGIKA KODE UPLOAD =================
const BATAS_ASLI_BYTE = 15 * 1024 * 1024;
const KOMPRES = {
  sisiMaks: 1600,
  targetByte: 500 * 1024,
  kualitasAwal: 0.8,
  kualitasMin: 0.5,
  batasKeras: 2 * 1024 * 1024
};

function muatGambar(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Gambar tidak dapat dibaca. Gunakan format JPG, PNG, atau WEBP.")); };
    img.src = url;
  });
}

function canvasKeBlob(canvas, kualitas) {
  return new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", kualitas));
}

async function kompresGambar(file) {
  const img = await muatGambar(file);
  let sisi = KOMPRES.sisiMaks;
  let blob = null;
  for (let putaran = 0; putaran < 4; putaran++) {
    const skala = Math.min(1, sisi / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * skala));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * skala));
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    let q = KOMPRES.kualitasAwal;
    while (true) {
      blob = await canvasKeBlob(canvas, q);
      if (!blob) throw new Error("Gagal mengompres gambar.");
      if (blob.size <= KOMPRES.targetByte || q <= KOMPRES.kualitasMin) break;
      q = Math.round((q - 0.1) * 100) / 100;
    }
    if (blob.size <= KOMPRES.targetByte) break;
    sisi = Math.round(sisi * 0.8);
  }
  if (blob.size > KOMPRES.batasKeras) throw new Error("Gambar masih terlalu besar setelah dikompres. Gunakan gambar lain.");
  const dataUrl = await getBase64(blob);
  const nama = file.name.replace(/\.[^.]*$/, "") + ".jpg";
  return { dataUrl, nama };
}

document.getElementById('inputFile').addEventListener('change', function() {
  const containerKode = document.getElementById('containerKodeUpload');
  const inputKode = document.getElementById('inputKodeUpload');
  if (this.files.length > 0) {
    containerKode.classList.remove('hidden');
    inputKode.setAttribute('required', 'true');
  } else {
    containerKode.classList.add('hidden');
    inputKode.removeAttribute('required');
    inputKode.value = "";
  }
});

// ================= KIRIM ADUAN =================
async function kirimAduan(e) {
  e.preventDefault();
  const inputRincian = document.getElementById("inputRincian").value;
  if(!inputRincian) return tampilkanModal("error", "Perhatian", "Rincian aduan wajib diisi!");
  const btn = document.getElementById("btnSubmitAduan");
  const fileInput = document.getElementById('inputFile');
  const kodeUpload = document.getElementById("inputKodeUpload").value;
  let fileData = null;
  let fileName = null;

  if (fileInput.files.length > 0) {
    if (!kodeUpload) return tampilkanModal("error", "Kode Upload Kosong", "Anda melampirkan file. Mohon masukkan Kode Upload khusus agar laporan dapat diteruskan.");
    const file = fileInput.files[0];
    if (!file.type.startsWith("image/")) {
      return tampilkanModal("error", "Jenis File Tidak Diizinkan", "Lampiran hanya boleh berupa gambar (JPG, PNG, atau WEBP).");
    }
    if (file.size > BATAS_ASLI_BYTE) {
      return tampilkanModal("error", "Ukuran Terlalu Besar", "Ukuran foto asli maksimal 15MB. Gambar akan dikompres otomatis saat dikirim.");
    }
    btn.disabled = true;
    btn.innerText = "Memverifikasi Kode Upload...";
    try {
      const cek = await panggilAPI({ action: "cekKodeUpload", kodeUpload: kodeUpload });
      if (cek.status !== "success") {
        btn.disabled = false;
        btn.innerText = "Kirim Laporan Pengaduan";
        return tampilkanModal("error", "Kode Ditolak", cek.message || "Kode Upload tidak valid!");
      }
      btn.innerText = "Mengompres Gambar...";
      const hasil = await kompresGambar(file);
      fileData = hasil.dataUrl;
      fileName = hasil.nama;
    } catch (err) {
      btn.disabled = false;
      btn.innerText = "Kirim Laporan Pengaduan";
      return tampilkanModal("error", "Gagal Memproses Lampiran", err.message);
    }
  }

  btn.disabled = true;
  btn.innerText = "Memproses Laporan...";
  const payload = {
    action: "submitAduan",
    nama: document.getElementById("inputNama").value,
    email: document.getElementById("inputEmail").value,
    kategori: document.getElementById("inputKategori").value,
    rincian: inputRincian,
    fileData: fileData,
    fileName: fileName,
    kodeUpload: fileData ? kodeUpload : ""
  };
  const progressContainer = document.getElementById('uploadProgressContainer');
  const progressBar = document.getElementById('uploadProgressBar');
  const progressText = document.getElementById('uploadProgressText');
  progressContainer.classList.remove('hidden');

  try {
    const result = await panggilAPIProgress(payload, (percent) => {
      progressBar.style.width = percent + '%';
      progressText.innerText = percent + '%';
    });
    
    if (result.status === "error_waktu") {
      tampilkanModal("error", "Di Luar Jam Operasional", result.message);
    } else if (result.status === "error_kode") {
      tampilkanModal("error", "Kode Ditolak", result.message);
    } else if (result.status === "error_upload") {
      tampilkanModal("error", "Lampiran Gagal Diunggah", result.message);
    } else if (result.status === "success") {
      tampilkanModal("success", "Laporan Berhasil Dikirim!", `Silakan simpan Nomor Tiket Anda untuk melacak status:<br><br><span class="font-mono text-lg bg-emerald-50 text-emerald-800 px-3 py-1 rounded border border-emerald-200">${result.ticketId}</span>`);
      
      document.getElementById("formAduan").reset();
      document.getElementById('containerKodeUpload').classList.add('hidden');
      localStorage.removeItem("draftAduan");
    } else {
      tampilkanModal("error", "Gagal Mengirim", result.message || "Terjadi kesalahan sistem saat memproses lampiran.");
    }
  } catch (err) {
    tampilkanModal("error", "Kendala Jaringan", err.message);
  } finally {
    setTimeout(() => {
      progressContainer.classList.add('hidden');
      progressBar.style.width = '0%';
      progressText.innerText = '0%';
      btn.disabled = false;
      btn.innerText = "Kirim Laporan Pengaduan";
    }, 1000);
  }
}

// ================= LACAK TIKET & TIMELINE =================
async function lacakTiket() {
  const input = document.getElementById("inputTiketCari");
  const ticketId = input.value.trim();
  const hasil = document.getElementById("hasilLacak");
  const btn = document.getElementById("btnLacak");
  const progressContainer = document.getElementById("lacakProgressContainer");
  const progressBar = document.getElementById("lacakProgressBar");
  const progressText = document.getElementById("lacakProgressText");

  if (!ticketId) return tampilkanModal("error", "Perhatian", "Masukkan nomor tiket!");
  if (btn.disabled) return; // cegah klik ganda saat proses berjalan

  hasil.classList.add("hidden");
  btn.disabled = true;
  btn.innerText = "Memproses...";
  input.disabled = true;

  // Mulai dari 5% agar bar langsung terlihat bergerak
  progressBar.style.width = "5%";
  progressText.innerText = "5%";
  progressContainer.classList.remove("hidden");

  try {
    const result = await panggilAPIProgress(
      { action: "lacakAduan", ticketId: ticketId },
      (percent) => {
        progressBar.style.width = percent + "%";
        progressText.innerText = percent + "%";
      }
    );

    if (result.status === "success") {
      document.getElementById("lacakTiketId").innerText = result.data.ticketId;

      const statusSaatIni = result.data.status || "Menunggu Tindak Lanjut";
      const tanggalMasuk = result.data.tanggal || "-";
      const tindakLanjut = result.data.tindakLanjut || "Belum ada catatan dari petugas.";

      renderTimeline(statusSaatIni, tanggalMasuk, tindakLanjut);
      hasil.classList.remove("hidden");
    } else {
      console.warn("[API] lacakAduan ditolak server:", result);
      tampilkanModal("error", "Tidak Ditemukan", result.message || "Nomor tiket tidak ditemukan.");
    }
  } catch (err) {
    tampilkanModal("error", "Kendala Jaringan", err.message || "Gagal menghubungi server. Silakan coba lagi.");
  } finally {
    setTimeout(() => {
      progressContainer.classList.add("hidden");
      progressBar.style.width = "0%";
      progressText.innerText = "0%";
      btn.disabled = false;
      btn.innerText = "Cek Status";
      input.disabled = false;
    }, 600);
  }
}

// FUNGSI RENDER TIMELINE VISUAL
function renderTimeline(status, tanggalMasuk, catatan) {
  const timelineEl = document.getElementById("timelineContainer");
  
  // Skema Default: Semua tahap berwarna abu-abu (belum aktif)
  let t1 = { status: "Laporan Diterima", desc: `Tercatat pada: ${tanggalMasuk}`, dot: "bg-blue-500", ring: "ring-blue-100", text: "text-blue-800" };
  let t2 = { status: "Sedang Ditelaah", desc: "Menunggu peninjauan petugas...", dot: "bg-slate-300", ring: "ring-slate-100", text: "text-slate-500" };
  let t3 = { status: "Penyelesaian", desc: "Menunggu tindak lanjut akhir.", dot: "bg-slate-300", ring: "ring-slate-100", text: "text-slate-500" };

  // Logika Visual Aktif Berdasarkan Status
  if (status === "Sedang Ditelaah") {
    t2 = { status: "Sedang Ditelaah / Diproses", desc: catatan, dot: "bg-amber-500", ring: "ring-amber-100", text: "text-amber-800" };
  } else if (status === "Selesai") {
    t2 = { status: "Telah Ditelaah", desc: "Laporan telah diverifikasi dan diproses.", dot: "bg-blue-500", ring: "ring-blue-100", text: "text-blue-800" };
    t3 = { status: "Selesai", desc: catatan, dot: "bg-emerald-500", ring: "ring-emerald-100", text: "text-emerald-800" };
  } else if (status === "Ditolak") {
    t2 = { status: "Telah Ditelaah", desc: "Laporan telah diperiksa oleh petugas.", dot: "bg-blue-500", ring: "ring-blue-100", text: "text-blue-800" };
    t3 = { status: "Ditolak / Dikembalikan", desc: catatan, dot: "bg-red-500", ring: "ring-red-100", text: "text-red-800" };
  }

  // Desain HTML Item Timeline
  timelineEl.innerHTML = `
    <!-- Titik 1: Masuk -->
    <div class="relative pl-6">
      <div class="absolute w-3.5 h-3.5 rounded-full -left-[8px] top-1.5 ${t1.dot} ring-4 ${t1.ring}"></div>
      <h3 class="text-xs font-bold ${t1.text} uppercase tracking-wide">${t1.status}</h3>
      <p class="text-[11px] text-slate-500 mt-0.5">${t1.desc}</p>
    </div>
    
    <!-- Titik 2: Proses -->
    <div class="relative pl-6">
      <div class="absolute w-3.5 h-3.5 rounded-full -left-[8px] top-1.5 ${t2.dot} ring-4 ${t2.ring}"></div>
      <h3 class="text-xs font-bold ${t2.text} uppercase tracking-wide">${t2.status}</h3>
      <p class="text-[11px] text-slate-600 mt-0.5 ${(status === 'Sedang Ditelaah') ? 'bg-amber-50 p-2.5 rounded-lg border border-amber-200 font-medium' : ''}">${t2.desc}</p>
    </div>
    
    <!-- Titik 3: Selesai / Ditolak -->
    <div class="relative pl-6">
      <div class="absolute w-3.5 h-3.5 rounded-full -left-[8px] top-1.5 ${t3.dot} ring-4 ${t3.ring}"></div>
      <h3 class="text-xs font-bold ${t3.text} uppercase tracking-wide">${t3.status}</h3>
      <p class="text-[11px] text-slate-600 mt-1 ${(status === 'Selesai' || status === 'Ditolak') ? 'bg-white p-2.5 rounded-lg border border-slate-200 font-medium leading-relaxed' : ''}">${t3.desc}</p>
    </div>
  `;
}

// ================= ADMIN REKAPAN =================
const MIN_PENJELASAN = 10;
const MAKS_PENJELASAN = 1000;
let dataRekapan = [];
let dataTampil = [];
let filterStatusAktif = -1; // -1 = semua, selain itu indeks pada STATUS_OPSI
let itemDiedit = null;

// Paginasi (sisi klien): seluruh data sudah dimuat sekali, lalu dipotong per halaman
const UKURAN_HALAMAN_OPSI = [10, 20, 50];
let halamanAktif = 1;
let ukuranHalaman = (function () {
  try {
    const v = Number(localStorage.getItem("adminUkuranHalaman"));
    return UKURAN_HALAMAN_OPSI.includes(v) ? v : 10;
  } catch (e) { return 10; }
})();

function labelStatus(v) {
  const o = STATUS_OPSI.find(x => x.value === v);
  return o ? o.label : (v || "Menunggu");
}

function tglLokal() {
  const d = new Date();
  const p = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

async function ambilRekapan(kode) {
  const result = await panggilAPI({ action: "getRekapan", kodeAkses: kode });
  if (result.status !== "success") {
    console.warn("[API] getRekapan ditolak server:", result);
    pesanRekapanTerakhir = result.message || "";
    return false;
  }
  kodeAksesAktif = kode;
  try { sessionStorage.setItem(KUNCI_SESI_ADMIN, kode); } catch (e) {}
  if (result.data && result.data.length && !("kategori" in result.data[0])) {
    tampilkanModal("error", "Backend Belum Diperbarui", "Server belum mengirim kolom kategori, jam, dan email. Pasang Code.gs terbaru lalu Deploy &rarr; Manage deployments &rarr; New version.");
  }
  dataRekapan = (result.data || []).map(i => Object.assign({}, i, { status: i.status || STATUS_OPSI[0].value }));
  return true;
}

async function bukaRekapanAdmin() {
  const input = document.getElementById("inputKodeAkses");
  const kode = input.value.trim() || kodeAksesAktif;
  if (!kode) return tampilkanModal("error", "Perhatian", "Masukkan kode akses!");
  const btn = document.getElementById("btnBukaAdmin");
  btn.disabled = true;
  btn.innerText = "Memuat...";
  try {
    const ok = await ambilRekapan(kode);
    if (!ok) {
      // Jika kode di sesi ternyata sudah tidak valid (misal diganti di server), bersihkan sesi
      kodeAksesAktif = "";
      try { sessionStorage.removeItem(KUNCI_SESI_ADMIN); } catch (e) {}
      return tampilkanModal("error", "Gagal", "Kode akses salah atau gagal memuat data." + (pesanRekapanTerakhir ? "<br><br><span class=\"text-xs text-slate-500\">Pesan server: " + esc(pesanRekapanTerakhir) + "</span>" : ""));
    }
    input.value = "";
    document.getElementById("adminAuthBox").classList.add("hidden");
    document.getElementById("adminDataBox").classList.remove("hidden");
    isiFilterKategori();
    terapkanFilter();
  } catch (err) {
    tampilkanModal("error", "Kendala Jaringan", esc(err.message));
  } finally {
    btn.disabled = false;
    btn.innerText = "Buka";
  }
}

async function muatUlangRekapan() {
  const btn = document.getElementById("btnMuatUlang");
  const asal = btn.innerHTML;
  btn.disabled = true;
  btn.innerText = "Memuat...";
  try {
    const ok = await ambilRekapan(kodeAksesAktif);
    if (!ok) {
      keluarAdmin();
      return tampilkanModal("error", "Sesi Berakhir", "Kode akses tidak lagi valid. Silakan masuk kembali.");
    }
    isiFilterKategori();
    terapkanFilter(false); // tetap di halaman yang sama
  } catch (err) {
    tampilkanModal("error", "Kendala Jaringan", esc(err.message));
  } finally {
    btn.disabled = false;
    btn.innerHTML = asal;
  }
}

function keluarAdmin() {
  kodeAksesAktif = "";
  try { sessionStorage.removeItem(KUNCI_SESI_ADMIN); } catch (e) {}
  dataRekapan = [];
  dataTampil = [];
  itemDiedit = null;
  filterStatusAktif = -1;
  halamanAktif = 1;
  document.getElementById("adminCari").value = "";
  document.getElementById("areaCetak").innerHTML = "";
  document.getElementById("adminDaftarKartu").innerHTML = "";
  document.getElementById("adminPaginasi").innerHTML = "";
  document.getElementById("adminDataBox").classList.add("hidden");
  document.getElementById("adminAuthBox").classList.remove("hidden");
}

// ---------- Filter ----------
function isiFilterKategori() {
  const sel = document.getElementById("adminFilterKategori");
  const dipilih = sel.value;
  const daftar = Array.from(new Set(dataRekapan.map(i => i.kategori).filter(Boolean)));
  sel.innerHTML = `<option value="">Semua kategori</option>` + daftar.map(k => `<option value="${esc(k)}">${esc(k)}</option>`).join("");
  sel.value = daftar.includes(dipilih) ? dipilih : "";
}

function setFilterStatus(idx) {
  filterStatusAktif = idx;
  terapkanFilter();
}

function terapkanFilter(resetHalaman = true) {
  const q = document.getElementById("adminCari").value.trim().toLowerCase();
  const kat = document.getElementById("adminFilterKategori").value;
  const st = filterStatusAktif >= 0 ? STATUS_OPSI[filterStatusAktif].value : "";
  dataTampil = dataRekapan.filter(i =>
    (!st || i.status === st) &&
    (!kat || i.kategori === kat) &&
    (!q || [i.ticketId, i.nama, i.rincian, i.tindakLanjut].join(" ").toLowerCase().includes(q))
  );
  if (resetHalaman) halamanAktif = 1;
  const jmlHalaman = Math.max(1, Math.ceil(dataTampil.length / ukuranHalaman));
  if (halamanAktif > jmlHalaman) halamanAktif = jmlHalaman;
  renderStat();
  renderKartu();
}

function renderStat() {
  const wadah = document.getElementById("adminStat");
  const chip = (idx, label, jml) => {
    const aktif = filterStatusAktif === idx;
    return `<button type="button" onclick="setFilterStatus(${idx})" class="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full border text-xs font-semibold transition ${aktif ? "bg-tema-900 text-white border-tema-900" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"}">${esc(label)} <span class="px-1.5 py-0.5 rounded-full text-[10px] ${aktif ? "bg-white/20" : "bg-slate-100"}">${jml}</span></button>`;
  };
  wadah.innerHTML = chip(-1, "Semua", dataRekapan.length) +
    STATUS_OPSI.map((o, idx) => chip(idx, o.label, dataRekapan.filter(i => i.status === o.value).length)).join("");
}

// ---------- Kartu ----------
function renderKartu() {
  const wadah = document.getElementById("adminDaftarKartu");
  const kosong = document.getElementById("adminKosong");
  document.getElementById("adminInfoJumlah").innerText = `${dataTampil.length} laporan sesuai filter dari total ${dataRekapan.length}`;
  wadah.innerHTML = "";
  kosong.classList.toggle("hidden", dataTampil.length > 0);

  const mulai = (halamanAktif - 1) * ukuranHalaman;
  dataTampil.slice(mulai, mulai + ukuranHalaman).forEach(item => {
    const adaLampiran = item.lampiran && item.lampiran.startsWith("http");
    const panjang = (item.rincian || "").length > 180;
    const rn = Number(item.rowNum);
    const kartu = document.createElement("article");
    kartu.className = "bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3";
    kartu.innerHTML = `
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <p class="font-mono text-sm font-bold text-tema-900 break-all">${esc(item.ticketId)}</p>
          <p class="text-[11px] text-slate-500">${esc(item.tanggal)}${item.jam ? " · " + esc(item.jam) : ""}</p>
        </div>
        <span class="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold ${warnaStatus(item.status)}">${esc(labelStatus(item.status))}</span>
      </div>
      <div class="flex flex-wrap gap-1.5 text-[11px]">
        <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold">${esc(item.nama || "Anonim")}</span>
        ${item.kategori ? `<span class="px-2 py-0.5 rounded-md bg-tema-50 text-tema-700">${esc(item.kategori)}</span>` : ""}
      </div>
      <div>
        <p id="rc-${rn}" class="text-sm text-slate-700 leading-relaxed whitespace-pre-line break-words ${panjang ? "clamp-4" : ""}">${esc(item.rincian)}</p>
        ${panjang ? `<button type="button" id="rt-${rn}" onclick="toggleRincian(${rn})" class="text-xs font-semibold text-tema-600 mt-1">Selengkapnya</button>` : ""}
      </div>
      ${item.tindakLanjut ? `<div class="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs"><p class="font-semibold text-slate-700 mb-0.5">Catatan petugas</p><p class="text-slate-600 whitespace-pre-line break-words">${esc(item.tindakLanjut)}</p></div>` : ""}
      <div class="flex gap-2 pt-1">
        ${adaLampiran ? `<a href="${esc(item.lampiran)}" target="_blank" rel="noopener noreferrer" class="flex-1 text-center py-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50">Lihat Lampiran</a>` : ""}
        <button type="button" onclick="bukaFormAksi(${rn})" class="flex-1 py-2.5 rounded-lg bg-tema-600 hover:bg-tema-700 text-white text-xs font-semibold transition">${item.tindakLanjut ? "Perbarui Tindak Lanjut" : "Beri Tindak Lanjut"}</button>
      </div>`;
    wadah.appendChild(kartu);
  });
  renderPaginasi();
}

// ---------- Paginasi ----------
function daftarHalaman(cur, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const s = new Set([1, total, cur - 1, cur, cur + 1]);
  if (cur <= 3) { s.add(2); s.add(3); s.add(4); }
  if (cur >= total - 2) { s.add(total - 1); s.add(total - 2); s.add(total - 3); }
  const urut = Array.from(s).filter(n => n >= 1 && n <= total).sort((a, b) => a - b);
  const hasil = [];
  urut.forEach((n, i) => {
    if (i > 0 && n - urut[i - 1] > 1) hasil.push("…");
    hasil.push(n);
  });
  return hasil;
}

function renderPaginasi() {
  const wadah = document.getElementById("adminPaginasi");
  const total = dataTampil.length;
  if (!total) { wadah.classList.add("hidden"); wadah.innerHTML = ""; return; }
  wadah.classList.remove("hidden");

  const jml = Math.ceil(total / ukuranHalaman);
  const awal = (halamanAktif - 1) * ukuranHalaman + 1;
  const akhir = Math.min(total, halamanAktif * ukuranHalaman);

  const angka = daftarHalaman(halamanAktif, jml).map(h => {
    if (h === "…") return `<span class="px-1 text-slate-400">…</span>`;
    const aktif = h === halamanAktif;
    return `<button type="button" onclick="keHalaman(${h})" aria-label="Halaman ${h}" ${aktif ? 'aria-current="page"' : ""} class="min-w-[2.25rem] h-9 px-2 rounded-lg text-xs font-semibold border transition ${aktif ? "bg-tema-900 text-white border-tema-900" : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"}">${h}</button>`;
  }).join("");

  const tombolNav = "px-3 h-10 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition";
  wadah.innerHTML = `
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-500">
      <p>Menampilkan <b class="text-slate-700">${awal}–${akhir}</b> dari <b class="text-slate-700">${total}</b> laporan</p>
      <label class="flex items-center gap-2">Per halaman
        <select onchange="ubahUkuranHalaman(this.value)" class="border border-slate-300 rounded-lg bg-white px-2 py-1.5 text-xs">
          ${UKURAN_HALAMAN_OPSI.map(n => `<option value="${n}" ${n === ukuranHalaman ? "selected" : ""}>${n}</option>`).join("")}
        </select>
      </label>
    </div>
    ${jml > 1 ? `
    <div class="flex items-center justify-between gap-2">
      <button type="button" onclick="keHalaman(${halamanAktif - 1})" ${halamanAktif <= 1 ? "disabled" : ""} class="${tombolNav}">&lsaquo; Sebelumnya</button>
      <div class="hidden sm:flex items-center gap-1">${angka}</div>
      <span class="sm:hidden text-xs font-semibold text-slate-600">Hal. ${halamanAktif} / ${jml}</span>
      <button type="button" onclick="keHalaman(${halamanAktif + 1})" ${halamanAktif >= jml ? "disabled" : ""} class="${tombolNav}">Berikutnya &rsaquo;</button>
    </div>` : ""}`;
}

function keHalaman(h) {
  const jml = Math.max(1, Math.ceil(dataTampil.length / ukuranHalaman));
  h = Number(h);
  if (!Number.isInteger(h) || h < 1 || h > jml || h === halamanAktif) return;
  halamanAktif = h;
  renderKartu();
  document.getElementById("adminStat").scrollIntoView({ behavior: "smooth", block: "start" });
}

function ubahUkuranHalaman(v) {
  ukuranHalaman = UKURAN_HALAMAN_OPSI.includes(Number(v)) ? Number(v) : 10;
  try { localStorage.setItem("adminUkuranHalaman", String(ukuranHalaman)); } catch (e) {}
  halamanAktif = 1;
  renderKartu();
}

function toggleRincian(rn) {
  const p = document.getElementById(`rc-${rn}`);
  const b = document.getElementById(`rt-${rn}`);
  const ringkas = p.classList.toggle("clamp-4");
  b.innerText = ringkas ? "Selengkapnya" : "Sembunyikan";
}

// ---------- Form aksi (penjelasan WAJIB) ----------
function bukaFormAksi(rowNum) {
  const item = dataRekapan.find(i => Number(i.rowNum) === Number(rowNum));
  if (!item) return;
  itemDiedit = item;
  document.getElementById("aksiTiket").innerText = item.ticketId;
  document.getElementById("aksiNama").innerText = item.nama || "Anonim";
  document.getElementById("aksiRincian").innerText = item.rincian || "";
  document.getElementById("aksiStatusWadah").innerHTML = STATUS_OPSI.map(o => `
    <label class="cursor-pointer">
      <input type="radio" name="aksiStatus" value="${esc(o.value)}" class="peer sr-only" ${item.status === o.value ? "checked" : ""}>
      <span class="block text-center text-xs font-semibold py-3 rounded-lg border border-slate-300 text-slate-700 peer-checked:bg-tema-600 peer-checked:text-white peer-checked:border-tema-600 peer-focus-visible:ring-2 peer-focus-visible:ring-tema-300 transition">${esc(o.label)}</span>
    </label>`).join("");

  // Penjelasan dikosongkan agar petugas menulis catatan baru; catatan lama hanya jadi rujukan.
  document.getElementById("aksiPenjelasan").value = "";
  const lama = document.getElementById("aksiCatatanLama");
  lama.classList.toggle("hidden", !item.tindakLanjut);
  document.getElementById("aksiCatatanLamaIsi").innerText = item.tindakLanjut || "";
  tampilkanErrorAksi("");
  perbaruiHitungPenjelasan();

  document.getElementById("sheetAksi").classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
  setTimeout(() => document.getElementById("aksiPenjelasan").focus(), 50);
}

function tutupFormAksi() {
  document.getElementById("sheetAksi").classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
  itemDiedit = null;
}

function perbaruiHitungPenjelasan() {
  const n = document.getElementById("aksiPenjelasan").value.length;
  document.getElementById("aksiHitung").innerText = `${n}/${MAKS_PENJELASAN}`;
  if (n >= MIN_PENJELASAN) tampilkanErrorAksi("");
}

function tampilkanErrorAksi(pesan) {
  const el = document.getElementById("aksiError");
  const ta = document.getElementById("aksiPenjelasan");
  el.innerText = pesan;
  el.classList.toggle("hidden", !pesan);
  ta.classList.toggle("border-red-500", !!pesan);
}

document.addEventListener("keydown", e => {
  if (e.key === "Escape" && !document.getElementById("sheetAksi").classList.contains("hidden")) tutupFormAksi();
});

async function simpanTindakLanjut() {
  if (!itemDiedit) return;
  const pilih = document.querySelector('input[name="aksiStatus"]:checked');
  const penjelasan = document.getElementById("aksiPenjelasan").value.trim();
  if (!pilih) return tampilkanErrorAksi("Pilih status terlebih dahulu.");
  if (penjelasan.length < MIN_PENJELASAN) {
    tampilkanErrorAksi(`Penjelasan wajib diisi (minimal ${MIN_PENJELASAN} karakter).`);
    return document.getElementById("aksiPenjelasan").focus();
  }
  const btn = document.getElementById("btnSimpanAksi");
  btn.disabled = true;
  btn.innerText = "Menyimpan...";
  try {
    const result = await panggilAPI({
      action: "updateTindakLanjut",
      kodeAkses: kodeAksesAktif,
      rowNum: itemDiedit.rowNum,
      ticketId: itemDiedit.ticketId,
      status: pilih.value,
      tindakLanjut: penjelasan
    });
    if (result.status === "success") {
      tutupFormAksi();
      tampilkanModal("success", "Tersimpan", "Tindak lanjut diperbarui!");
      muatUlangRekapan();
    } else if (result.status === "forbidden") {
      tutupFormAksi();
      keluarAdmin();
      tampilkanModal("error", "Akses Ditolak", "Kode akses tidak valid. Silakan masuk kembali.");
    } else {
      tampilkanErrorAksi(result.message || "Gagal menyimpan. Coba lagi.");
    }
  } catch (err) {
    tampilkanErrorAksi("Kendala jaringan. Coba lagi.");
  } finally {
    btn.disabled = false;
    btn.innerText = "Simpan";
  }
}

// ---------- Unduh Excel ----------
function filterAktifTeks() {
  const bagian = [];
  if (filterStatusAktif >= 0) bagian.push("Status: " + STATUS_OPSI[filterStatusAktif].label);
  const kat = document.getElementById("adminFilterKategori").value;
  if (kat) bagian.push("Kategori: " + kat);
  const q = document.getElementById("adminCari").value.trim();
  if (q) bagian.push(`Pencarian: "${q}"`);
  return bagian.length ? bagian.join(" | ") : "Semua data";
}

function unduhExcel() {
  if (!dataTampil.length) return tampilkanModal("error", "Tidak Ada Data", "Tidak ada data untuk diunduh.");
  const baris = dataTampil.map((i, n) => ({
    "No": n + 1,
    "No. Tiket": i.ticketId,
    "Tanggal": i.tanggal,
    "Jam": i.jam || "",
    "Nama Pelapor": i.nama,
    "Email": i.email || "",
    "Kategori": i.kategori || "",
    "Rincian Aduan": i.rincian,
    "Lampiran": i.lampiran && i.lampiran.startsWith("http") ? i.lampiran : "-",
    "Status": labelStatus(i.status),
    "Tindak Lanjut": i.tindakLanjut || ""
  }));
  const nama = `Rekapan-Aduan_${tglLokal()}`;

  if (typeof XLSX === "undefined") return unduhCsv(baris, nama); // cadangan bila pustaka SheetJS gagal dimuat

  const ws = XLSX.utils.json_to_sheet(baris);
  ws["!cols"] = [{ wch: 5 }, { wch: 14 }, { wch: 12 }, { wch: 7 }, { wch: 22 }, { wch: 26 }, { wch: 24 }, { wch: 60 }, { wch: 30 }, { wch: 12 }, { wch: 50 }];
  const ringkas = [["Rekapan Pengaduan"], ["Dicetak", tglLokal()], ["Filter", filterAktifTeks()], [], ["Status", "Jumlah"]]
    .concat(STATUS_OPSI.map(o => [o.label, dataTampil.filter(i => i.status === o.value).length]))
    .concat([["Total", dataTampil.length]]);
  const wsR = XLSX.utils.aoa_to_sheet(ringkas);
  wsR["!cols"] = [{ wch: 20 }, { wch: 40 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Rekapan");
  XLSX.utils.book_append_sheet(wb, wsR, "Ringkasan");
  XLSX.writeFile(wb, nama + ".xlsx");
}

function unduhCsv(baris, nama) {
  const kolom = Object.keys(baris[0]);
  const sel = v => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [kolom.map(sel).join(",")].concat(baris.map(b => kolom.map(k => sel(b[k])).join(","))).join("\r\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = nama + ".csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ---------- Cetak rekapan ----------
function tungguGambar(wadah) {
  const daftar = Array.from(wadah.querySelectorAll("img"));
  return Promise.all(daftar.map(img => img.complete ? Promise.resolve() : new Promise(res => {
    img.onload = img.onerror = res;
    setTimeout(res, 3000);
  })));
}

async function cetakRekapan() {
  if (!dataTampil.length) return tampilkanModal("error", "Tidak Ada Data", "Tidak ada data untuk dicetak.");
  const waktu = new Date().toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" });
  // Logo yang sama dengan header & favicon (config.js -> logoUrl); cadangan: ikon favicon di <head>
  const linkIkon = document.querySelector('link[rel~="icon"]');
  const logoSrc = CONFIG_HEADER.logoUrl || (linkIkon ? linkIkon.href : "");
  const logo = logoSrc ? `<img src="${esc(logoSrc)}" alt="" class="cetak-logo" onerror="this.style.display='none'">` : "";
  
  const baris = dataTampil.map((i, n) => `
    <tr>
      <td>${n + 1}</td>
      <td>
        <div class="cetak-subjudul">${esc(i.nama || "Anonim")}</div>
        <div class="mono">${esc(i.ticketId)}</div>
        <div class="kecil">${esc(i.tanggal)}${i.jam ? " " + esc(i.jam) : ""}</div>
      </td>
      <td>
        <div class="cetak-subjudul">${esc(i.kategori || "-")}</div>
        <div class="cetak-uraian">${esc(i.rincian)}</div>
      </td>
      <td>
        <div class="cetak-subjudul">${esc(labelStatus(i.status))}</div>
        <div class="cetak-uraian">${esc(i.tindakLanjut || "-")}</div>
      </td>
    </tr>`).join("");

  document.getElementById("areaCetak").innerHTML = `
    <div class="cetak-kop">
      ${logo}
      <div>
        <div class="kecil">${esc(CONFIG_HEADER.namaPemda)}</div>
        <h1>Rekapan ${esc(CONFIG_HEADER.namaAplikasi)}</h1>
      </div>
    </div>
    <p class="kecil">Dicetak: ${esc(waktu)} &nbsp;|&nbsp; ${esc(filterAktifTeks())} &nbsp;|&nbsp; Total: ${dataTampil.length} laporan</p>
    <table class="cetak-tabel">
      <thead>
        <tr>
          <th>No</th>
          <th>Pelapor &amp; Tiket</th>
          <th>Kategori &amp; Rincian Aduan</th>
          <th>Status &amp; Tindak Lanjut</th>
        </tr>
      </thead>
      <tbody>${baris}</tbody>
    </table>`;
  await tungguGambar(document.getElementById("areaCetak"));
  window.print();
}
