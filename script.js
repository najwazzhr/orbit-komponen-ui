/**
 * ORBIT — Interaktivitas Antarmuka Pengguna
 * Menerapkan pola state -> render, Constraint Validation API,
 * navigasi disclosure aksesibel, dan modal konfirmasi <dialog>.
 */

// ============================================================================
// 1. State Aplikasi Terpusat
// ============================================================================
const state = {
  pesanan: new Map(),
  aksiDialog: null,
};

// ============================================================================
// 2. Komponen 1: Navigasi Aktif & Toggle Menu Ponsel (Disclosure Pattern)
// ============================================================================
const tombolMenu = document.querySelector("#tombol-menu");
const menuUtama = document.querySelector("#menu-utama");
const tautanNavigasi = document.querySelectorAll("#menu-utama a");
const mediaMobile = window.matchMedia("(max-width: 640px)");

function sorotPanelSementara(elemen) {
  if (!elemen) return;
  elemen.classList.add("disorot");
  setTimeout(() => elemen.classList.remove("disorot"), 1400);
}

function aturNavigasiAktif(tautanDipilih) {
  tautanNavigasi.forEach((link) => link.removeAttribute("aria-current"));
  tautanDipilih.setAttribute("aria-current", "page");
}

tautanNavigasi.forEach((link) => {
  link.addEventListener("click", () => {
    aturNavigasiAktif(link);

    const tujuan = link.dataset.nav;
    if (tujuan === "beranda") {
      // Tampilkan semua jadwal kembali saat Beranda dipilih
      formFilter.reset();
      validasiInputTujuan();
      terapkanFilter();
    } else if (tujuan === "cari-rute") {
      // Fokuskan kursor langsung ke input pencarian rute
      setTimeout(() => inputTujuan.focus(), 100);
      sorotPanelSementara(document.querySelector("#filter-section"));
    } else if (tujuan === "pesanan") {
      sorotPanelSementara(document.querySelector("#panel-pesanan"));
    } else if (tujuan === "bantuan") {
      sorotPanelSementara(document.querySelector("#bantuan-section"));
    }

    if (mediaMobile.matches) {
      aturMenuPonsel(false);
    }
  });
});

// Sinkronkan sorotan biru berdasarkan hash URL saat halaman pertama kali dimuat
function sinkronkanHashAwal() {
  const hash = window.location.hash;
  if (!hash) return;
  const linkCocok = document.querySelector(`#menu-utama a[href="${hash}"]`);
  if (linkCocok) {
    aturNavigasiAktif(linkCocok);
  }
}

function sinkronkanMenuViewport() {
  if (mediaMobile.matches) {
    menuUtama.hidden = true;
    tombolMenu.setAttribute("aria-expanded", "false");
  } else {
    menuUtama.hidden = false;
    tombolMenu.setAttribute("aria-expanded", "true");
  }
}

function aturMenuPonsel(terbuka) {
  menuUtama.hidden = !terbuka;
  tombolMenu.setAttribute("aria-expanded", String(terbuka));
}

tombolMenu.addEventListener("click", () => {
  const sedangTerbuka = tombolMenu.getAttribute("aria-expanded") === "true";
  aturMenuPonsel(!sedangTerbuka);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && mediaMobile.matches && !menuUtama.hidden) {
    aturMenuPonsel(false);
    tombolMenu.focus();
  }
});

mediaMobile.addEventListener("change", sinkronkanMenuViewport);
sinkronkanMenuViewport();
sinkronkanHashAwal();

// ============================================================================
// 3. Komponen 2 & 3: Validasi Filter Rute & Penyaringan Kartu Trip
// ============================================================================
const formFilter = document.querySelector("#form-filter");
const inputTujuan = document.querySelector("#input-tujuan");
const pilihLayanan = document.querySelector("#pilih-layanan");
const galatTujuan = document.querySelector("#galat-tujuan");
const tombolCari = document.querySelector("#tombol-cari");
const tombolResetFilter = document.querySelector("#tombol-reset-filter");
const statusFilter = document.querySelector("#status-filter");
const jumlahHasil = document.querySelector("#jumlah-hasil");
const semuaKartuTrip = document.querySelectorAll(".kartu-trip");

