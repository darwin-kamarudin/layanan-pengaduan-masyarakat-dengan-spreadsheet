// ================= UTILITAS & MEMORI LOKAL =================
const KUNCI_SESI_ADMIN = "sesiKodeAksesAdmin";
const KUNCI_CACHE_PENGATURAN = "cachePengaturanInstansi";
let kodeAksesAktif = sessionStorage.getItem(KUNCI_SESI_ADMIN) || "";
let pesanRekapanTerakhir = "";
let intervalJudulId = null;

document.addEventListener("DOMContentLoaded", () => {
  terapkanPengaturanKeConfig(ambilCachePengaturan());
  renderHeader();
  renderKategori();
  muatDraft();
  mulaiJudulBerjalan();
  muatPengaturanServer();
});

function mulaiJudulBerjalan() {
  if (intervalJudulId) clearInterval(intervalJudulId);
  const teksAsli = `${CONFIG_HEADER.namaPemda} - ${CONFIG_HEADER.namaAplikasi}`.trim();
  let teksBerjalan = teksAsli + "       ";
  document.title = teksBerjalan;
  intervalJudulId = setInterval(() => {
    teksBerjalan = teksBerjalan.substring(1) + teksBerjalan.substring(0, 1);
    document.title = teksBerjalan;
  }, 250);
}

