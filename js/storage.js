/* ==========================================
   E-FAIL 2.0
   SHARED STORAGE & HELPER FUNCTIONS
========================================== */

function bacaStorageSenarai(kunci) {
    try {
        const data = JSON.parse(localStorage.getItem(kunci) || "[]");
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Ralat membaca " + kunci + ":", error);
        return [];
    }
}

function simpanStorageSenarai(kunci, senarai) {
    try {
        localStorage.setItem(kunci, JSON.stringify(Array.isArray(senarai) ? senarai : []));
        return true;
    } catch (error) {
        console.error("Ralat menyimpan " + kunci + ":", error);
        alert("Data tidak dapat disimpan: " + error.message);
        return false;
    }
}

// DATA FAIL/JILID disimpan dalam storage kategori masing-masing.
function dapatkanSenaraiJilid(kategori) {
    const umum = typeof dapatkanSenaraiJilidUmum === "function" ? dapatkanSenaraiJilidUmum() : [];
    const peribadi = typeof dapatkanSenaraiJilidPeribadi === "function" ? dapatkanSenaraiJilidPeribadi() : [];
    if (kategori === "umum") return umum;
    if (kategori === "peribadi") return peribadi;
    return [...umum, ...peribadi];
}

function migrasiJilidLama() {
    const lama = bacaStorageSenarai("efailJilid");
    if (!lama.length) return;
    const umum = dapatkanSenaraiJilidUmum();
    const peribadi = dapatkanSenaraiJilidPeribadi();
    lama.forEach(item => {
        const sasaran = String(item.kategori || "").toLowerCase().includes("peribadi") ? peribadi : umum;
        if (!sasaran.some(x => x.id === item.id || (item.idPermohonan && x.idPermohonan === item.idPermohonan))) sasaran.push(item);
    });
    simpanSenaraiJilidUmum(umum);
    simpanSenaraiJilidPeribadi(peribadi);
}

function dapatkanJilidTerakhir(noFail, failId, jilidAsal = 0, kategori) {
    const senarai = dapatkanSenaraiJilid(kategori);
    return senarai.filter(item => failId ? String(item.failId) === String(failId) : item.noFail === noFail)
        .reduce((tertinggi, item) => Math.max(tertinggi, Number(item.jilid) || 0), Number(jilidAsal) || 0);
}

// FUNCTION: ciptaRekodJilid
// Hanya dipanggil selepas Pentadbir meluluskan permohonan jilid.
function ciptaRekodJilid(permohonan) {
    const maklumat = permohonan.maklumat || {};
    const kategori = String(permohonan.kategori || permohonan.kategoriFail || maklumat["Kategori Fail"] || permohonan.modul || "").toLowerCase().includes("peribadi") ? "peribadi" : "umum";
    const dapatkan = kategori === "peribadi" ? dapatkanSenaraiJilidPeribadi : dapatkanSenaraiJilidUmum;
    const simpan = kategori === "peribadi" ? simpanSenaraiJilidPeribadi : simpanSenaraiJilidUmum;
    const senarai = dapatkan();
    const sediaAda = senarai.find(item => item.idPermohonan === permohonan.id);
    if (sediaAda) return sediaAda;

    const noFail = maklumat["No. Fail"] || permohonan.noFail || "";
    const failId = permohonan.failId || "";
    const jilidAsal = Number(permohonan.jilidAsal) || 0;
    const jilidBaharu = dapatkanJilidTerakhir(noFail, failId, jilidAsal, kategori) + 1;

    senarai.forEach(item => {
        if ((failId ? String(item.failId) === String(failId) : item.noFail === noFail) && item.statusJilid === "Aktif") {
            item.statusJilid = "Tidak Aktif";
        }
    });

    const rekod = {
        id: "JLD-" + Date.now(), idPermohonan: permohonan.id, failId, noFail,
        tajuk: maklumat["Tajuk"] || maklumat["Tajuk Fail"] || "",
        kategori: kategori === "peribadi" ? "Fail Peribadi" : "Fail Umum",
        jilid: jilidBaharu, statusJilid: "Aktif", statusPinjaman: "Tersedia",
        peminjam: null, tarikhPinjam: null, tarikhPulang: null,
        tarikhKelulusan: new Date().toLocaleString("ms-MY")
    };
    senarai.push(rekod);
    if (!simpan(senarai)) throw new Error("Gagal menyimpan rekod jilid.");
    return rekod;
}