function validasiInputTujuan() {
  const nilai = inputTujuan.value.trim();

  if (nilai.length > 0 && nilai.length < 3) {
    inputTujuan.setCustomValidity("Masukkan minimal 3 karakter nama rute atau lokasi.");
    inputTujuan.setAttribute("aria-invalid", "true");
    galatTujuan.textContent = inputTujuan.validationMessage;
    return false;
  }

  inputTujuan.setCustomValidity("");
  inputTujuan.removeAttribute("aria-invalid");
  galatTujuan.textContent = "";
  return true;
}

inputTujuan.addEventListener("input", validasiInputTujuan);

function terapkanFilter() {
  const kataKunci = inputTujuan.value.trim().toLowerCase();
  const jenisDipilih = pilihLayanan.value;
  let totalTampil = 0;

  semuaKartuTrip.forEach((kartu) => {
    const rute = kartu.dataset.rute.toLowerCase();
    const driver = kartu.dataset.driver.toLowerCase();
    const jenis = kartu.dataset.jenis;

    const cocokKata = kataKunci === "" || rute.includes(kataKunci) || driver.includes(kataKunci);
    const cocokJenis = jenisDipilih === "semua" || jenis === jenisDipilih;
    const tampil = cocokKata && cocokJenis;

    kartu.hidden = !tampil;
    if (tampil) totalTampil += 1;
  });

  jumlahHasil.textContent = `${totalTampil} jadwal aktif`;
  statusFilter.textContent =
    totalTampil > 0
      ? `Menampilkan ${totalTampil} jadwal yang sesuai.`
      : "Tidak ada jadwal yang cocok dengan filter tersebut.";
}

formFilter.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!validasiInputTujuan()) {
    inputTujuan.focus();
    return;
  }

  tombolCari.disabled = true;
  tombolCari.setAttribute("aria-busy", "true");
  tombolCari.textContent = "Mencari…";

  setTimeout(() => {
    terapkanFilter();
    tombolCari.disabled = false;
    tombolCari.removeAttribute("aria-busy");
    tombolCari.textContent = "Cari Jadwal";
  }, 250);
});

tombolResetFilter.addEventListener("click", () => {
  formFilter.reset();
  validasiInputTujuan();
  terapkanFilter();
  statusFilter.textContent = "Filter dikembalikan ke semua jadwal.";
});

// ============================================================================
// 4. Komponen 4: Ringkasan Pesanan & Kalkulator Tarif (State -> Render)
// ============================================================================
const daftarPesananEl = document.querySelector("#daftar-pesanan");
const totalItemEl = document.querySelector("#total-item");
const totalTarifEl = document.querySelector("#total-tarif");
const tombolKonfirmasi = document.querySelector("#tombol-konfirmasi");
const tombolBatalkan = document.querySelector("#tombol-batalkan");
const statusPesananEl = document.querySelector("#status-pesanan");

function formatRupiah(angka) {
  return `Rp${angka.toLocaleString("id-ID")}`;
}

