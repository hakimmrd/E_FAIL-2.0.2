
/* ==========================================
   E-FAIL 2.0
   PERMOHONAN PINJAMAN FAIL
   FAIL UMUM & FAIL PERIBADI
========================================== */

/* 1. KONFIGURASI MODUL */
const konfigurasiPinjaman = {
    umum: {
        form: "formPinjaman", table: "senaraiPinjamanUmum", search: "carianPinjamanUmum", filter: "filterBahagianPinjamanUmum", empty: "pinjamanUmumKosong", count: "jumlahPinjamanUmum", modal: "modalPinjamanUmum", modalTitle: "pinjamanJenisFailUmum",
        fields: { noFail: "pinjamanNoFail", jilid: "pinjamanJilid", tajuk: "pinjamanTajukUmum", peringkat: "pinjamanPeringkatUmum", kategori: "pinjamanKategoriUmum", lokasi: "pinjamanLokasiUmum", status: "pinjamanStatusUmum", keterangan: null, nama: "pinjamanNamaPemohonUmum", jawatan: "pinjamanJawatanPemohonUmum", bahagian: "pinjamanBahagianPemohonUmum", tujuan: "pinjamanTujuanUmum", catatan: "pinjamanCatatanUmum", failId: "pinjamanFailIdUmum", kategoriKod: "pinjamanKategoriKodUmum" }
    },
    peribadi: {
        form: "formPinjamanPeribadi", table: "senaraiPinjamanPeribadi", search: "carianPinjamanPeribadi", filter: "filterBahagianPinjamanPeribadi", empty: "pinjamanPeribadiKosong", count: "jumlahPinjamanPeribadi", modal: "modalPinjamanPeribadi", modalTitle: "pinjamanJenisFailPeribadi",
        fields: { noFail: "pinjamanNoFailPeribadi", jilid: "pinjamanJilidPeribadi", tajuk: "pinjamanTajukPeribadi", peringkat: "pinjamanPeringkatPeribadi", kategori: "pinjamanKategoriPeribadi", lokasi: null, status: "pinjamanStatusPeribadi", keterangan: "pinjamanKeteranganPeribadi", nama: "pinjamanNamaPemohonPeribadi", jawatan: "pinjamanJawatanPemohonPeribadi", bahagian: "pinjamanBahagianPemohonPeribadi", tujuan: "pinjamanTujuanPeribadi", catatan: "pinjamanCatatanPeribadi", failId: "pinjamanFailIdPeribadi", kategoriKod: "pinjamanKategoriKodPeribadi" }
    }
};

let senaraiPilihanPinjaman = { umum: [], peribadi: [] };
let failPinjamanDipilih = { umum: null, peribadi: null };

/* 2. DAPATKAN SENARAI FAIL YANG BOLEH DIPINJAM */
function dapatkanPilihanPinjaman(kategori) {
    const masterlist = typeof carianRekodFail === "function" ? carianRekodFail(kategori) : (typeof dapatkanMasterlist === "function" ? dapatkanMasterlist() : []);
    const semuaPermohonan = dapatkanSenaraiPermohonan();
    const hasil = new Map();

    masterlist.filter(item => item.kategoriKod === kategori).forEach(item => {
        const jilid = Number(item.jilid) || 1;
        const kunci = `${item.idFail || item.id}-${jilid}`;
        if (hasil.has(kunci)) hasil.set(kunci, { ...hasil.get(kunci), ...item });
        else hasil.set(kunci, item);
    });

    return Array.from(hasil.values()).filter(item => {
        if (String(item.statusPinjaman || "Tersedia").toLowerCase() === "dipinjam") return false;

        return !semuaPermohonan.some(request =>
            String(request.failId || "") === String(item.idFail || item.id) &&
            Number(request.jilid) === Number(item.jilid) &&
            String(request.modul || "").toLowerCase().includes("pinjaman") &&
            normalisasiStatus(request.status) === "pending"
        );
    }).map(item => ({
        failId: item.idFail || item.id,
        noFail: item.noFail || "",
        tajuk: item.tajuk || "",
        jilid: Number(item.jilid) || 1,
        kategori,
        peringkat: item.peringkat || "",
        lokasi: item.lokasi || "",
        keterangan: item.keteranganFail || item.keterangan || item.deskripsi || item.keteranganLokasi || "",
        statusJilid: item.statusJilid || "Aktif",
        statusPinjaman: item.statusPinjaman || "Tersedia"
    })).sort((a, b) => String(a.noFail).localeCompare(String(b.noFail), "ms") || a.jilid - b.jilid);
}

