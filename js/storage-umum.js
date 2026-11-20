/* ==========================================
   STORAGE: FAIL UMUM
   Rekod Fail Umum dan Jilid Umum.
========================================== */

let senaraiFailUmum = [];

const DATA_DEMO_FAIL_UMUM = [
    { id: "U-001", kategori: "Fail Umum", noFail: "SPR/100/1", tajuk: "Pengurusan Rekod", deskripsi: "Rekod berkaitan pengurusan dan pentadbiran rekod jabatan.", peringkat: "Terbuka", jilid: 1, lokasi: "Bilik Rekod SPR", keteranganLokasi: "Rak A, Aras 2", catatan: "Fail aktif", sebabKemaskini: "Jilid semasa hampir penuh", bahagian: "SPR" },
    { id: "U-002", kategori: "Fail Umum", noFail: "BSM/200/1", tajuk: "Pentadbiran Am", deskripsi: "Rekod urusan pentadbiran am jabatan.", peringkat: "Terhad", jilid: 2, lokasi: "Bilik Rekod BSM", keteranganLokasi: "Kabinet B, Rak 4", catatan: "Simpan mengikut klasifikasi", sebabKemaskini: "Keperluan kesinambungan rekod", bahagian: "BSM" }
];

function dapatkanSenaraiFailUmum() {
    const data = bacaStorageSenarai("efailFailUmum");
    return data.length || localStorage.getItem("efailFailUmum") !== null ? data : [...DATA_DEMO_FAIL_UMUM];
}

function simpanSenaraiFailUmum(data) {
    const berjaya = simpanStorageSenarai("efailFailUmum", data);
    if (berjaya) senaraiFailUmum = Array.isArray(data) ? data : [];
    return berjaya;
}

function dapatkanSenaraiJilidUmum() {
    return bacaStorageSenarai("efailJilidUmum");
}

function simpanSenaraiJilidUmum(data) {
    return simpanStorageSenarai("efailJilidUmum", data);
}

// Inisialisasi data demo hanya apabila storage belum pernah diwujudkan.
if (localStorage.getItem("efailFailUmum") === null) {
    simpanSenaraiFailUmum(DATA_DEMO_FAIL_UMUM);
} else {
    senaraiFailUmum = dapatkanSenaraiFailUmum();
}