function renderPesanan() {
  daftarPesananEl.innerHTML = "";
  let totalItem = 0;
  let totalTarif = 0;

  if (state.pesanan.size === 0) {
    const itemKosong = document.createElement("li");
    itemKosong.className = "kosong";
    itemKosong.textContent = "Belum ada jadwal yang dipilih.";
    daftarPesananEl.appendChild(itemKosong);
  } else {
    state.pesanan.forEach((item) => {
      totalItem += item.jumlah;
      totalTarif += item.tarif * item.jumlah;

      const li = document.createElement("li");
      li.className = "item-pesanan";
      li.innerHTML = `
        <div>
          <strong>${item.driver}</strong><br>
          <span>${item.rute} · ${formatRupiah(item.tarif)}</span>
        </div>
        <div class="kontrol-jumlah">
          <button
            class="tombol-sekunder tombol-mini"
            type="button"
            data-aksi="kurang"
            data-id="${item.id}"
            aria-label="Kurangi pesanan ${item.driver}"
          >−</button>
          <span>${item.jumlah}</span>
          <button
            class="tombol-sekunder tombol-mini"
            type="button"
            data-aksi="tambah"
            data-id="${item.id}"
            aria-label="Tambah pesanan ${item.driver}"
          >+</button>
        </div>
      `;
      daftarPesananEl.appendChild(li);
    });
  }

  totalItemEl.textContent = String(totalItem);
  totalTarifEl.textContent = formatRupiah(totalTarif);

  const adaPesanan = totalItem > 0;
  tombolKonfirmasi.disabled = !adaPesanan;
  tombolBatalkan.disabled = !adaPesanan;
}

semuaKartuTrip.forEach((kartu) => {
  const tombolPesan = kartu.querySelector(".tombol-pesan");
  tombolPesan.addEventListener("click", () => {
    const { id, driver, rute, tarif } = kartu.dataset;
    const itemLama = state.pesanan.get(id);

    if (itemLama) {
      itemLama.jumlah += 1;
    } else {
      state.pesanan.set(id, {
        id,
        driver,
        rute,
        tarif: Number(tarif),
        jumlah: 1,
      });
    }

    renderPesanan();
    statusPesananEl.textContent = `${driver} ditambahkan ke ringkasan pesanan.`;
  });
});

daftarPesananEl.addEventListener("click", (event) => {
  const tombol = event.target.closest("button[data-aksi]");
  if (!tombol) return;

  const { aksi, id } = tombol.dataset;
  const item = state.pesanan.get(id);
  if (!item) return;

  if (aksi === "tambah") {
    item.jumlah += 1;
  } else if (aksi === "kurang") {
    item.jumlah -= 1;
    if (item.jumlah <= 0) {
      state.pesanan.delete(id);
    }
  }

  renderPesanan();
});

// ============================================================================
// 5. Komponen 5: Dialog Konfirmasi Modal (<dialog>)
// ============================================================================
const dialogKonfirmasi = document.querySelector("#dialog-konfirmasi");
const judulDialog = document.querySelector("#judul-dialog");
const deskripsiDialog = document.querySelector("#deskripsi-dialog");
const tombolDialogTidak = document.querySelector("#dialog-tidak");
const tombolDialogYa = document.querySelector("#dialog-ya");

function bukaDialog(jenisAksi) {
  state.aksiDialog = jenisAksi;

  if (jenisAksi === "checkout") {
    judulDialog.textContent = "Konfirmasi Pembayaran QRIS";
    deskripsiDialog.textContent = `Lanjutkan pembuatan kode QRIS sebesar ${totalTarifEl.textContent} untuk ${totalItemEl.textContent} pesanan?`;
  } else {
    judulDialog.textContent = "Kosongkan Ringkasan Pesanan?";
    deskripsiDialog.textContent = "Semua jadwal tebengan dan jastip yang telah dipilih akan dihapus.";
  }

  dialogKonfirmasi.showModal();
}

tombolKonfirmasi.addEventListener("click", () => bukaDialog("checkout"));
tombolBatalkan.addEventListener("click", () => bukaDialog("reset"));

tombolDialogTidak.addEventListener("click", () => {
  dialogKonfirmasi.close();
});

tombolDialogYa.addEventListener("click", () => {
  const aksi = state.aksiDialog;
  dialogKonfirmasi.close();

  if (aksi === "checkout") {
    const nominal = totalTarifEl.textContent;
    state.pesanan.clear();
    renderPesanan();
    statusPesananEl.textContent = `Kode QRIS (${nominal}) berhasil dibuat. Silakan selesaikan pembayaran dalam 5 menit.`;
  } else if (aksi === "reset") {
    state.pesanan.clear();
    renderPesanan();
    statusPesananEl.textContent = "Ringkasan pesanan telah dikosongkan.";
  }
});