/* 3. PAPAR JADUAL PINJAMAN */
function paparJadualPinjaman(kategori) {
    const config = konfigurasiPinjaman[kategori];
    if (!config) return;

    const tbody = document.getElementById(config.table);
    const kosong = document.getElementById(config.empty);
    const jumlah = document.getElementById(config.count);
    const carian = document.getElementById(config.search)?.value.trim() || "";
    const bahagian = document.getElementById(config.filter)?.value || "";

    if (!tbody) return;

    senaraiPilihanPinjaman[kategori] = dapatkanPilihanPinjaman(kategori);

    const kata = carian.toLowerCase();
    const hasil = senaraiPilihanPinjaman[kategori].filter(item => {
        const padanan = [item.noFail, item.tajuk, item.peringkat, item.lokasi, item.keterangan].some(nilai => String(nilai || "").toLowerCase().includes(kata));
        const padananBahagian = !bahagian || String(item.noFail).toUpperCase().startsWith(bahagian.toUpperCase());
        return padanan && padananBahagian;
    });

    tbody.innerHTML = "";

    if (!carian && !bahagian) {
        if (kosong) { kosong.hidden = false; kosong.textContent = "Taip untuk mencari rekod"; }
        if (jumlah) jumlah.textContent = "0 rekod";
        return;
    }

    if (kosong) { kosong.hidden = hasil.length > 0; kosong.textContent = "Tiada rekod dijumpai"; }

    hasil.forEach(item => {
        const index = senaraiPilihanPinjaman[kategori].indexOf(item);
        const tr = document.createElement("tr");
        const maklumatTambahan = kategori === "peribadi" ? item.keterangan : item.lokasi;

        tr.innerHTML = `<td>${escapeHTML(item.noFail)}</td><td>${escapeHTML(item.tajuk)}</td><td>${escapeHTML(item.peringkat)}</td><td>${escapeHTML(maklumatTambahan)}</td><td>${item.jilid}</td><td>${escapeHTML(item.statusJilid)}</td><td><button type="button" class="button button--small" data-pilih-pinjaman="${index}" data-kategori="${kategori}">Pilih</button></td>`;
        tbody.appendChild(tr);
    });

    if (jumlah) jumlah.textContent = `${hasil.length} rekod`;
}

/* 4. REFRESH KEDUA-DUA JADUAL */
function refreshPilihanPinjaman() {
    paparJadualPinjaman("umum");
    paparJadualPinjaman("peribadi");
}

/* 5. BUKA POPUP PINJAMAN */
function bukaBorangPinjaman(index, kategori) {
    const config = konfigurasiPinjaman[kategori];
    const pilihan = senaraiPilihanPinjaman[kategori]?.[Number(index)];

    if (!config || !pilihan) return;

    failPinjamanDipilih[kategori] = pilihan;

    const form = document.getElementById(config.form);
    form?.reset();

    const medan = {
        noFail: pilihan.noFail,
        jilid: pilihan.jilid,
        tajuk: pilihan.tajuk,
        peringkat: pilihan.peringkat,
        kategori: kategori === "peribadi" ? "Fail Peribadi" : "Fail Umum",
        lokasi: pilihan.lokasi,
        keterangan: pilihan.keterangan,
        status: pilihan.statusJilid,
        failId: pilihan.failId,
        kategoriKod: kategori
    };

    Object.entries(medan).forEach(([key, value]) => {
        const id = config.fields[key];
        const input = id ? document.getElementById(id) : null;
        if (input) input.value = value ?? "";
    });

    const profil = typeof dapatkanProfilPenggunaDemo === "function" ? dapatkanProfilPenggunaDemo() : {};
    const pemohon = {
        nama: profil.nama || profil.namaPengguna || "",
        jawatan: profil.jawatan || "",
        bahagian: profil.bahagian || profil.seksyen || ""
    };

    Object.entries(pemohon).forEach(([key, value]) => {
        const input = document.getElementById(config.fields[key]);
        if (input) input.value = value;
    });

    const tajuk = document.getElementById(config.modalTitle);
    if (tajuk) tajuk.textContent = `${pilihan.noFail} · ${pilihan.tajuk} · Jilid ${pilihan.jilid}`;

    document.getElementById(config.modal)?.showModal();
}

