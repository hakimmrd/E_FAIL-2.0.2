/* ==========================================
   MODULE: PEMBUKAAN FAIL
   Permohonan Umum dan Peribadi menggunakan
   satu approval queue. Rekod fail hanya dicipta
   selepas Pentadbir meluluskan permohonan.
========================================== */

function kumpulMaklumatBorangPendaftaran(form) {
    const maklumat = {};
    const bilanganLabel = {};

    form.querySelectorAll(".field").forEach(field => {
        const label = field.querySelector("label");
        const input = field.querySelector("input, select, textarea");
        if (!label || !input) return;

        const namaAsal = label.textContent.replace("*", "").trim();
        bilanganLabel[namaAsal] = (bilanganLabel[namaAsal] || 0) + 1;
        const namaMedan = bilanganLabel[namaAsal] === 1
            ? namaAsal
            : `${namaAsal} (${bilanganLabel[namaAsal]})`;

        maklumat[namaMedan] = input.value.trim();
    });

    return maklumat;
}

function hantarPermohonanPendaftaran() {
    const form = document.querySelector(
        "#page-buka-umum.page--active #formPendaftaran, " +
        "#page-buka-peribadi.page--active #formPendaftaranPeribadi"
    );

    if (!form) {
        alert("Sila buka borang Pembukaan Fail Umum atau Peribadi terlebih dahulu.");
        return;
    }

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const kategori = form.id === "formPendaftaranPeribadi" ? "peribadi" : "umum";
    const profil = dapatkanProfilPenggunaDemo();
    const maklumat = kumpulMaklumatBorangPendaftaran(form);

    // Pastikan kategori permohonan jelas untuk proses kelulusan.
    maklumat["Kategori Fail"] = kategori === "peribadi" ? "Fail Peribadi" : "Fail Umum";

    const namaPemohon = maklumat["Maklumat Pemohon"] || profil.nama || "-";
    const permohonan = {
        id: "EF-PD-" + Date.now(),
        modul: kategori === "peribadi" ? "Pembukaan Fail - Fail Peribadi" : "Pembukaan Fail - Fail Umum",
        jenisTransaksi: "pembukaan-fail",
        kategori,
        kategoriFail: kategori,
        maklumat,
        sokongan: {},
        pemohonNama: namaPemohon,
        pemohonId: profil.id || "",
        pemohonEmel: profil.emel || "",
        pemohonNoKP: profil.noKP || "",
        pemohonJawatan: profil.jawatan || "",
        pemohonBahagian: profil.bahagian || maklumat["Bahagian / Seksyen"] || "",
        status: "Menunggu Pengesahan",
        catatanPentadbir: "",
        tarikhPermohonan: new Date().toLocaleString("ms-MY")
    };

   if (!simpanPermohonan(permohonan)) return;

    refreshPaparanPermohonan();

// REFRESH NOTIFICATION COUNT
if (typeof paparNotifikasi === "function") {
    paparNotifikasi();
}

alert(
    "Permohonan Pembukaan Fail berjaya dihantar untuk pengesahan Pentadbir.\n\n" +
    "Kategori: " + (kategori === "peribadi" ? "Fail Peribadi" : "Fail Umum") +
    "\nNo. Rujukan: " + permohonan.id +
    "\nStatus: " + permohonan.status
);

form.reset();

if (typeof isiMaklumatPemohonDalamBorang === "function") {
    isiMaklumatPemohonDalamBorang(form);
}
}
