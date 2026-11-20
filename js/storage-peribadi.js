/* ==========================================
   STORAGE: FAIL PERIBADI
   Rekod Fail Peribadi dan Jilid Peribadi.
========================================== */

let senaraiFailPeribadi = [];

const DATA_DEMO_FAIL_PERIBADI = [
    { id: "P-001", kategori: "Fail Peribadi", noFail: "PER/100/1", tajuk: "Fail Peribadi Ahmad bin Ali", deskripsi: "Rekod perkhidmatan pegawai.", peringkat: "Sulit", jilid: 1, lokasi: "Bilik Fail Peribadi", keteranganLokasi: "Kabinet P, Rak 1", catatan: "Akses mengikut kebenaran", sebabKemaskini: "Jilid semasa hampir penuh", bahagian: "BSM" },
    { id: "P-002", kategori: "Fail Peribadi", noFail: "PER/100/2", tajuk: "Fail Peribadi Siti binti Abu", deskripsi: "Rekod perkhidmatan pegawai.", peringkat: "Sulit", jilid: 1, lokasi: "Bilik Fail Peribadi", keteranganLokasi: "Kabinet P, Rak 2", catatan: "Akses mengikut kebenaran", sebabKemaskini: "Keperluan jilid sambungan", bahagian: "BSM" },
    { id: "P-003", kategori: "Fail Peribadi", noFail: "PER/100/3", tajuk: "Fail Peribadi Mohd Faiz", deskripsi: "Rekod perkhidmatan pegawai.", peringkat: "Sulit", jilid: 2, lokasi: "Bilik Fail Peribadi", keteranganLokasi: "Kabinet P, Rak 3", catatan: "Akses mengikut kebenaran", sebabKemaskini: "Jilid semasa hampir penuh", bahagian: "SPR" }
];

function dapatkanSenaraiFailPeribadi() {
    const data = bacaStorageSenarai("efailFailPeribadi");
    return data.length || localStorage.getItem("efailFailPeribadi") !== null ? data : [...DATA_DEMO_FAIL_PERIBADI];
}

function simpanSenaraiFailPeribadi(data) {
    const berjaya = simpanStorageSenarai("efailFailPeribadi", data);
    if (berjaya) senaraiFailPeribadi = Array.isArray(data) ? data : [];
    return berjaya;
}

function dapatkanSenaraiJilidPeribadi() {
    return bacaStorageSenarai("efailJilidPeribadi");
}

function simpanSenaraiJilidPeribadi(data) {
    return simpanStorageSenarai("efailJilidPeribadi", data);
}

// Inisialisasi data demo hanya apabila storage belum pernah diwujudkan.
if (localStorage.getItem("efailFailPeribadi") === null) {
    simpanSenaraiFailPeribadi(DATA_DEMO_FAIL_PERIBADI);
} else {
    senaraiFailPeribadi = dapatkanSenaraiFailPeribadi();
}