// Cipta rekod fail hanya selepas permohonan Pembukaan Fail diluluskan.
function ciptaRekodFailDaripadaPermohonan(permohonan) {
    if (!permohonan || !permohonan.id) {
        throw new Error("Maklumat permohonan tidak lengkap.");
    }

    const maklumat = permohonan.maklumat || {};

    const kategori = String(
        permohonan.kategori ||
        permohonan.kategoriFail ||
        maklumat["Kategori Fail"] ||
        "umum"
    ).toLowerCase().includes("peribadi") ? "peribadi" : "umum";

    const dapatkan = kategori === "peribadi"
        ? dapatkanSenaraiFailPeribadi
        : dapatkanSenaraiFailUmum;

    const simpan = kategori === "peribadi"
        ? simpanSenaraiFailPeribadi
        : simpanSenaraiFailUmum;

    const senarai = dapatkan();

    // Elakkan rekod berganda daripada permohonan yang sama.
    const sediaAda = senarai.find(
        item => item.idPermohonan === permohonan.id
    );

    if (sediaAda) return sediaAda;

    // No. Fail wajib diisi, tetapi tidak perlu unik.
    const noFail = String(
        maklumat["No. Fail"] ||
        maklumat["No Fail"] ||
        ""
    ).trim();

    if (!noFail) {
        throw new Error("No. Fail wajib diisi oleh Pentadbir.");
    }

    // Cipta rekod fail baharu.
    const rekod = {
        id: "FAIL-" + (kategori === "peribadi" ? "P-" : "U-") + Date.now(),
        idPermohonan: permohonan.id,
        kategori: kategori === "peribadi" ? "Fail Peribadi" : "Fail Umum",
        noFail,
        tajuk: maklumat["Tajuk Fail"] || maklumat["Tajuk"] || "",
        deskripsi: maklumat["Deskripsi Fail"] || maklumat["Maklumat Fail"] || "",
        peringkat: maklumat["Peringkat Fail"] || maklumat["Taraf Fail"] || "",
        jilid: 1,
        lokasi: maklumat["Lokasi Penyimpanan Fail"] || maklumat["Lokasi"] || "",
        keteranganLokasi: maklumat["Keterangan Lokasi Fail"] || maklumat["Keterangan Lokasi"] || "",
        catatan: maklumat["Catatan"] || "",
        bahagian: maklumat["Bahagian / Seksyen"] || permohonan.pemohonBahagian || "",
        statusPinjaman: "Tersedia",
        statusJilid: "Aktif",
        tarikhPendaftaran: permohonan.tarikhPermohonan || new Date().toLocaleString("ms-MY"),
        tarikhKelulusan: new Date().toLocaleString("ms-MY")
    };

    if (!simpan([...senarai, rekod])) {
        throw new Error("Gagal menyimpan rekod fail.");
    }

    permohonan.failId = rekod.id;
    permohonan.noFail = rekod.noFail;
    permohonan.kategori = kategori;

    return rekod;
}