function ambilCachePengaturan() {
  try {
    const raw = localStorage.getItem(KUNCI_CACHE_PENGATURAN);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function terapkanPengaturanKeConfig(cfg) {
  if (!cfg || typeof cfg !== "object") return;
  if (cfg.instansiInduk) CONFIG_HEADER.namaPemda = cfg.instansiInduk;
  if (cfg.instansiKerja) CONFIG_HEADER.keterangan = cfg.instansiKerja;
  if (cfg.judulAplikasi) CONFIG_HEADER.namaAplikasi = cfg.judulAplikasi;
  if (cfg.judulRekapan)  CONFIG_HEADER.judulRekapan = cfg.judulRekapan;
  if (cfg.logoUrl)       CONFIG_HEADER.logoUrl = cfg.logoUrl;
  if (cfg.logoUrl) {
    const linkIkon = document.querySelector('link[rel~="icon"]');
    if (linkIkon) linkIkon.href = cfg.logoUrl;
  }
}

async function muatPengaturanServer() {
  try {
    const res = await panggilAPI({ action: "getPengaturan" });
    if (res && res.status === "success" && res.data) {
      try { localStorage.setItem(KUNCI_CACHE_PENGATURAN, JSON.stringify(res.data)); } catch (e) {}
      terapkanPengaturanKeConfig(res.data);
      const tabAktif = ['form', 'lacak', 'admin'].find(t => !document.getElementById(`tab-${t}`).classList.contains('hidden')) || 'form';
      renderHeader();
      ['form', 'lacak', 'admin'].forEach(tab => setGayaTab(tab, tab === tabAktif));
      mulaiJudulBerjalan();
    }
  } catch (e) {}
}

function bukaPengaturan() {
  document.getElementById("setInstansiInduk").value = CONFIG_HEADER.namaPemda || "";
  document.getElementById("setInstansiKerja").value = CONFIG_HEADER.keterangan || "";
  document.getElementById("setJudulAplikasi").value = CONFIG_HEADER.namaAplikasi || "";
  document.getElementById("setJudulRekapan").value = CONFIG_HEADER.judulRekapan || ("Rekapan " + (CONFIG_HEADER.namaAplikasi || "Layanan Pengaduan"));
  document.getElementById("inputLogoUrl").value = CONFIG_HEADER.logoUrl || "";
  document.getElementById("inputFileLogo").value = "";
  document.getElementById("previewLogoPengaturan").src = CONFIG_HEADER.logoUrl || "";
  tampilkanErrorPengaturan("");
  document.getElementById("sheetPengaturan").classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
}

function tutupPengaturan() {
  document.getElementById("sheetPengaturan").classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
}

function tampilkanErrorPengaturan(pesan) {
  const el = document.getElementById("setError");
  el.innerText = pesan;
  el.classList.toggle("hidden", !pesan);
}

function perbaruiPreviewLogoUrl(url) {
  const img = document.getElementById("previewLogoPengaturan");
  img.src = url.trim() || CONFIG_HEADER.logoUrl || "";
}

async function pilihFileLogo(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  try {
    tampilkanErrorPengaturan("");
    const img = await muatGambar(file);
    const maksSisi = 220;
    const skala = Math.min(1, maksSisi / Math.max(img.naturalWidth || 220, img.naturalHeight || 220));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round((img.naturalWidth || 220) * skala));
    canvas.height = Math.max(1, Math.round((img.naturalHeight || 220) * skala));
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    let dataUrl = canvas.toDataURL("image/png");
    if (dataUrl.length > 45000) dataUrl = canvas.toDataURL("image/webp", 0.85);
    document.getElementById("inputLogoUrl").value = dataUrl;
    document.getElementById("previewLogoPengaturan").src = dataUrl;
  } catch (err) {
    tampilkanErrorPengaturan(err.message || "Gagal membaca file logo.");
  }
}

async function simpanPengaturanAdmin() {
  const instansiInduk = document.getElementById("setInstansiInduk").value.trim();
  const instansiKerja = document.getElementById("setInstansiKerja").value.trim();
  const judulAplikasi = document.getElementById("setJudulAplikasi").value.trim();
  const judulRekapan = document.getElementById("setJudulRekapan").value.trim();
  const logoUrl = document.getElementById("inputLogoUrl").value.trim();

  if (!instansiInduk || !instansiKerja || !judulAplikasi || !judulRekapan) {
    return tampilkanErrorPengaturan("Semua kolom wajib diisi.");
  }

  const btn = document.getElementById("btnSimpanPengaturan");
  btn.disabled = true;
  btn.innerText = "Menyimpan...";
  tampilkanErrorPengaturan("");

  try {
    const res = await panggilAPI({
      action: "simpanPengaturan",
      kodeAkses: kodeAksesAktif,
      instansiInduk,
      instansiKerja,
      judulAplikasi,
      judulRekapan,
      logoUrl
    });

    if (res.status === "success") {
      try { localStorage.setItem(KUNCI_CACHE_PENGATURAN, JSON.stringify(res.data)); } catch (e) {}
      terapkanPengaturanKeConfig(res.data);
      renderHeader();
      ['form', 'lacak', 'admin'].forEach(tab => setGayaTab(tab, tab === 'admin'));
      mulaiJudulBerjalan();
      tutupPengaturan();
      tampilkanModal("success", "Pengaturan Disimpan", "Judul header, logo, dan kop rekapan berhasil diperbarui!");
    } else if (res.status === "forbidden") {
      tutupPengaturan();
      keluarAdmin();
      tampilkanModal("error", "Akses Ditolak", "Sesi admin tidak valid. Silakan login kembali.");
    } else {
      tampilkanErrorPengaturan(res.message || "Gagal menyimpan pengaturan.");
    }
  } catch (err) {
    tampilkanErrorPengaturan("Kendala jaringan: " + err.message);
  } finally {
    btn.disabled = false;
    btn.innerText = "Simpan Pengaturan";
  }
}

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

function setGayaTab(tab, aktif) {
  const btn = document.getElementById(`btnTab-${tab}`);
  if (!btn) return;
  const W = warnaHeader();
  const kelasAktif = daftarKelas(W.warnaTabAktif).concat(["text-white", "shadow-sm"]);
  const kelasPasif = daftarKelas(W.warnaTeks).concat(["hover:text-white"]);
  btn.classList.remove(...(aktif ? kelasPasif : kelasAktif));
  btn.classList.add(...(aktif ? kelasAktif : kelasPasif));
}

function renderHeader() {
  const headerEl = document.getElementById("headerInstansi");
  if (!headerEl) return;
  const W = warnaHeader();
  headerEl.className = `${W.warnaLatar} text-white shadow-lg border-b ${W.warnaBorder} font-sans relative z-10`;
  const logoHtml = CONFIG_HEADER.logoUrl 
    ? `<div class="relative shrink-0 flex items-center justify-center mb-1 md:mb-0"><img src="${esc(CONFIG_HEADER.logoUrl)}" alt="Logo" class="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 object-contain relative z-10 p-0.5 filter drop-shadow-xl"></div>` 
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
            <h1 class="text-sm sm:text-lg md:text-xl lg:text-2xl font-black tracking-tight leading-tight drop-shadow-md text-white whitespace-normal break-words sm:truncate">${esc(CONFIG_HEADER.namaAplikasi)}</h1>
            <p class="${W.warnaTeks} text-[9px] md:text-xs font-semibold leading-relaxed max-w-xl whitespace-normal break-words sm:truncate">${esc(CONFIG_HEADER.keterangan)}</p>
          </div>
        </div>
        <div class="flex shrink-0 w-full md:w-auto overflow-x-auto justify-center ${W.warnaAksen} p-1 rounded-xl text-xs font-medium border ${W.warnaBorder} shadow-inner">
          <button onclick="pindahTab('form')" id="btnTab-form" class="tab-btn px-3 py-1.5 whitespace-nowrap flex-1 lg:flex-none text-center">Form Aduan</button>
          <button onclick="pindahTab('lacak')" id="btnTab-lacak" class="tab-btn px-3 py-1.5 whitespace-nowrap flex-1 lg:flex-none text-center">Lacak Status</button>
          <button onclick="pindahTab('admin')" id="btnTab-admin" class="tab-btn px-3 py-1.5 whitespace-nowrap flex-1 lg:flex-none text-center">Admin</button>
        </div>
      </div>
    </div>`;
  ['form', 'lacak', 'admin'].forEach(tab => setGayaTab(tab, tab === 'form'));
}

function renderKategori() {
  const selectKategori = document.getElementById("inputKategori");
  if (!selectKategori || typeof CONFIG_KATEGORI === 'undefined') return;
  selectKategori.innerHTML = "";
  CONFIG_KATEGORI.forEach(kategori => {
    const opt = document.createElement("option");
    opt.value = kategori;
    opt.textContent = kategori;
    selectKategori.appendChild(opt);
  });
  const selLuring = document.getElementById("luringKategori");
  if (selLuring) {
    selLuring.innerHTML = "";
    CONFIG_KATEGORI.forEach(kategori => {
      const opt = document.createElement("option");
      opt.value = kategori;
      opt.textContent = kategori;
      selLuring.appendChild(opt);
    });
  }
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

['inputNama', 'inputEmail', 'inputKategori', 'inputRincian'].forEach(id => {
  document.getElementById(id).addEventListener('input', simpanDraft);
});

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
  if (namaTab === 'admin' && kodeAksesAktif && document.getElementById("adminDataBox").classList.contains("hidden")) {
    bukaRekapanAdmin();
  }
}

function toggleAnonim() {
  const isAnonim = document.getElementById("cekAnonim").checked;
  const inputNama = document.getElementById("inputNama");
  const inputEmail = document.getElementById("inputEmail");
  if (isAnonim) {
    inputNama.value = "Anonim";
    inputNama.readOnly = true;
    inputNama.classList.add("bg-slate-100", "text-slate-500", "cursor-not-allowed");
    inputEmail.value = "";
    inputEmail.disabled = true;
    inputEmail.classList.add("bg-slate-100", "cursor-not-allowed");
  } else {
    inputNama.value = "";
    inputNama.readOnly = false;
    inputNama.classList.remove("bg-slate-100", "text-slate-500", "cursor-not-allowed");
    inputEmail.disabled = false;
    inputEmail.classList.remove("bg-slate-100", "cursor-not-allowed");
  }
}

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
  setTimeout(() => { content.classList.remove('scale-95'); content.classList.add('scale-100'); }, 10);
}

// Data tiket yang menunggu untuk dijadikan gambar saat tombol "Saya Mengerti" diklik
let tiketTertunda = null;

async function simpanTiketSebagaiGambar(data) {
  try {
    // Nama instansi induk dan instansi kerja mengikuti CONFIG_HEADER:
    // otomatis berisi data sheet "Pengaturan" jika ada, jika kosong memakai bawaan config.js (header halaman)
    document.getElementById('kartuTiketPemda').textContent = CONFIG_HEADER.namaPemda || '';
    document.getElementById('kartuTiketApp').textContent = CONFIG_HEADER.namaAplikasi || '';
    const elKerja = document.getElementById('kartuTiketKerja');
    elKerja.textContent = CONFIG_HEADER.keterangan || '';
    elKerja.style.display = CONFIG_HEADER.keterangan ? 'block' : 'none';
    document.getElementById('kartuTiketPemda').style.display = CONFIG_HEADER.namaPemda ? 'block' : 'none';

    document.getElementById('kartuTiketNomor').textContent = data.ticketId;
    document.getElementById('kartuTiketTanggal').textContent = data.tanggal;
    document.getElementById('kartuTiketKategori').textContent = data.kategori || '-';

    // samakan warna header kartu dengan tema halaman
    const headerAsli = document.getElementById('headerInstansi');
    if (headerAsli) {
      document.getElementById('kartuTiketHead').style.background = getComputedStyle(headerAsli).backgroundColor;
    }

    const canvas = await html2canvas(document.getElementById('kartuTiket'), {
      scale: 2, backgroundColor: null, useCORS: true
    });
    const link = document.createElement('a');
    link.download = 'Tiket-' + data.ticketId + '.png';
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('Gagal membuat gambar tiket:', err);
  }
}

function tutupModal() {
  const modal = document.getElementById('customModal');
  const content = document.getElementById('modalContent');
  content.classList.remove('scale-100');
  content.classList.add('scale-95');
  setTimeout(() => {
    modal.classList.add('hidden');
    document.getElementById('modalTombol').innerText = 'Saya Mengerti';
  }, 200);

  // Jika modal yang ditutup adalah modal tiket, simpan otomatis sebagai gambar
  if (tiketTertunda) {
    const data = tiketTertunda;
    tiketTertunda = null;
    simpanTiketSebagaiGambar(data);
  }
}

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
  catch (e) { throw new Error("Respons server tidak valid (HTTP " + res.status + ")."); }
}

async function panggilAPIProgress(payload, onProgress) {
  let progress = 0;
  const intervalAnimasi = setInterval(() => {
    progress += Math.floor(Math.random() * 15) + 5; 
    if (progress > 90) progress = 90; 
    if (onProgress) onProgress(progress);
  }, 800);
  try {
    const res = await fetch(SCRIPT_URL, { method: "POST", body: JSON.stringify(payload) });
    const teks = await res.text();
    if (onProgress) onProgress(100);
    return JSON.parse(teks);
  } finally {
    clearInterval(intervalAnimasi);
  }
}

const BATAS_ASLI_BYTE = 15 * 1024 * 1024;
const KOMPRES = { sisiMaks: 1600, targetByte: 500 * 1024, kualitasAwal: 0.8, kualitasMin: 0.5, batasKeras: 2 * 1024 * 1024 };

function muatGambar(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Gambar tidak dapat dibaca.")); };
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
      if (!blob) break;
      if (blob.size <= KOMPRES.targetByte || q <= KOMPRES.kualitasMin) break;
      q = Math.round((q - 0.1) * 100) / 100;
    }
    if (blob.size <= KOMPRES.targetByte) break;
    sisi = Math.round(sisi * 0.8);
  }
  if (blob.size > KOMPRES.batasKeras) throw new Error("Gambar masih terlalu besar setelah dikompres.");
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

// ===== ANTI TIKET GANDA (idempotensi kirim) =====
// Satu laporan = satu "kunci kirim". Kunci dipakai ulang selama isi laporan tidak berubah,
// sehingga jika respons hilang karena koneksi putus lalu pelapor menekan kirim lagi,
// server mengenali kiriman yang sama dan mengembalikan tiket yang sudah ada.
const KUNCI_STORAGE_KIRIM = "kunciKirimAduan";

function buatKunciKirim_() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12);
}

function ambilKunciKirim_(sidikJari) {
  try {
    const tersimpan = JSON.parse(localStorage.getItem(KUNCI_STORAGE_KIRIM) || "null");
    if (tersimpan && tersimpan.sidik === sidikJari && tersimpan.kunci) return tersimpan.kunci;
  } catch (e) {}
  const kunci = buatKunciKirim_();
  try { localStorage.setItem(KUNCI_STORAGE_KIRIM, JSON.stringify({ kunci: kunci, sidik: sidikJari })); } catch (e) {}
  return kunci;
}

function hapusKunciKirim_() {
  try { localStorage.removeItem(KUNCI_STORAGE_KIRIM); } catch (e) {}
}

// Kirim otomatis diulang bila koneksi gagal. Aman diulang karena server memakai kunci kirim yang sama.
async function kirimDenganUlang_(payload, onProgress, onUlang) {
  const MAKS = 3;
  let errTerakhir;
  for (let i = 1; i <= MAKS; i++) {
    try {
      return await panggilAPIProgress(payload, onProgress);
    } catch (err) {
      errTerakhir = err;
      if (i < MAKS) {
        if (onUlang) onUlang(i + 1, MAKS);
        await new Promise(r => setTimeout(r, 2000 * i));
      }
    }
  }
  throw errTerakhir;
}

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
    if (!kodeUpload) return tampilkanModal("error", "Kode Upload Kosong", "Mohon masukkan Kode Upload khusus.");
    const file = fileInput.files[0];
    if (!file.type.startsWith("image/")) return tampilkanModal("error", "Format Salah", "Lampiran harus berupa gambar.");
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
      return tampilkanModal("error", "Gagal Memproses", err.message);
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
  const sidikJari = [payload.nama, payload.email, payload.kategori, payload.rincian, fileName || "", fileData ? fileData.length : 0].join("\u241F");
  payload.kunciKirim = ambilKunciKirim_(sidikJari);
  const progressContainer = document.getElementById('uploadProgressContainer');
  const progressBar = document.getElementById('uploadProgressBar');
  const progressText = document.getElementById('uploadProgressText');
  progressContainer.classList.remove('hidden');
  try {
    const result = await kirimDenganUlang_(payload, (percent) => {
      progressBar.style.width = percent + '%';
      progressText.innerText = percent + '%';
    }, (ke, maks) => {
      btn.innerText = `Koneksi tidak stabil, mencoba lagi (${ke}/${maks})...`;
    });
    if (result.status === "success") {
      hapusKunciKirim_();
      // simpan data tiket untuk dijadikan gambar saat "Saya Mengerti" diklik (ambil sebelum form di-reset)
      const sekarang = new Date();
      tiketTertunda = {
        ticketId: result.ticketId,
        tanggal: sekarang.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) + ' ' +
                 sekarang.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        kategori: document.getElementById("inputKategori").value
      };
      tampilkanModal("success", "Laporan Berhasil Dikirim!", `Simpan Nomor Tiket Anda:<br><br><span class="font-mono text-lg bg-emerald-50 text-emerald-800 px-3 py-1 rounded border border-emerald-200">${result.ticketId}</span><br><br><span class="text-xs text-slate-500">Saat Anda menekan tombol di bawah, gambar tiket akan otomatis tersimpan di perangkat Anda.</span>`);
      document.getElementById('modalTombol').innerText = 'Mengerti dan Simpan Tiket';
      document.getElementById("formAduan").reset();
      document.getElementById('containerKodeUpload').classList.add('hidden');
      localStorage.removeItem("draftAduan");
    } else {
      tampilkanModal("error", "Gagal Mengirim", result.message || "Terjadi kesalahan sistem.");
    }
  } catch (err) {
    tampilkanModal("error", "Koneksi Tidak Stabil", "Konfirmasi dari server tidak sampai ke perangkat Anda, sehingga laporan mungkin sudah tercatat. Isian Anda masih tersimpan. Pastikan koneksi sudah stabil, lalu tekan tombol <b>Kirim Laporan Pengaduan</b> sekali lagi. Sistem akan mengenali kiriman yang sama dan menampilkan nomor tiket yang sudah ada, tanpa membuat tiket ganda.");
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

async function lacakTiket() {
  const input = document.getElementById("inputTiketCari");
  const ticketId = input.value.trim();
  const hasil = document.getElementById("hasilLacak");
  const btn = document.getElementById("btnLacak");
  const progressContainer = document.getElementById("lacakProgressContainer");
  const progressBar = document.getElementById("lacakProgressBar");
  const progressText = document.getElementById("lacakProgressText");
  if (!ticketId) return tampilkanModal("error", "Perhatian", "Masukkan nomor tiket!");
  if (btn.disabled) return;
  hasil.classList.add("hidden");
  btn.disabled = true;
  btn.innerText = "Memproses...";
  input.disabled = true;
  progressBar.style.width = "5%";
  progressText.innerText = "5%";
  progressContainer.classList.remove("hidden");
  try {
    const result = await panggilAPIProgress({ action: "lacakAduan", ticketId: ticketId }, (percent) => {
      progressBar.style.width = percent + "%";
      progressText.innerText = percent + "%";
    });
    if (result.status === "success") {
      document.getElementById("lacakTiketId").innerText = result.data.ticketId;
      renderTimeline(result.data.status || "Menunggu Tindak Lanjut", result.data.tanggal || "-", result.data.tindakLanjut || "Belum ada catatan.");
      hasil.classList.remove("hidden");
    } else {
      tampilkanModal("error", "Tidak Ditemukan", result.message || "Nomor tiket tidak ditemukan.");
    }
  } catch (err) {
    tampilkanModal("error", "Kendala Jaringan", err.message);
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

function renderTimeline(status, tanggalMasuk, catatan) {
  const timelineEl = document.getElementById("timelineContainer");
  let t1 = { status: "Laporan Diterima", desc: `Tercatat pada: ${tanggalMasuk}`, dot: "bg-blue-500", ring: "ring-blue-100", text: "text-blue-800" };
  let t2 = { status: "Sedang Ditelaah", desc: "Menunggu peninjauan petugas...", dot: "bg-slate-300", ring: "ring-slate-100", text: "text-slate-500" };
  let t3 = { status: "Penyelesaian", desc: "Menunggu tindak lanjut akhir.", dot: "bg-slate-300", ring: "ring-slate-100", text: "text-slate-500" };
  if (status === "Sedang Ditelaah") {
    t2 = { status: "Sedang Ditelaah / Diproses", desc: catatan, dot: "bg-amber-500", ring: "ring-amber-100", text: "text-amber-800" };
  } else if (status === "Selesai") {
    t2 = { status: "Telah Ditelaah", desc: "Laporan telah diverifikasi.", dot: "bg-blue-500", ring: "ring-blue-100", text: "text-blue-800" };
    t3 = { status: "Selesai", desc: catatan, dot: "bg-emerald-500", ring: "ring-emerald-100", text: "text-emerald-800" };
  } else if (status === "Ditolak") {
    t2 = { status: "Telah Ditelaah", desc: "Laporan telah diperiksa.", dot: "bg-blue-500", ring: "ring-blue-100", text: "text-blue-800" };
    t3 = { status: "Ditolak / Dikembalikan", desc: catatan, dot: "bg-red-500", ring: "ring-red-100", text: "text-red-800" };
  }
  timelineEl.innerHTML = `
    <div class="relative pl-6">
      <div class="absolute w-3.5 h-3.5 rounded-full -left-[8px] top-1.5 ${t1.dot} ring-4 ${t1.ring}"></div>
      <h3 class="text-xs font-bold ${t1.text} uppercase tracking-wide">${t1.status}</h3>
      <p class="text-[11px] text-slate-500 mt-0.5">${t1.desc}</p>
    </div>
    <div class="relative pl-6">
      <div class="absolute w-3.5 h-3.5 rounded-full -left-[8px] top-1.5 ${t2.dot} ring-4 ${t2.ring}"></div>
      <h3 class="text-xs font-bold ${t2.text} uppercase tracking-wide">${t2.status}</h3>
      <p class="text-[11px] text-slate-600 mt-0.5 ${(status === 'Sedang Ditelaah') ? 'bg-amber-50 p-2.5 rounded-lg border border-amber-200 font-medium' : ''}">${t2.desc}</p>
    </div>
    <div class="relative pl-6">
      <div class="absolute w-3.5 h-3.5 rounded-full -left-[8px] top-1.5 ${t3.dot} ring-4 ${t3.ring}"></div>
      <h3 class="text-xs font-bold ${t3.text} uppercase tracking-wide">${t3.status}</h3>
      <p class="text-[11px] text-slate-600 mt-1 ${(status === 'Selesai' || status === 'Ditolak') ? 'bg-white p-2.5 rounded-lg border border-slate-200 font-medium leading-relaxed' : ''}">${t3.desc}</p>
    </div>`;
}

// ================= ADMIN REKAPAN =================
const MIN_PENJELASAN = 10;
const MAKS_PENJELASAN = 1000;
let dataRekapan = [];
let dataTampil = [];
let filterStatusAktif = -1;
let itemDiedit = null;
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
    pesanRekapanTerakhir = result.message || "";
    return false;
  }
  kodeAksesAktif = kode;
  try { sessionStorage.setItem(KUNCI_SESI_ADMIN, kode); } catch (e) {}
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
      kodeAksesAktif = "";
      try { sessionStorage.removeItem(KUNCI_SESI_ADMIN); } catch (e) {}
      return tampilkanModal("error", "Gagal", "Kode akses salah.");
    }
    input.value = "";
    document.getElementById("adminAuthBox").classList.add("hidden");
    document.getElementById("adminDataBox").classList.remove("hidden");
    isiFilterKategori();
    terapkanFilter();
  } catch (err) {
    tampilkanModal("error", "Kendala Jaringan", err.message);
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
      return tampilkanModal("error", "Sesi Berakhir", "Silakan masuk kembali.");
    }
    isiFilterKategori();
    terapkanFilter(false);
  } catch (err) {
    tampilkanModal("error", "Kendala Jaringan", err.message);
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
  itemKartu = null;
  document.getElementById("sheetKartu").classList.add("hidden");
  filterStatusAktif = -1;
  halamanAktif = 1;
  document.getElementById("adminCari").value = "";
  if (document.getElementById("adminFilterJenis")) document.getElementById("adminFilterJenis").value = "";
  if (document.getElementById("adminFilterBulan")) document.getElementById("adminFilterBulan").value = "";
  if (document.getElementById("adminFilterTahun")) document.getElementById("adminFilterTahun").value = "";
  document.getElementById("areaCetak").innerHTML = "";
  document.getElementById("adminDaftarKartu").innerHTML = "";
  document.getElementById("adminPaginasi").innerHTML = "";
  document.getElementById("adminDataBox").classList.add("hidden");
  document.getElementById("adminAuthBox").classList.remove("hidden");
}

// ---------- Filter & Bulan Tahun ----------
const NAMA_BULAN = [
  { kode: "01", nama: "Januari" }, { kode: "02", nama: "Februari" }, { kode: "03", nama: "Maret" },
  { kode: "04", nama: "April" }, { kode: "05", nama: "Mei" }, { kode: "06", nama: "Juni" },
  { kode: "07", nama: "Juli" }, { kode: "08", nama: "Agustus" }, { kode: "09", nama: "September" },
  { kode: "10", nama: "Oktober" }, { kode: "11", nama: "November" }, { kode: "12", nama: "Desember" }
];

function ekstrakBulanTahun(tglStr) {
  const s = String(tglStr || "").trim();
  let m = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(s);
  if (m) return { bulan: m[2].padStart(2, "0"), tahun: m[3] };
  m = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(s);
  if (m) return { bulan: m[2].padStart(2, "0"), tahun: m[1] };
  return { bulan: "", tahun: "" };
}

function isiFilterKategori() {
  const selKat = document.getElementById("adminFilterKategori");
  const katDipilih = selKat.value;
  const daftarKat = Array.from(new Set(dataRekapan.map(i => i.kategori).filter(Boolean)));
  selKat.innerHTML = `<option value="">Semua kategori</option>` + daftarKat.map(k => `<option value="${esc(k)}">${esc(k)}</option>`).join("");
  selKat.value = daftarKat.includes(katDipilih) ? katDipilih : "";

  const selBulan = document.getElementById("adminFilterBulan");
  if (selBulan) {
    const blnDipilih = selBulan.value;
    selBulan.innerHTML = `<option value="">Semua bulan</option>` + NAMA_BULAN.map(b => `<option value="${b.kode}">${b.nama}</option>`).join("");
    selBulan.value = NAMA_BULAN.some(b => b.kode === blnDipilih) ? blnDipilih : "";
  }

  const selTahun = document.getElementById("adminFilterTahun");
  if (selTahun) {
    const thnDipilih = selTahun.value;
    const tahunUnik = new Set(dataRekapan.map(i => ekstrakBulanTahun(i.tanggal).tahun).filter(Boolean));
    tahunUnik.add(String(new Date().getFullYear()));
    const daftarTahun = Array.from(tahunUnik).sort((a, b) => Number(b) - Number(a));
    selTahun.innerHTML = `<option value="">Semua tahun</option>` + daftarTahun.map(t => `<option value="${esc(t)}">Tahun ${esc(t)}</option>`).join("");
    selTahun.value = daftarTahun.includes(thnDipilih) ? thnDipilih : "";
  }
}

function setFilterStatus(idx) {
  filterStatusAktif = idx;
  terapkanFilter();
}

function terapkanFilter(resetHalaman = true) {
  const q = document.getElementById("adminCari").value.trim().toLowerCase();
  const kat = document.getElementById("adminFilterKategori").value;
  const jns = document.getElementById("adminFilterJenis") ? document.getElementById("adminFilterJenis").value : "";
  const bln = document.getElementById("adminFilterBulan") ? document.getElementById("adminFilterBulan").value : "";
  const thn = document.getElementById("adminFilterTahun") ? document.getElementById("adminFilterTahun").value : "";
  const st = filterStatusAktif >= 0 ? STATUS_OPSI[filterStatusAktif].value : "";

  dataTampil = dataRekapan.filter(i => {
    const bt = ekstrakBulanTahun(i.tanggal);
    return (!st || i.status === st) &&
           (!kat || i.kategori === kat) &&
           (!jns || (i.jenis || "Daring") === jns) &&
           (!bln || bt.bulan === bln) &&
           (!thn || bt.tahun === thn) &&
           (!q || [i.ticketId, i.nama, i.rincian, i.tindakLanjut].join(" ").toLowerCase().includes(q));
  });

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
    const rn = item.uid;
    const kartu = document.createElement("article");
    kartu.className = "bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3";
    kartu.innerHTML = `
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <p class="font-mono text-sm font-bold text-tema-900 break-all">${esc(item.ticketId)}</p>
          <p class="text-[11px] text-slate-500">${esc(item.tanggal)}${item.jam ? "   " + esc(item.jam) : ""}</p>
        </div>
        <span class="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-bold ${warnaStatus(item.status)}">${esc(labelStatus(item.status))}</span>
      </div>
      <div class="flex flex-wrap gap-1.5 text-[11px]">
        <span class="px-2 py-0.5 rounded-md font-bold ${item.jenis === "Luring" ? "bg-amber-100 text-amber-800" : "bg-sky-100 text-sky-800"}">${esc(item.jenis || "Daring")}</span>
        <span class="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold">${esc(item.nama || "Anonim")}</span>
        ${item.kategori ? `<span class="px-2 py-0.5 rounded-md bg-tema-50 text-tema-700">${esc(item.kategori)}</span>` : ""}
      </div>
      <div>
        <p id="rc-${rn}" class="text-sm text-slate-700 leading-relaxed whitespace-pre-line break-words ${panjang ? "clamp-4" : ""}">${esc(item.rincian)}</p>
        ${panjang ? `<button type="button" id="rt-${rn}" onclick="toggleRincian('${rn}')" class="text-xs font-semibold text-tema-600 mt-1">Selengkapnya</button>` : ""}
      </div>
      ${item.tindakLanjut ? `<div class="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs"><p class="font-semibold text-slate-700 mb-0.5">Catatan petugas</p><p class="text-slate-600 whitespace-pre-line break-words">${esc(item.tindakLanjut)}</p></div>` : ""}
      <div class="flex gap-2 pt-1">
        ${adaLampiran ? `<a href="${esc(item.lampiran)}" target="_blank" rel="noopener noreferrer" class="flex-1 text-center py-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50">Lihat Lampiran</a>` : ""}
        <button type="button" onclick="bukaFormAksi('${rn}')" class="flex-1 py-2.5 rounded-lg bg-tema-600 hover:bg-tema-700 text-white text-xs font-semibold transition">${item.tindakLanjut ? "Perbarui Tindak Lanjut" : "Beri Tindak Lanjut"}</button>
      </div>
      <button type="button" onclick="bukaKartu('${rn}')" class="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
        Cetak Kartu Laporan
      </button>`;
    wadah.appendChild(kartu);
  });
  renderPaginasi();
}

function daftarHalaman(cur, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const s = new Set([1, total, cur - 1, cur, cur + 1]);
  if (cur <= 3) { s.add(2); s.add(3); s.add(4); }
  if (cur >= total - 2) { s.add(total - 1); s.add(total - 2); s.add(total - 3); }
  return Array.from(s).filter(n => n >= 1 && n <= total).sort((a, b) => a - b);
}

function renderPaginasi() {
  const wadah = document.getElementById("adminPaginasi");
  const total = dataTampil.length;
  if (!total) { wadah.classList.add("hidden"); wadah.innerHTML = ""; return; }
  wadah.classList.remove("hidden");
  const jml = Math.ceil(total / ukuranHalaman);
  const awal = (halamanAktif - 1) * ukuranHalaman + 1;
  const akhir = Math.min(total, halamanAktif * ukuranHalaman);
  const tombolNav = "px-3 h-10 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition";
  wadah.innerHTML = `
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-500">
      <p>Menampilkan <b class="text-slate-700">${awal} - ${akhir}</b> dari <b class="text-slate-700">${total}</b> laporan</p>
      <label class="flex items-center gap-2">Per halaman
        <select onchange="ubahUkuranHalaman(this.value)" class="border border-slate-300 rounded-lg bg-white px-2 py-1.5 text-xs">
          ${UKURAN_HALAMAN_OPSI.map(n => `<option value="${n}" ${n === ukuranHalaman ? "selected" : ""}>${n}</option>`).join("")}
        </select>
      </label>
    </div>
    ${jml > 1 ? `
    <div class="flex items-center justify-between gap-2">
      <button type="button" onclick="keHalaman(${halamanAktif - 1})" ${halamanAktif <= 1 ? "disabled" : ""} class="${tombolNav}">&lsaquo; Sebelumnya</button>
      <span class="text-xs font-semibold text-slate-600">Hal. ${halamanAktif} /${jml}</span>
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

function bukaFormAksi(uid) {
  const item = dataRekapan.find(i => i.uid === uid);
  if (!item) return;
  itemDiedit = item;
  document.getElementById("aksiTiket").innerText = item.ticketId;
  document.getElementById("aksiNama").innerText = item.nama || "Anonim";
  document.getElementById("aksiRincian").innerText = item.rincian || "";
  document.getElementById("aksiStatusWadah").innerHTML = STATUS_OPSI.map(o => `
    <label class="cursor-pointer">
      <input type="radio" name="aksiStatus" value="${esc(o.value)}" class="peer sr-only" ${item.status === o.value ? "checked" : ""}>
      <span class="block text-center text-xs font-semibold py-3 rounded-lg border border-slate-300 text-slate-700 peer-checked:bg-tema-600 peer-checked:text-white peer-checked:border-tema-600 transition">${esc(o.label)}</span>
    </label>`).join("");
  document.getElementById("aksiPenjelasan").value = "";
  const lama = document.getElementById("aksiCatatanLama");
  lama.classList.toggle("hidden", !item.tindakLanjut);
  document.getElementById("aksiCatatanLamaIsi").innerText = item.tindakLanjut || "";
  tampilkanErrorAksi("");
  perbaruiHitungPenjelasan();
  document.getElementById("sheetAksi").classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
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
  if (e.key === "Escape") {
    if (!document.getElementById("sheetAksi").classList.contains("hidden")) tutupFormAksi();
    if (!document.getElementById("sheetPengaturan").classList.contains("hidden")) tutupPengaturan();
  }
});

async function simpanTindakLanjut() {
  if (!itemDiedit) return;
  const pilih = document.querySelector('input[name="aksiStatus"]:checked');
  const penjelasan = document.getElementById("aksiPenjelasan").value.trim();
  if (!pilih) return tampilkanErrorAksi("Pilih status terlebih dahulu.");
  if (penjelasan.length < MIN_PENJELASAN) return tampilkanErrorAksi(`Penjelasan minimal ${MIN_PENJELASAN} karakter.`);
  const btn = document.getElementById("btnSimpanAksi");
  btn.disabled = true;
  btn.innerText = "Menyimpan...";
  try {
    const result = await panggilAPI({
      action: "updateTindakLanjut",
      kodeAkses: kodeAksesAktif,
      rowNum: itemDiedit.rowNum,
      jenis: itemDiedit.jenis || "Daring",
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
      tampilkanModal("error", "Akses Ditolak", "Silakan login kembali.");
    } else {
      tampilkanErrorAksi(result.message || "Gagal menyimpan.");
    }
  } catch (err) {
    tampilkanErrorAksi("Kendala jaringan.");
  } finally {
    btn.disabled = false;
    btn.innerText = "Simpan";
  }
}

// ================= KARTU LAPORAN PENGADUAN (CETAK / PDF / GAMBAR) =================
let itemKartu = null;
let fotoKartu = null;          // data URL foto lampiran (null = belum/gagal dimuat)
let statusFotoKartu = "none";  // none | loading | ok | gagal
const cacheFotoKartu = {};

function htmlKartuLaporan_(item, statusFoto, fotoSrc) {
  const headerAsli = document.getElementById("headerInstansi");
  const warna = headerAsli ? getComputedStyle(headerAsli).backgroundColor : "#1e293b";
  const waktu = new Date().toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" });
  const jenis = item.jenis || "Daring";
  const baris = (label, isi) => isi ? `
    <tr>
      <td style="width:92px; padding:5px 0; color:#64748b; vertical-align:top;">${label}</td>
      <td style="padding:5px 0; color:#0f172a; font-weight:600; vertical-align:top; word-break:break-word;">${isi}</td>
    </tr>` : "";

  let blokFoto = "";
  if (statusFoto === "loading") {
    blokFoto = `<div style="margin-top:12px; padding:14px; border:1px dashed #cbd5e1; border-radius:8px; text-align:center; font-size:11px; color:#64748b;">Memuat foto lampiran...</div>`;
  } else if (statusFoto === "ok" && fotoSrc) {
    blokFoto = `
      <div style="margin-top:12px;">
        <div style="font-size:11px; font-weight:700; color:#475569; margin-bottom:4px;">Foto Lampiran</div>
        <div style="border:1px solid #cbd5e1; border-radius:8px; padding:6px; text-align:center; background:#f8fafc;">
          <img src="${fotoSrc}" alt="Lampiran" style="max-width:100%; max-height:260px; object-fit:contain; display:inline-block;">
        </div>
      </div>`;
  } else if (statusFoto === "gagal") {
    blokFoto = `<div style="margin-top:12px; padding:10px; border:1px dashed #fca5a5; border-radius:8px; font-size:11px; color:#b91c1c; background:#fef2f2;">Lampiran tersedia, tetapi fotonya tidak dapat ditampilkan pada kartu ini. Buka melalui menu Lihat Lampiran.</div>`;
  }

  const blokTindak = item.tindakLanjut ? `
      <div style="margin-top:12px;">
        <div style="font-size:11px; font-weight:700; color:#475569; margin-bottom:4px;">Catatan Tindak Lanjut</div>
        <div style="border:1px solid #e2e8f0; border-radius:8px; padding:9px 11px; font-size:12px; line-height:1.55; white-space:pre-wrap; word-break:break-word; background:#f8fafc;">${esc(item.tindakLanjut)}</div>
      </div>` : "";

  return `
  <div style="box-sizing:border-box; width:100%; padding:22px 22px 18px; background:#ffffff; color:#0f172a; font-family:system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;">
    <div style="text-align:center; padding-bottom:12px; border-bottom:3px solid ${warna};">
      ${CONFIG_HEADER.namaPemda ? `<div style="font-size:10px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:#475569;">${esc(CONFIG_HEADER.namaPemda)}</div>` : ""}
      <div style="font-size:15px; font-weight:800; line-height:1.3; margin-top:3px;">${esc(CONFIG_HEADER.namaAplikasi || "")}</div>
      ${CONFIG_HEADER.keterangan ? `<div style="font-size:10.5px; font-weight:600; color:#475569; margin-top:3px; line-height:1.4;">${esc(CONFIG_HEADER.keterangan)}</div>` : ""}
    </div>

    <div style="text-align:center; margin:14px 0 10px;">
      <div style="font-size:11px; font-weight:800; letter-spacing:2px; color:#475569;">KARTU LAPORAN PENGADUAN</div>
      <div style="font-family:Consolas,'Courier New',monospace; font-size:22px; font-weight:800; color:#0f172a; margin-top:6px;">${esc(item.ticketId)}</div>
      <div style="display:inline-block; margin-top:4px; padding:2px 10px; border:1px solid #94a3b8; border-radius:999px; font-size:11px; font-weight:700; color:#334155;">${esc(jenis)}</div>
    </div>

    <table style="width:100%; font-size:12px; border-collapse:collapse; border-top:1px solid #e2e8f0; border-bottom:1px solid #e2e8f0;">
      ${baris("Tanggal", esc(item.tanggal) + (item.jam ? " &nbsp;" + esc(item.jam) : ""))}
      ${baris("Pelapor", esc(item.nama || "Anonim"))}
      ${baris("Kontak", esc(item.email || ""))}
      ${baris("Kategori", esc(item.kategori || "-"))}
      ${baris("Status", esc(labelStatus(item.status)))}
    </table>

    <div style="margin-top:12px;">
      <div style="font-size:11px; font-weight:700; color:#475569; margin-bottom:4px;">Rincian Aduan</div>
      <div style="border:1px solid #cbd5e1; border-radius:8px; padding:10px 12px; font-size:12.5px; line-height:1.6; white-space:pre-wrap; word-break:break-word;">${esc(item.rincian || "-")}</div>
    </div>
    ${blokFoto}
    ${blokTindak}

    <div style="margin-top:14px; padding-top:8px; border-top:1px dashed #cbd5e1; font-size:10px; color:#64748b; text-align:right;">Dicetak: ${esc(waktu)}</div>
  </div>`;
}

function statusFotoUntuk_(item) {
  const adaLampiran = item.lampiran && String(item.lampiran).startsWith("http");
  return adaLampiran ? statusFotoKartu : "none";
}

function renderPratinjauKartu_() {
  if (!itemKartu) return;
  document.getElementById("kartuPratinjau").innerHTML = htmlKartuLaporan_(itemKartu, statusFotoUntuk_(itemKartu), fotoKartu);
}

function setTombolKartu_(aktif, teksAktif) {
  [["btnKartuCetak", "Cetak Langsung"], ["btnKartuPdf", "Simpan PDF"], ["btnKartuGambar", "Simpan Gambar"]].forEach(([id, teks]) => {
    const b = document.getElementById(id);
    b.disabled = !aktif;
    b.innerText = teksAktif && !aktif ? teksAktif : teks;
  });
}

async function bukaKartu(uid) {
  const item = dataRekapan.find(i => i.uid === uid);
  if (!item) return;
  itemKartu = item;
  fotoKartu = null;
  const adaLampiran = item.lampiran && String(item.lampiran).startsWith("http");
  statusFotoKartu = adaLampiran ? "loading" : "none";

  document.getElementById("kartuTiketJudul").innerText = item.ticketId;
  renderPratinjauKartu_();
  setTombolKartu_(!adaLampiran);
  document.getElementById("sheetKartu").classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
  if (!adaLampiran) return;

  try {
    if (cacheFotoKartu[item.ticketId]) {
      fotoKartu = cacheFotoKartu[item.ticketId];
    } else {
      const res = await panggilAPI({ action: "getLampiranKartu", kodeAkses: kodeAksesAktif, rowNum: item.rowNum, jenis: item.jenis || "Daring", ticketId: item.ticketId });
      if (res.status === "forbidden") {
        tutupKartu();
        keluarAdmin();
        return tampilkanModal("error", "Akses Ditolak", "Sesi admin tidak valid. Silakan login kembali.");
      }
      if (res.status === "success" && res.dataUrl) {
        fotoKartu = res.dataUrl;
        cacheFotoKartu[item.ticketId] = res.dataUrl;
      }
    }
  } catch (err) { /* ditangani sebagai gagal di bawah */ }

  if (itemKartu !== item) return;   // kartu sudah ditutup / diganti selagi memuat
  statusFotoKartu = fotoKartu ? "ok" : "gagal";
  renderPratinjauKartu_();
  setTombolKartu_(true);
}

function tutupKartu() {
  document.getElementById("sheetKartu").classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
  itemKartu = null;
}

function namaBerkasKartu_() {
  return "Kartu-Aduan_" + String(itemKartu.ticketId).replace(/[^A-Za-z0-9_-]/g, "");
}

async function cetakKartuLangsung() {
  if (!itemKartu) return;
  const lama = document.getElementById("stylePageKartu");
  if (lama) lama.remove();
  const gaya = document.createElement("style");
  gaya.id = "stylePageKartu";
  gaya.textContent = "@page { size: A5 portrait; margin: 8mm; }";
  document.head.appendChild(gaya);

  const area = document.getElementById("areaCetak");
  area.innerHTML = htmlKartuLaporan_(itemKartu, statusFotoUntuk_(itemKartu), fotoKartu);
  await tungguGambar(area);

  const bersihkan = () => {
    gaya.remove();
    area.innerHTML = "";
    window.removeEventListener("afterprint", bersihkan);
  };
  window.addEventListener("afterprint", bersihkan);
  window.print();
}

// Render kartu pada lebar tetap (setara lebar A5) agar hasil gambar/PDF konsisten di semua perangkat
async function buatKanvasKartu_() {
  if (typeof html2canvas === "undefined") throw new Error("Pustaka gambar belum termuat. Periksa koneksi internet lalu coba lagi.");
  const wadah = document.createElement("div");
  wadah.style.cssText = "position:fixed; left:-9999px; top:0; width:560px; background:#ffffff;";
  wadah.innerHTML = htmlKartuLaporan_(itemKartu, statusFotoUntuk_(itemKartu), fotoKartu);
  document.body.appendChild(wadah);
  try {
    await tungguGambar(wadah);
    return await html2canvas(wadah, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
  } finally {
    wadah.remove();
  }
}

async function simpanGambarKartu() {
  if (!itemKartu) return;
  setTombolKartu_(false, "Memproses...");
  try {
    const canvas = await buatKanvasKartu_();
    const link = document.createElement("a");
    link.download = namaBerkasKartu_() + ".png";
    link.href = canvas.toDataURL("image/png");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    tampilkanModal("error", "Gagal Menyimpan Gambar", err.message || "Terjadi kesalahan.");
  } finally {
    setTombolKartu_(true);
  }
}

async function unduhPdfKartu() {
  if (!itemKartu) return;
  setTombolKartu_(false, "Memproses...");
  try {
    if (!window.jspdf || !window.jspdf.jsPDF) throw new Error("Pustaka PDF belum termuat. Periksa koneksi internet lalu coba lagi.");
    const canvas = await buatKanvasKartu_();
    const pdf = new window.jspdf.jsPDF({ unit: "mm", format: "a5", orientation: "portrait" });
    const lebarHal = pdf.internal.pageSize.getWidth();
    const tinggiHal = pdf.internal.pageSize.getHeight();
    const margin = 6;
    const lebar = lebarHal - margin * 2;
    const tinggiIsi = tinggiHal - margin * 2;
    const mmPerPx = lebar / canvas.width;

    if (canvas.height * mmPerPx <= tinggiIsi) {
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", margin, margin, lebar, canvas.height * mmPerPx);
    } else {
      // Isi panjang: bagi menjadi beberapa halaman A5
      const pxPerHal = Math.floor(tinggiIsi / mmPerPx);
      for (let y = 0, hal = 0; y < canvas.height; y += pxPerHal, hal++) {
        const h = Math.min(pxPerHal, canvas.height - y);
        const potongan = document.createElement("canvas");
        potongan.width = canvas.width;
        potongan.height = h;
        const ctx = potongan.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, potongan.width, potongan.height);
        ctx.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
        if (hal > 0) pdf.addPage();
        pdf.addImage(potongan.toDataURL("image/jpeg", 0.95), "JPEG", margin, margin, lebar, h * mmPerPx);
      }
    }
    pdf.save(namaBerkasKartu_() + ".pdf");
  } catch (err) {
    tampilkanModal("error", "Gagal Membuat PDF", err.message || "Terjadi kesalahan.");
  } finally {
    setTombolKartu_(true);
  }
}

// ================= TAMBAH LAYANAN PENGADUAN LURING =================
let kunciLuring = { kunci: "", sidik: "" };

function kunciLuringUntuk_(sidik) {
  if (!kunciLuring.kunci || kunciLuring.sidik !== sidik) kunciLuring = { kunci: buatKunciKirim_(), sidik: sidik };
  return kunciLuring.kunci;
}

function tampilkanErrorLuring(pesan) {
  const el = document.getElementById("luringError");
  el.innerText = pesan;
  el.classList.toggle("hidden", !pesan);
}

function bukaFormLuring() {
  ["luringTanggal", "luringJam", "luringNama", "luringEmail", "luringRincian"].forEach(id => { document.getElementById(id).value = ""; });
  const d = new Date();
  const hariIni = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  document.getElementById("luringTanggal").max = hariIni;
  kunciLuring = { kunci: "", sidik: "" };
  tampilkanErrorLuring("");
  document.getElementById("sheetLuring").classList.remove("hidden");
  document.body.classList.add("overflow-hidden");
}

function tutupFormLuring() {
  document.getElementById("sheetLuring").classList.add("hidden");
  document.body.classList.remove("overflow-hidden");
}

async function simpanAduanLuring() {
  const rincian = document.getElementById("luringRincian").value.trim();
  if (rincian.length < 10) return tampilkanErrorLuring("Rincian aduan wajib diisi (minimal 10 karakter).");

  const payload = {
    action: "tambahAduanLuring",
    kodeAkses: kodeAksesAktif,
    tanggal: document.getElementById("luringTanggal").value,
    jam: document.getElementById("luringJam").value,
    nama: document.getElementById("luringNama").value.trim(),
    email: document.getElementById("luringEmail").value.trim(),
    kategori: document.getElementById("luringKategori").value,
    rincian: rincian
  };
  payload.kunciKirim = kunciLuringUntuk_([payload.tanggal, payload.jam, payload.nama, payload.email, payload.kategori, payload.rincian].join("\u241F"));

  const btn = document.getElementById("btnSimpanLuring");
  btn.disabled = true;
  btn.innerText = "Menyimpan...";
  tampilkanErrorLuring("");
  try {
    const res = await kirimDenganUlang_(payload, null, (ke, maks) => {
      btn.innerText = `Koneksi tidak stabil, mencoba lagi (${ke}/${maks})...`;
    });
    if (res.status === "success") {
      kunciLuring = { kunci: "", sidik: "" };
      tutupFormLuring();
      tampilkanModal("success", "Layanan Luring Tercatat", `Nomor tiket pengaduan:<br><br><span class="font-mono text-lg bg-emerald-50 text-emerald-800 px-3 py-1 rounded border border-emerald-200">${esc(res.ticketId)}</span><br><br><span class="text-xs text-slate-500">Berikan nomor tiket ini kepada pelapor agar dapat memantau status melalui menu Lacak Status.</span>`);
      muatUlangRekapan();
    } else if (res.status === "forbidden") {
      tutupFormLuring();
      keluarAdmin();
      tampilkanModal("error", "Akses Ditolak", "Sesi admin tidak valid. Silakan login kembali.");
    } else {
      tampilkanErrorLuring(res.message || "Gagal menyimpan catatan.");
    }
  } catch (err) {
    tampilkanErrorLuring("Koneksi tidak stabil. Catatan mungkin sudah tersimpan. Tekan Simpan Catatan sekali lagi, sistem tidak akan membuat catatan ganda.");
  } finally {
    btn.disabled = false;
    btn.innerText = "Simpan Catatan";
  }
}

function filterAktifTeks() {
  const bagian = [];
  const bln = document.getElementById("adminFilterBulan") ? document.getElementById("adminFilterBulan").value : "";
  const thn = document.getElementById("adminFilterTahun") ? document.getElementById("adminFilterTahun").value : "";
  if (bln || thn) {
    const infoBulan = NAMA_BULAN.find(b => b.kode === bln);
    const teksPeriode = [infoBulan ? infoBulan.nama : "", thn].filter(Boolean).join(" ");
    bagian.push("Periode: " + teksPeriode);
  }
  if (filterStatusAktif >= 0) bagian.push("Status: " + STATUS_OPSI[filterStatusAktif].label);
  const kat = document.getElementById("adminFilterKategori").value;
  if (kat) bagian.push("Kategori: " + kat);
  const jns = document.getElementById("adminFilterJenis") ? document.getElementById("adminFilterJenis").value : "";
  if (jns) bagian.push("Jenis: " + jns);
  const q = document.getElementById("adminCari").value.trim();
  if (q) bagian.push(`Pencarian: "${q}"`);
  return bagian.length ? bagian.join(" | ") : "Semua data";
}

function unduhExcel() {
  if (!dataTampil.length) return tampilkanModal("error", "Tidak Ada Data", "Tidak ada data untuk diunduh.");
  const baris = dataTampil.map((i, n) => ({
    "No": n + 1, "No. Tiket": i.ticketId, "Jenis Layanan": i.jenis || "Daring", "Tanggal": i.tanggal, "Jam": i.jam || "",
    "Nama Pelapor": i.nama, "Email": i.email || "", "Kategori": i.kategori || "",
    "Rincian Aduan": i.rincian, "Lampiran": i.lampiran || "-",
    "Status": labelStatus(i.status), "Tindak Lanjut": i.tindakLanjut || ""
  }));
  const nama = `Rekapan-Aduan_${tglLokal()}`;
  if (typeof XLSX === "undefined") return unduhCsv(baris, nama);
  const ws = XLSX.utils.json_to_sheet(baris);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Rekapan");
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
}

function tungguGambar(wadah) {
  const daftar = Array.from(wadah.querySelectorAll("img"));
  return Promise.all(daftar.map(img => img.complete ? Promise.resolve() : new Promise(res => {
    img.onload = img.onerror = res;
    setTimeout(res, 3000);
  })));
}

async function cetakRekapan() {
  const sisaGayaKartu = document.getElementById("stylePageKartu");
  if (sisaGayaKartu) sisaGayaKartu.remove();
  if (!dataTampil.length) return tampilkanModal("error", "Tidak Ada Data", "Tidak ada data untuk dicetak.");
  const waktu = new Date().toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" });
  const linkIkon = document.querySelector('link[rel~="icon"]');
  const logoSrc = CONFIG_HEADER.logoUrl || (linkIkon ? linkIkon.href : "");
  const logo = logoSrc ? `<img src="${esc(logoSrc)}" alt="" class="cetak-logo" onerror="this.style.display='none'">` : "";
  const judulCetak = CONFIG_HEADER.judulRekapan || `Rekapan ${CONFIG_HEADER.namaAplikasi}`;
  
  const baris = dataTampil.map((i, n) => `
    <tr>
      <td>${n + 1}</td>
      <td>
        <div class="cetak-subjudul">${esc(i.nama || "Anonim")}</div>
        <div class="mono">${esc(i.ticketId)} (${esc(i.jenis || "Daring")})</div>
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
        <div class="cetak-instansi-induk">${esc(CONFIG_HEADER.namaPemda)}</div>
        <h1>${esc(judulCetak)}</h1>
        <div class="cetak-instansi-kerja">${esc(CONFIG_HEADER.keterangan)}</div>
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
