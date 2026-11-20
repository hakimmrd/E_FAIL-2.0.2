
/* ==========================================
   E-FAIL 2.0
   MODULE: PEMINDAHAN FAIL
   Carian, permohonan dan perubahan status jilid
========================================== */

// STATE: Rekod jilid yang dipilih.
let rekodPemindahanDipilih = null;
let senaraiPilihanPemindahan = [];

// ==========================================
// DAPATKAN SENARAI FAIL DAN JILID
// ==========================================

function dapatkanSenaraiUntukPemindahan(kategori = "") {
    const semua = typeof dapatkanMasterlist === "function" ? dapatkanMasterlist() : [];
    return semua.filter(item => !kategori || item.kategoriKod === kategori);
}

// ==========================================
// HELPER: ESCAPE HTML
// ==========================================

function escapeHTMLPemindahan(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
}

// ==========================================
// PAPAR JADUAL CARIAN PEMINDAHAN
// ==========================================

function paparPilihanPemindahan() {
    const kategori = document.getElementById("pemindahanKategori")?.value || "";
    const carian = (document.getElementById("pemindahanCarian")?.value || "").trim().toLowerCase();
    const tbody = document.getElementById("senaraiPemindahan");

    if (!tbody) return;

    senaraiPilihanPemindahan = [];

    if (!carian) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Taip No. Fail atau Tajuk Fail untuk mencari rekod.</td></tr>';
        return;
    }

    senaraiPilihanPemindahan = dapatkanSenaraiUntukPemindahan(kategori).filter(item => {
        const teksCarian = [
            item.noFail, item.tajuk, item.deskripsi, item.jilid,
            item.kategori, item.lokasi
        ].join(" ").toLowerCase();

        return teksCarian.includes(carian);
    });

    if (!senaraiPilihanPemindahan.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Tiada rekod dijumpai.</td></tr>';
        return;
    }

    tbody.innerHTML = senaraiPilihanPemindahan.map((item, index) => `
        <tr>
            <td>${escapeHTMLPemindahan(item.noFail || "-")}</td>
            <td>${escapeHTMLPemindahan(item.tajuk || "-")}</td>
            <td>${escapeHTMLPemindahan(item.kategori || "-")}</td>
            <td>${escapeHTMLPemindahan(item.jilid || "-")}</td>
            <td>${escapeHTMLPemindahan(item.statusJilid || "Aktif")}</td>
            <td>${escapeHTMLPemindahan(item.lokasi || "-")}</td>
            <td><button type="button" class="button button--light" data-pilih-pemindahan="${index}">Pilih</button></td>
        </tr>
    `).join("");
}

// ==========================================
// KOSONGKAN MAKLUMAT BORANG
// ==========================================

function kosongkanMaklumatPemindahan() {
    ["pemindahanNoFail", "pemindahanJilid", "pemindahanLokasiAsal", "pemindahanLokasiBaharu", "pemindahanCatatan"].forEach(id => {
        const input = document.getElementById(id);
        if (input) input.value = "";
    });

    ["pemindahanStatusRekod", "pemindahanSebab"].forEach(id => {
        const input = document.getElementById(id);
        if (input) input.value = "";
    });

    const tarikh = document.getElementById("pemindahanTarikhTindakanAkhir");
    if (tarikh) tarikh.value = "";
}


// ==========================================
// PILIH REKOD DARIPADA JADUAL
// ==========================================

function pilihRekodPemindahan(index) {
    const rekod = senaraiPilihanPemindahan[Number(index)];
    if (!rekod) return;

    rekodPemindahanDipilih = rekod;

    document.getElementById("pemindahanNoFail").value = rekod.noFail || "";
    document.getElementById("pemindahanJilid").value = rekod.jilid || "";
    document.getElementById("pemindahanStatusRekod").value = rekod.statusJilid || "Aktif";
    document.getElementById("pemindahanLokasiAsal").value = rekod.lokasi || "";

    document.getElementById("modalPemindahanFail")?.showModal();
}


// ==========================================
// HANTAR PERMOHONAN PEMINDAHAN
// ==========================================