// STORAGE PERMOHONAN: semua modul menggunakan satu senarai bersama.
function dapatkanSenaraiPermohonan() { return bacaStorageSenarai("efailRequests"); }
function simpanPermohonan(permohonan) {
    if (!permohonan || !permohonan.id) {
        alert("Permohonan tidak mempunyai nombor rujukan.");
        return false;
    }
    const senarai = dapatkanSenaraiPermohonan();
    if (senarai.some(item => item.id === permohonan.id)) {
        alert("Permohonan ini telah pun direkodkan.");
        return false;
    }
    const profil = typeof dapatkanProfilPenggunaDemo === "function" ? dapatkanProfilPenggunaDemo() : {};
    const rekod = {
        ...permohonan,
        pemohonId: permohonan.pemohonId || profil.id || "",
        pemohonEmel: permohonan.pemohonEmel || profil.emel || "",
        pemohonNoKP: permohonan.pemohonNoKP || profil.noKP || "",
        pemohonNama: permohonan.pemohonNama || permohonan.maklumat?.["Maklumat Pemohon"] || profil.nama || "-",
        pemohonJawatan: permohonan.pemohonJawatan || profil.jawatan || "-",
        pemohonBahagian: permohonan.pemohonBahagian || profil.bahagian || "-"
    };
    senarai.push(rekod);
    return simpanStorageSenarai("efailRequests", senarai);
}

// STORAGE AUDIT TRAIL.
function dapatkanSenaraiAuditTrail() { return bacaStorageSenarai("efailAuditTrail"); }
function simpanRekodAudit(rekod) {
    const statusDibenarkan = ["Tersedia", "Dipinjam"];
    if (!rekod || !statusDibenarkan.includes(rekod.statusSebelum) ||
        !statusDibenarkan.includes(rekod.statusSelepas) ||
        rekod.statusSebelum === rekod.statusSelepas) {
        console.warn("Audit Trail hanya menerima perubahan status Tersedia/Dipinjam.");
        return false;
    }
    const senarai = dapatkanSenaraiAuditTrail();
    senarai.push(rekod);
    return simpanStorageSenarai("efailAuditTrail", senarai);
}

// MASTERLIST: gabungan paparan rekod fail dan jilid yang telah diluluskan.
// Data sumber kekal berasingan dalam storage Umum dan Peribadi.
function dapatkanMasterlist() {
    const hasil = [];
    const kategori = [
        { kod: "umum", nama: "Fail Umum", fail: dapatkanSenaraiFailUmum(), jilid: dapatkanSenaraiJilidUmum() },
        { kod: "peribadi", nama: "Fail Peribadi", fail: dapatkanSenaraiFailPeribadi(), jilid: dapatkanSenaraiJilidPeribadi() }
    ];

    kategori.forEach(kumpulan => kumpulan.fail.forEach(fail => {
        const tambahan = kumpulan.jilid.filter(item => {
    // Padankan menggunakan failId jika tersedia.
    if (item.failId) {
        return String(item.failId) === String(fail.id);
    }

    // Jika tiada failId, padankan No. Fail yang sah sahaja.
    const noFailJilid = String(item.noFail || "").trim();
    const noFailAsal = String(fail.noFail || "").trim();

    return noFailJilid !== "" &&
           noFailAsal !== "" &&
           noFailJilid === noFailAsal;
});
        const volumes = new Map();
        const jilidAsal = Number(fail.jilid) || 1;
        volumes.set(jilidAsal, {
            ...fail,
            idFail: fail.id,
            kategori: kumpulan.nama,
            kategoriKod: kumpulan.kod,
            jenisRekod: "Fail",
            jilid: jilidAsal,
            statusJilid: fail.statusJilid || "Aktif",
            statusPinjaman: fail.statusPinjaman || "Tersedia"
        });

        tambahan.forEach(item => {
            const nombor = Number(item.jilid) || jilidAsal;
            const asas = volumes.get(nombor) || fail;
            volumes.set(nombor, {
                ...asas,
                ...item,
                idFail: fail.id,
                failId: fail.id,
                kategori: kumpulan.nama,
                kategoriKod: kumpulan.kod,
                jenisRekod: nombor === jilidAsal ? "Fail" : "Jilid",
                jilid: nombor,
                statusJilid: item.statusJilid || item.status || (nombor === jilidAsal ? "Aktif" : "Tidak Aktif"),
                statusPinjaman: item.statusPinjaman || "Tersedia"
            });
        });

        const nomborAktif = Math.max(0, ...Array.from(volumes.values())
            .filter(item => item.statusJilid === "Aktif")
            .map(item => Number(item.jilid) || 0));
        volumes.forEach((item, nombor) => {
            if (nomborAktif && nombor !== nomborAktif && item.statusJilid === "Aktif") item.statusJilid = "Tidak Aktif";
            hasil.push(item);
        });
    }));

    return hasil.sort((a, b) =>
        String(a.noFail || "").localeCompare(String(b.noFail || ""), "ms") ||
        String(a.kategori).localeCompare(String(b.kategori), "ms") ||
        Number(a.jilid) - Number(b.jilid)
    );
}