/* 6. TUTUP POPUP */
function tutupModalPinjaman(kategori) {
    const config = konfigurasiPinjaman[kategori];
    if (!config) return;

    document.getElementById(config.modal)?.close();
    document.getElementById(config.form)?.reset();
    failPinjamanDipilih[kategori] = null;
}

/* 7. HANTAR PERMOHONAN PINJAMAN */
function hantarPermohonanPinjaman(event) {
    event?.preventDefault();

    const formId = event?.currentTarget?.id || "formPinjaman";
    const kategori = formId === "formPinjamanPeribadi" ? "peribadi" : "umum";
    const config = konfigurasiPinjaman[kategori];
    const form = document.getElementById(config.form);
    const pilihan = failPinjamanDipilih[kategori];

    if (!form || !form.checkValidity()) { form?.reportValidity(); return; }
    if (!pilihan) { alert("Sila pilih fail terlebih dahulu."); return; }

    const profil = typeof dapatkanProfilPenggunaDemo === "function" ? dapatkanProfilPenggunaDemo() : {};

    const maklumat = {
        "No. Fail": pilihan.noFail,
        "Tajuk Fail": pilihan.tajuk,
        "Jilid": String(pilihan.jilid),
        "Peringkat Fail": pilihan.peringkat,
        "Kategori Fail": kategori === "peribadi" ? "Fail Peribadi" : "Fail Umum",
        "Lokasi Fail": pilihan.lokasi,
        "Keterangan Fail": pilihan.keterangan,
        "Status Jilid": pilihan.statusJilid,
        "Nama Pegawai / Pemohon": profil.nama || profil.namaPengguna || "",
        "Jawatan": profil.jawatan || "",
        "Bahagian / Seksyen": profil.bahagian || profil.seksyen || "",
        "Tujuan Pinjaman": document.getElementById(config.fields.tujuan)?.value.trim() || "",
        "Catatan": document.getElementById(config.fields.catatan)?.value.trim() || ""
    };

    const permohonan = {
        id: "EF-PJ-" + Date.now(),
        modul: kategori === "peribadi" ? "Pinjaman Fail - Fail Peribadi" : "Pinjaman Fail - Fail Umum",
        jenisTransaksi: "pinjaman",
        maklumat,
        sokongan: {},
        failId: pilihan.failId,
        noFail: pilihan.noFail,
        jilid: pilihan.jilid,
        kategori,
        status: "Menunggu Pengesahan",
        catatanPentadbir: "",
        tarikhPermohonan: new Date().toLocaleString("ms-MY")
    };

    if (!simpanPermohonan(permohonan)) return;

    const noFail = pilihan.noFail;
    const jilid = pilihan.jilid;
    const rujukan = permohonan.id;

    refreshPaparanPermohonan();
    refreshPilihanPinjaman();

    alert("Permohonan Pinjaman Fail berjaya dihantar untuk pengesahan Pentadbir.\n\nNo. Fail: " + noFail + "\nJilid: " + jilid + "\nNo. Rujukan: " + rujukan);

    tutupModalPinjaman(kategori);
}

/* 8. EVENT LISTENERS */
document.addEventListener("DOMContentLoaded", function () {
    Object.keys(konfigurasiPinjaman).forEach(kategori => {
        const config = konfigurasiPinjaman[kategori];

        document.getElementById(config.search)?.addEventListener("input", () => paparJadualPinjaman(kategori));
        document.getElementById(config.filter)?.addEventListener("change", () => paparJadualPinjaman(kategori));

        document.getElementById(config.table)?.addEventListener("click", function (event) {
            const butang = event.target.closest("[data-pilih-pinjaman]");
            if (butang) bukaBorangPinjaman(butang.dataset.pilihPinjaman, butang.dataset.kategori);
        });

        document.querySelectorAll(`[data-close-pinjaman${kategori === "umum" ? "" : "-peribadi"}]`).forEach(butang => {
            butang.addEventListener("click", () => tutupModalPinjaman(kategori));
        });

        document.getElementById(config.form)?.addEventListener("submit", hantarPermohonanPinjaman);
        paparJadualPinjaman(kategori);
    });
});