function hantarPermohonanPemindahan(event) {
    event?.preventDefault();

    const form = document.getElementById("formPemindahanFail");
    if (!form || !form.reportValidity()) return;

    if (!rekodPemindahanDipilih) {
        alert("Sila pilih fail atau jilid terlebih dahulu.");
        return;
    }

    const profil = typeof dapatkanProfilPenggunaDemo === "function" ? dapatkanProfilPenggunaDemo() : {};
    const kategori = rekodPemindahanDipilih.kategoriKod;
    if (!["umum", "peribadi"].includes(kategori)) {
       alert("Kategori fail tidak sah. Sila pilih semula rekod.");
       return;
    }
    const lokasiBaharu = document.getElementById("pemindahanLokasiBaharu").value.trim();
    const statusRekod = document.getElementById("pemindahanStatusRekod").value;
    const tarikhTindakanAkhir = document.getElementById("pemindahanTarikhTindakanAkhir").value;
    const sebab = document.getElementById("pemindahanSebab").value;
    const catatan = document.getElementById("pemindahanCatatan").value.trim();

    // Semak permohonan pemindahan yang masih menunggu.
    const permohonanSediaAda = dapatkanSenaraiPermohonan().some(item =>
        item.jenisTransaksi === "pemindahan" &&
        String(item.jilidId) === String(rekodPemindahanDipilih.id) &&
        item.kategori === kategori &&
        normalisasiStatus(item.status) === "pending"
    );

    if (permohonanSediaAda) {
        alert("Permohonan pemindahan untuk jilid ini masih menunggu pengesahan Pentadbir.");
        return;
    }

    // Sediakan maklumat permohonan.
    const maklumat = {
        "Maklumat Pemohon": profil.nama || "-",
        "Jawatan Pemohon": profil.jawatan || "-",
        "Bahagian Pemohon": profil.bahagian || "-",
        "Kategori Fail": kategori === "umum" ? "Fail Umum" : "Fail Peribadi",
        "No. Fail": rekodPemindahanDipilih.noFail || "-",
        "Tajuk Fail": rekodPemindahanDipilih.tajuk || "-",
        "Jilid": String(rekodPemindahanDipilih.jilid || ""),
        "Status Rekod": statusRekod,
        "Lokasi Asal": rekodPemindahanDipilih.lokasi || "-",
        "Lokasi Baharu": lokasiBaharu,
        "Tarikh Tindakan Akhir": tarikhTindakanAkhir,
        "Sebab Pemindahan": sebab,
        "Catatan": catatan || "-"
    };

    const permohonan = {
        id: "EF-PM-" + Date.now(),
        modul: "Pemindahan Fail",
        jenisTransaksi: "pemindahan",
        jilidId: rekodPemindahanDipilih.id,
        failId: rekodPemindahanDipilih.idFail || rekodPemindahanDipilih.failId || rekodPemindahanDipilih.id,
        noFail: rekodPemindahanDipilih.noFail || "",
        jilid: rekodPemindahanDipilih.jilid,
        kategori: kategori,
        tarikhPermohonan: new Date().toLocaleString("ms-MY"),
        status: "Menunggu Pengesahan",
        maklumat: maklumat
    };

    if (!simpanPermohonan(permohonan)) return;

    if (typeof refreshPaparanPermohonan === "function") refreshPaparanPermohonan();

    alert("Permohonan pemindahan berjaya dihantar untuk pengesahan Pentadbir.");

    form.reset();
    rekodPemindahanDipilih = null;
    paparPilihanPemindahan();
}

// ==========================================
// APPROVAL: PROSES PEMINDAHAN FAIL
// Hanya mengemas kini jilid selepas diluluskan.
// ==========================================


// ==========================================
// PROSES KELULUSAN PEMINDAHAN
// ==========================================

function prosesKelulusanPemindahan(permohonan) {
    const kategori = permohonan.kategori;
    const jilidId = String(permohonan.jilidId || "");
    const maklumat = permohonan.maklumat || {};

    if (!["umum", "peribadi"].includes(kategori)) {
        alert("Kategori fail tidak sah. Pemindahan tidak dapat diproses.");
        return false;
    }

    if (!jilidId) {
        alert("ID fail atau jilid tidak dijumpai.");
        return false;
    }

    const dapatkanFail = kategori === "peribadi" ? dapatkanSenaraiFailPeribadi : dapatkanSenaraiFailUmum;
    const simpanFail = kategori === "peribadi" ? simpanSenaraiFailPeribadi : simpanSenaraiFailUmum;
    const dapatkanJilid = kategori === "peribadi" ? dapatkanSenaraiJilidPeribadi : dapatkanSenaraiJilidUmum;
    const simpanJilid = kategori === "peribadi" ? simpanSenaraiJilidPeribadi : simpanSenaraiJilidUmum;

    const senaraiJilid = dapatkanJilid();
    const indeksJilid = senaraiJilid.findIndex(item => String(item.id) === jilidId);

    // JILID TAMBAHAN
    if (indeksJilid !== -1) {
        const rekod = senaraiJilid[indeksJilid];
        rekod.statusJilid = maklumat["Status Rekod"];
        rekod.lokasi = maklumat["Lokasi Baharu"];
        rekod.tarikhTindakanAkhir = maklumat["Tarikh Tindakan Akhir"];
        return simpanJilid(senaraiJilid);
    }

    // JILID ASAL
    const senaraiFail = dapatkanFail();
    const indeksFail = senaraiFail.findIndex(item => String(item.id) === jilidId);

    if (indeksFail === -1) {
        alert("Rekod fail atau jilid tidak dijumpai. Pemindahan tidak dapat diproses.");
        return false;
    }

    const rekodFail = senaraiFail[indeksFail];
    rekodFail.statusJilid = maklumat["Status Rekod"];
    rekodFail.lokasi = maklumat["Lokasi Baharu"];
    rekodFail.tarikhTindakanAkhir = maklumat["Tarikh Tindakan Akhir"];

    return simpanFail(senaraiFail);
}



// ==========================================
// EVENT LISTENERS
// ==========================================

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("pemindahanKategori")?.addEventListener("change", paparPilihanPemindahan);
    document.getElementById("pemindahanCarian")?.addEventListener("input", paparPilihanPemindahan);

    document.getElementById("senaraiPemindahan")?.addEventListener("click", function(event) {
        const butang = event.target.closest("[data-pilih-pemindahan]");
        if (butang) pilihRekodPemindahan(butang.dataset.pilihPemindahan);
    });

    document.getElementById("formPemindahanFail")?.addEventListener("submit", hantarPermohonanPemindahan);

    document.getElementById("formPemindahanFail")?.addEventListener("reset", function() {
        setTimeout(function() {
            rekodPemindahanDipilih = null;
            kosongkanMaklumatPemindahan();
            document.getElementById("modalPemindahanFail")?.close();
        }, 0);
    });

    document.querySelectorAll("[data-close-pemindahan]").forEach(button => {
        button.addEventListener("click", function() {
            document.getElementById("modalPemindahanFail")?.close();
        });
    });

    paparPilihanPemindahan();
});