function normalisasiStatus(status) {
    const statusMap = {
        "Menunggu Pengesahan": "pending", "Diluluskan": "approved",
        "Ditolak": "rejected", "Dalam Proses": "progress", "Selesai": "completed"
    };
    return statusMap[status] || status || "pending";
}
function labelStatus(status) {
    const labels = { pending: "Menunggu Pengesahan", approved: "Diluluskan",
        rejected: "Ditolak", progress: "Dalam Proses", completed: "Selesai" };
    return labels[normalisasiStatus(status)] || status;
}
function dapatkanNamaPemohon(item) {
    return item.pemohonNama || item.maklumat?.["Maklumat Pemohon"] || item.applicant || "-";
}
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    })[char]);
}
function dapatkanProfilPenggunaDemo() {
    let profilDisimpan = null;

    try {
        profilDisimpan = JSON.parse(localStorage.getItem("efail_demo_profile") || "null");
    } catch (error) {
        console.warn("Profil demo tidak dapat dibaca:", error);
    }

    // Jika profil demo tidak lengkap, cuba padankan nama topbar dengan pengguna berdaftar.
    const namaContainer = document.querySelector(".topbar__user-name");
    const namaNode = namaContainer && Array.from(namaContainer.childNodes)
        .find(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
    const namaTopbar = namaNode ? namaNode.textContent.trim() : "";

    const namaProfil = profilDisimpan && profilDisimpan.nama
        ? String(profilDisimpan.nama).trim() : "";
    const namaRujukan = namaProfil || namaTopbar;

    let penggunaBerdaftar = null;
    if (typeof dapatkanSenaraiPengguna === "function") {
        const emelProfil = String(profilDisimpan?.emel || "").trim().toLowerCase();
        const idProfil = String(profilDisimpan?.id || "").trim();
        penggunaBerdaftar = dapatkanSenaraiPengguna().find(pengguna =>
            (idProfil && String(pengguna.id || "") === idProfil) ||
            (emelProfil && String(pengguna.emel || "").trim().toLowerCase() === emelProfil) ||
            (namaRujukan && String(pengguna.nama || "").trim().toLowerCase() === namaRujukan.toLowerCase())
        ) || null;
    }

    const nilaiProfil = (nilai, nilaiPengguna) => {
        if (nilai !== undefined && nilai !== null && String(nilai).trim() && String(nilai).trim() !== "-") {
            return String(nilai).trim();
        }
        if (nilaiPengguna !== undefined && nilaiPengguna !== null && String(nilaiPengguna).trim()) {
            return String(nilaiPengguna).trim();
        }
        return "-";
    };

    return {
        nama: nilaiProfil(namaProfil, penggunaBerdaftar && penggunaBerdaftar.nama) !== "-"
            ? nilaiProfil(namaProfil, penggunaBerdaftar && penggunaBerdaftar.nama)
            : (namaTopbar || "-"),
        jawatan: nilaiProfil(profilDisimpan && profilDisimpan.jawatan, penggunaBerdaftar && penggunaBerdaftar.jawatan),
        bahagian: nilaiProfil(profilDisimpan && profilDisimpan.bahagian, penggunaBerdaftar && penggunaBerdaftar.bahagian),
        id: (profilDisimpan && profilDisimpan.id) || penggunaBerdaftar?.id || "",
        emel: (profilDisimpan && profilDisimpan.emel) || penggunaBerdaftar?.emel || "",
        noKP: (profilDisimpan && profilDisimpan.noKP) || penggunaBerdaftar?.noKP || "",
        role: (profilDisimpan && (profilDisimpan.role || profilDisimpan.peranan)) || localStorage.getItem("efail_demo_role") || "Pengguna"
    };
}

// FUNCTION: isiMaklumatPemohonDalamBorang
// PURPOSE: Mengisi identiti pengguna pada borang yang mempunyai medan Maklumat Pemohon.
function isiMaklumatPemohonDalamBorang(form) {
    if (!form) return;

    const profil = dapatkanProfilPenggunaDemo();
    const medan = Array.from(form.querySelectorAll(".field"));

    // Borang perlu mempunyai medan nama pemohon supaya medan lain tidak tersalah isi.
    const medanNamaPemohon = medan.find(field => {
        const label = field.querySelector("label");
        const teks = label ? label.textContent.toLowerCase() : "";
        return teks.includes("maklumat pemohon") || teks.includes("nama pegawai / pemohon");
    });

    if (!medanNamaPemohon) return;

    medan.forEach(field => {
        const label = field.querySelector("label");
        const input = field.querySelector("input, select, textarea");
        if (!label || !input) return;

        const namaMedan = label.textContent.replace("*", "").trim().toLowerCase();

        if (namaMedan.includes("maklumat pemohon") || namaMedan.includes("nama pegawai / pemohon")) {
            input.value = profil.nama === "-" ? "" : profil.nama;
            if (input.tagName === "SELECT") input.disabled = Boolean(profil.nama && profil.nama !== "-");
            else input.readOnly = Boolean(profil.nama && profil.nama !== "-");
        } else if (namaMedan === "jawatan" || namaMedan === "jawatan pemohon") {
            input.value = profil.jawatan === "-" ? "" : profil.jawatan;
            if (input.tagName === "SELECT") input.disabled = Boolean(profil.jawatan && profil.jawatan !== "-");
            else input.readOnly = Boolean(profil.jawatan && profil.jawatan !== "-");
        } else if (namaMedan.includes("bahagian / seksyen") || namaMedan.includes("bahagian pemohon")) {
            const bahagian = profil.bahagian === "-" ? "" : profil.bahagian;

            if (input.tagName === "SELECT") {
                let pilihan = Array.from(input.options).find(option =>
                    option.value.trim() === bahagian ||
                    option.textContent.trim() === bahagian ||
                    (bahagian && option.textContent.trim().toLowerCase().startsWith(bahagian.toLowerCase() + " -"))
                );

                if (!pilihan && bahagian) {
                    pilihan = new Option(bahagian, bahagian);
                    input.add(pilihan);
                }

                input.value = pilihan ? pilihan.value : "";
                input.disabled = Boolean(bahagian);
            } else {
                input.value = bahagian;
                input.readOnly = Boolean(bahagian);
            }
        }
    });
}

// FUNCTION: isiMaklumatPemohonSemuaBorang
// PURPOSE: Mengisi identiti pengguna pada semua borang permohonan yang berkaitan.
function isiMaklumatPemohonSemuaBorang() {
    document.querySelectorAll("form").forEach(isiMaklumatPemohonDalamBorang);
}

// Isi identiti selepas halaman dimuatkan dan selepas borang di-reset.
document.addEventListener("DOMContentLoaded", isiMaklumatPemohonSemuaBorang);
document.addEventListener("reset", function(event) {
    if (event.target && event.target.tagName === "FORM") {
        setTimeout(() => isiMaklumatPemohonDalamBorang(event.target), 0);
    }
}, true);

// KAWALAN MEDAN TARAF/KATEGORI FAIL.
// Hanya Pendaftaran dan Naik Taraf dibenarkan mengubah dua medan ini.
function kawalMedanTarafKategoriFail() {
    const borangDibenarkan = new Set([
        "formPendaftaran",
        "formPendaftaranPeribadi"
    ]);

    document.querySelectorAll("form").forEach(form => {
        const dalamNaikTaraf = Boolean(form.closest("#page-naik-taraf, #page-naik-tarafp"));
        const dibenarkan = borangDibenarkan.has(form.id) || dalamNaikTaraf;

        form.querySelectorAll(".field").forEach(field => {
            const label = field.querySelector("label");
            const input = field.querySelector("input, select, textarea");
            if (!label || !input) return;

            const nama = label.textContent.replace("*", "").trim().toLowerCase();
            if (nama !== "taraf fail" && nama !== "kategori fail") return;

            input.disabled = !dibenarkan;
            if (dibenarkan) input.removeAttribute("aria-disabled");
            else input.setAttribute("aria-disabled", "true");
        });
    });
}


// FUNCTION: kemaskiniRekodFailNaikTaraf
// PURPOSE: Mengemaskini rekod asal hanya selepas permohonan diluluskan.
function kemaskiniRekodFailNaikTaraf(permohonan) {
    const failId = permohonan?.failId;
    const kemaskini = permohonan?.kemaskini || {};
    if (!failId) return false;

    let umum = dapatkanSenaraiFailUmum();
    let peribadi = dapatkanSenaraiFailPeribadi();

    const indeksUmum = umum.findIndex(fail => String(fail.id) === String(failId));
    const indeksPeribadi = peribadi.findIndex(fail => String(fail.id) === String(failId));

    if (indeksUmum < 0 && indeksPeribadi < 0) {
        console.warn("Rekod fail untuk Naik Taraf tidak dijumpai:", failId);
        return false;
    }

    const kategoriAsal = indeksUmum >= 0 ? "umum" : "peribadi";
    const rekod = {
        ...(kategoriAsal === "umum" ? umum[indeksUmum] : peribadi[indeksPeribadi])
    };

    const kategoriBaharu = kemaskini.kategori === "peribadi" ? "peribadi" : "umum";

    // KEMASKINI MAKLUMAT REKOD.
    const pemetaan = {
        tajuk: "tajuk",
        peringkat: "peringkat",
        lokasi: "lokasi",
        keterangan: "deskripsi",
        catatan: "catatan"
    };

    Object.entries(pemetaan).forEach(([medan, medanRekod]) => {
        if (kemaskini[medan] !== undefined) {
            rekod[medanRekod] = String(kemaskini[medan]).trim();
        }
    });

    rekod.kategori = kategoriBaharu === "peribadi" ? "Fail Peribadi" : "Fail Umum";

    // PINDAHKAN REKOD JIKA KATEGORI BERUBAH.
    if (kategoriAsal === "umum") umum.splice(indeksUmum, 1);
    else peribadi.splice(indeksPeribadi, 1);

    const jilidUmum = dapatkanSenaraiJilidUmum();
    const jilidPeribadi = dapatkanSenaraiJilidPeribadi();

    if (kategoriAsal !== kategoriBaharu) {
        const sumberJilid = kategoriAsal === "umum" ? jilidUmum : jilidPeribadi;
        const sasaranJilid = kategoriBaharu === "umum" ? jilidUmum : jilidPeribadi;

        const pindah = sumberJilid.filter(item =>
            String(item.failId || "") === String(failId) ||
            (!item.failId && item.noFail === rekod.noFail)
        );

        const kekal = sumberJilid.filter(item => !pindah.includes(item));

        pindah.forEach(item => {
            item.kategori = kategoriBaharu === "peribadi" ? "Fail Peribadi" : "Fail Umum";
            if (!sasaranJilid.some(x => x.id === item.id)) sasaranJilid.push(item);
        });

        if (kategoriAsal === "umum") jilidUmum.splice(0, jilidUmum.length, ...kekal);
        else jilidPeribadi.splice(0, jilidPeribadi.length, ...kekal);
    }

    if (kategoriBaharu === "peribadi") peribadi.push(rekod);
    else umum.push(rekod);

    // SIMPAN REKOD FAIL.
    const berjayaFail =
        simpanSenaraiFailUmum(umum) &&
        simpanSenaraiFailPeribadi(peribadi);

    if (!berjayaFail) return false;

    // SIMPAN JILID JIKA KATEGORI BERUBAH.
    if (kategoriAsal !== kategoriBaharu) {
        const berjayaJilid =
            simpanSenaraiJilidUmum(jilidUmum) &&
            simpanSenaraiJilidPeribadi(jilidPeribadi);

        if (!berjayaJilid) return false;
    }

    if (typeof senaraiFailUmum !== "undefined") senaraiFailUmum = umum;
    if (typeof senaraiFailPeribadi !== "undefined") senaraiFailPeribadi = peribadi;

    return true;
}


// PAGINATION STANDARD: 15 rekod setiap halaman.
function paparPagination(tbody, rekod, kunci, fungsiRender, had = 15) {
    if (!tbody) return;
    const halamanMaksimum = Math.max(1, Math.ceil(rekod.length / had));
    window._efailHalaman = window._efailHalaman || {};
    let halaman = Math.min(window._efailHalaman[kunci] || 1, halamanMaksimum);
    window._efailHalaman[kunci] = halaman;
    const mula = (halaman - 1) * had;
    tbody.innerHTML = rekod.slice(mula, mula + had).map(fungsiRender).join("");

    let kawalan = document.getElementById("pagination-" + kunci);
    if (!kawalan) {
        kawalan = document.createElement("div");
        kawalan.id = "pagination-" + kunci;
        kawalan.className = "efail-pagination";
        kawalan.style.cssText = "display:flex;align-items:center;justify-content:flex-end;gap:6px;flex-wrap:wrap;padding:12px 4px;font-size:13px;";
        tbody.closest("table")?.insertAdjacentElement("afterend", kawalan);
    }
    kawalan.innerHTML = "";
    if (rekod.length <= had) return;
    const info = document.createElement("span");
    info.textContent = `Rekod ${mula + 1}–${Math.min(mula + had, rekod.length)} daripada ${rekod.length}`;
    const butang = (teks, nombor, disabled = false, aktif = false) => {
        const b = document.createElement("button");
        b.type = "button"; b.textContent = teks; b.disabled = disabled;
        b.className = "efail-page-button" + (aktif ? " active" : "");
        b.style.cssText = "border:1px solid #d8e0e8;border-radius:6px;padding:6px 10px;background:" + (aktif ? "#183153" : "#fff") + ";color:" + (aktif ? "#fff" : "#263445") + ";cursor:pointer;";
        if (disabled) b.style.opacity = "0.45";
        b.addEventListener("click", () => {
            window._efailHalaman[kunci] = nombor;
            paparPagination(tbody, rekod, kunci, fungsiRender, had);
        });
        kawalan.appendChild(b);
    };
    info.style.marginRight = "auto";
    kawalan.appendChild(info);
    butang("Sebelumnya", halaman - 1, halaman === 1);
    for (let i = 1; i <= halamanMaksimum; i++) butang(String(i), i, false, i === halaman);
    butang("Seterusnya", halaman + 1, halaman === halamanMaksimum);
}

document.addEventListener("DOMContentLoaded", function () { migrasiJilidLama(); kawalMedanTarafKategoriFail(); });


// Jadual statik yang mempunyai lebih 15 baris turut menggunakan pagination.
document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("tbody:not([id])").forEach((tbody, index) => {
        const rows = Array.from(tbody.rows).map(row => row.outerHTML);
        if (rows.length > 15) paparPagination(tbody, rows, "jadual-statik-" + index, row => row);
    });
});
// ==========================================
// SHARED FILE SEARCH
// PURPOSE: Search all approved file and jilid records.
// kategori: "umum", "peribadi", or "semua"
// ==========================================

function carianRekodFail(kategori = "semua", kataKunci = "", penapis = {}) {

    // Get the combined file and jilid records.
    const semuaRekod = dapatkanMasterlist();

    const carian = String(kataKunci || "").trim().toLowerCase();
    const bahagian = String(penapis.bahagian || "").trim();
    const statusJilid = String(penapis.statusJilid || "").trim();
    const statusPinjaman = String(penapis.statusPinjaman || "").trim();

    return semuaRekod.filter(fail => {

        // Filter by file category.
        if (kategori !== "semua" && fail.kategoriKod !== kategori) {
            return false;
        }

        // Search across the available file and jilid fields.
        const teksCarian = [
            fail.noFail,
            fail.tajuk,
            fail.deskripsi,
            fail.peringkat,
            fail.lokasi,
            fail.keteranganLokasi,
            fail.catatan,
            fail.bahagian,
            fail.jilid,
            fail.statusJilid,
            fail.statusPinjaman
        ].map(nilai => String(nilai ?? "").toLowerCase()).join(" ");

        if (carian && !teksCarian.includes(carian)) {
            return false;
        }

        // Optional department filter.
        if (bahagian && String(fail.bahagian || "") !== bahagian) {
            return false;
        }

        // Optional volume status filter.
        if (statusJilid && fail.statusJilid !== statusJilid) {
            return false;
        }

        // Optional borrowing status filter.
        if (statusPinjaman && fail.statusPinjaman !== statusPinjaman) {
            return false;
        }

        return true;
    });
}// ==========================================
// CENTRAL REFRESH FUNCTION
// PURPOSE: Refresh shared e-FAIL displays after data changes.
// ==========================================

function refreshPaparanPermohonan() {

    // 1. REFRESH NOTIFICATION COUNT
    if (typeof paparNotifikasi === "function") {
        paparNotifikasi();
    }

    // 2. REFRESH REQUEST HISTORY
    if (typeof paparSejarahPermohonan === "function") {
        paparSejarahPermohonan();
    }

    // 3. REFRESH ADMIN APPROVAL TABLE
    if (typeof paparSenaraiPengesahan === "function") {
        paparSenaraiPengesahan();
    }

    // 4. REFRESH DASHBOARD
    if (typeof paparJadualDashboard === "function") {
        paparJadualDashboard();
    }

    // 5. REFRESH LOAN SELECTIONS
    if (typeof paparPilihanFailPinjaman === "function") {
        paparPilihanFailPinjaman("umum");
        paparPilihanFailPinjaman("peribadi");
    }

    // 6. REFRESH RETURN SELECTIONS
    if (typeof paparPilihanPemulangan === "function") {
        paparPilihanPemulangan("umum");
        paparPilihanPemulangan("peribadi");
    }
    
    // 5. REFRESH PINJAMAN SELECTIONS
    if (typeof paparJadualPinjaman === "function") {
       paparJadualPinjaman("umum");
       paparJadualPinjaman("peribadi");
   }

    console.log("e-FAIL: Semua paparan berkaitan telah dikemaskini.");
}// RESET SEMUA DATA DEMO E-FAIL
function resetSemuaDataDemo() {
    const pengesahan = confirm(
        "Adakah anda pasti mahu memadam SEMUA data demo e-FAIL?"
    );

    if (!pengesahan) return;

    const kunciStorage = [
        "efailFailUmum",
        "efailFailPeribadi",
        "efailJilidUmum",
        "efailJilidPeribadi",
        "efailUsers",
        "efailRequests",
        "efailAuditTrail"
    ];

    kunciStorage.forEach(kunci => localStorage.removeItem(kunci));

    alert("Semua data demo berjaya dipadam. Sila refresh halaman.");

    location.reload();
}

