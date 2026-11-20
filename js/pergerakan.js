/* ==========================================
   MODULE: PERGERAKAN / PEMULANGAN FAIL
   Kedua-dua kategori menggunakan aliran sama.
   Status jilid hanya berubah selepas kelulusan.
========================================== */

const konfigurasiPemulangan = {
    umum: {
        page: "page-pergerakan", form: "formPemulanganFail",
        select: "pemulanganFailSelect", noFail: "pemulanganNoFail",
        jilid: "pemulanganJilid", peminjam: "pemulanganPeminjam",
        tarikh: "pemulanganTarikh", catatan: "pemulanganCatatan", reset: "pemulanganReset"
    },
    peribadi: {
        page: "page-pergerakanp", form: "formPemulanganFailPeribadi",
        select: "pemulanganFailSelectPeribadi", noFail: "pemulanganNoFailPeribadi",
        jilid: "pemulanganJilidPeribadi", peminjam: "pemulanganPeminjamPeribadi",
        tarikh: "pemulanganTarikhPeribadi", catatan: "pemulanganCatatanPeribadi", reset: "pemulanganResetPeribadi"
    }
};

function konfigurasiPemulanganAktif(kategori) {
    if (kategori && konfigurasiPemulangan[kategori]) return { kategori, ...konfigurasiPemulangan[kategori] };
    const page = document.querySelector("#page-pergerakan.page--active, #page-pergerakanp.page--active");
    const kod = page?.id === "page-pergerakanp" ? "peribadi" : "umum";
    return { kategori: kod, ...konfigurasiPemulangan[kod] };
}

function dapatkanSemuaJilidDipinjam(kategori) {
    const semua = typeof carianRekodFail === "function"
    ? carianRekodFail(kategori)
    : (typeof dapatkanMasterlist === "function" ? dapatkanMasterlist() : []);
    const permohonan = typeof dapatkanSenaraiPermohonan === "function" ? dapatkanSenaraiPermohonan() : [];
    return semua.filter(item => {
        if (String(item.statusPinjaman || "Tersedia").toLowerCase() !== "dipinjam") return false;
        if (kategori && item.kategoriKod !== kategori) return false;
        const adaPemulanganMenunggu = permohonan.some(request =>
            request.jenisTransaksi === "pemulangan" &&
            String(request.jilidId) === String(item.id) &&
            normalisasiStatus(request.status) === "pending"
        );
        return !adaPemulanganMenunggu;
    });
}

function paparPilihanPemulangan(kategori) {
    const config = konfigurasiPemulanganAktif(kategori);
    const select = document.getElementById(config.select);
    if (!select) return;

    const pilihan = dapatkanSemuaJilidDipinjam(config.kategori);
    select.innerHTML = '<option value="">-- Pilih fail yang sedang dipinjam --</option>' +
        pilihan.map(item => `<option value="${escapeHTML(item.id)}">${escapeHTML(item.noFail || "No. Fail belum ditetapkan")} — Jilid ${escapeHTML(item.jilid)} (${escapeHTML(item.kategori)})</option>`).join("");
}

function pilihJilidPemulangan(kategori) {
    const config = konfigurasiPemulanganAktif(kategori);
    const id = document.getElementById(config.select)?.value;
    const rekod = dapatkanSemuaJilidDipinjam(config.kategori).find(item => String(item.id) === String(id));
    const noFail = document.getElementById(config.noFail);
    const jilid = document.getElementById(config.jilid);
    const peminjam = document.getElementById(config.peminjam);
    if (noFail) noFail.value = rekod?.noFail || "";
    if (jilid) jilid.value = rekod?.jilid || "";
    if (peminjam) peminjam.value = rekod?.peminjam || "";
}

function hantarPermohonanPemulangan(event, kategori) {
    event?.preventDefault();
    const config = konfigurasiPemulanganAktif(kategori);
    const form = document.getElementById(config.form);
    if (!form || !form.reportValidity()) return;

    const idJilid = document.getElementById(config.select).value;
    const jilid = dapatkanSemuaJilidDipinjam(config.kategori).find(item => String(item.id) === String(idJilid));
    if (!jilid) {
        alert("Sila pilih jilid yang masih berstatus Dipinjam.");
        paparPilihanPemulangan(config.kategori);
        return;
    }

    const semuaPermohonan = dapatkanSenaraiPermohonan();
    const pemulanganAktif = semuaPermohonan.some(item =>
        item.jenisTransaksi === "pemulangan" && String(item.jilidId) === String(jilid.id) &&
        normalisasiStatus(item.status) === "pending"
    );
    if (pemulanganAktif) {
        alert("Permohonan pemulangan untuk jilid ini sedang menunggu pengesahan.");
        return;
    }

    const profil = dapatkanProfilPenggunaDemo();
    const permohonan = {
        id: "EF-PUL-" + Date.now(),
        modul: config.kategori === "peribadi" ? "Pemulangan Fail - Fail Peribadi" : "Pemulangan Fail - Fail Umum",
        jenisTransaksi: "pemulangan",
        jilidId: jilid.id,
        failId: jilid.idFail || jilid.failId || "",
        noFail: jilid.noFail || "",
        jilid: Number(jilid.jilid) || 1,
        kategori: config.kategori,
        tarikhPermohonan: new Date().toLocaleString("ms-MY"),
        status: "Menunggu Pengesahan",
        maklumat: {
            "No. Fail": jilid.noFail || "-",
            "Tajuk Fail": jilid.tajuk || "-",
            "Jilid": String(jilid.jilid || "-"),
            "Nama Peminjam": document.getElementById(config.peminjam).value.trim(),
            "Tarikh Pemulangan": document.getElementById(config.tarikh).value,
            "Catatan": document.getElementById(config.catatan).value.trim(),
            "Maklumat Pemohon": profil.nama || "-"
        }
    };

    if (!simpanPermohonan(permohonan)) return;

form.reset();
document.getElementById(config.noFail).value = "";
document.getElementById(config.jilid).value = "";

// REFRESH PILIHAN PEMULANGAN
paparPilihanPemulangan(config.kategori);

// REFRESH SEJARAH
if (typeof paparSejarahPermohonan === "function") {
    paparSejarahPermohonan();
}

// REFRESH PENGESAHAN
if (typeof paparSenaraiPengesahan === "function") {
    paparSenaraiPengesahan();
}

// REFRESH NOTIFICATION COUNT
if (typeof paparNotifikasi === "function") {
    paparNotifikasi();
}

alert("Permohonan pemulangan berjaya dihantar untuk pengesahan Pentadbir.");
}


function rekodPerubahanStatusPinjaman(permohonan, rekod, statusSebelum, statusSelepas) {
    if (typeof simpanRekodAudit !== "function" || statusSebelum === statusSelepas) return;
    const profil = dapatkanProfilPenggunaDemo();
    simpanRekodAudit({
        id: "AUD-" + Date.now(),
        failId: rekod.failId || permohonan.failId || "",
        jilidId: rekod.id,
        noFail: rekod.noFail || permohonan.noFail || "",
        kategori: rekod.kategori || permohonan.kategori || "",
        jilid: Number(rekod.jilid) || Number(permohonan.jilid) || 1,
        statusSebelum,
        statusSelepas,
        statusPinjaman: statusSelepas,
        tindakan: statusSelepas === "Dipinjam" ? "Pinjaman Diluluskan" : "Pemulangan Diluluskan",
        peminjam: rekod.peminjam || permohonan.maklumat?.["Nama Peminjam"] || "-",
        dilakukanOleh: profil.nama || "Pentadbir",
        tarikhMasa: new Date().toLocaleString("ms-MY")
    });
}

// Dipanggil oleh Pengesahan apabila Pentadbir meluluskan pinjaman.
function prosesKelulusanPinjaman(permohonan) {
    if (!permohonan || !(permohonan.modul || "").toLowerCase().includes("pinjaman")) return true;
    const kategori = String(permohonan.kategori || "").toLowerCase().includes("peribadi") ? "peribadi" : "umum";
    const senarai = kategori === "peribadi" ? dapatkanSenaraiJilidPeribadi() : dapatkanSenaraiJilidUmum();
    let rekod = senarai.find(item =>
        (permohonan.failId && String(item.failId) === String(permohonan.failId) ||
        (!permohonan.failId && String(item.noFail) === String(permohonan.noFail))) &&
        Number(item.jilid) === Number(permohonan.jilid)
    );
    if (!rekod) {
        rekod = {
            id: "JLD-" + Date.now(), failId: permohonan.failId || "",
            noFail: permohonan.noFail || permohonan.maklumat?.["No. Fail"] || "",
            tajuk: permohonan.maklumat?.["Tajuk Fail"] || "",
            kategori: kategori === "peribadi" ? "Fail Peribadi" : "Fail Umum",
            jilid: Number(permohonan.jilid) || 1, statusJilid: "Aktif",
            statusPinjaman: "Tersedia"
        };
        senarai.push(rekod);
    }
    if (String(rekod.statusPinjaman || "Tersedia").toLowerCase() === "dipinjam") {
        alert("Jilid ini telah dipinjam melalui transaksi lain.");
        return false;
    }

    const statusSebelum = rekod.statusPinjaman || "Tersedia";
    rekod.statusPinjaman = "Dipinjam";
    rekod.peminjam = permohonan.maklumat?.["Maklumat Pemohon"] || permohonan.maklumat?.["Nama Peminjam"] || permohonan.pemohonNama || "-";
    rekod.tarikhPinjam = new Date().toLocaleString("ms-MY");
    const berjaya = kategori === "peribadi" ? simpanSenaraiJilidPeribadi(senarai) : simpanSenaraiJilidUmum(senarai);
    if (berjaya) rekodPerubahanStatusPinjaman(permohonan, rekod, statusSebelum, "Dipinjam");
    return berjaya;
}

// Dipanggil oleh Pengesahan apabila Pentadbir meluluskan pemulangan.
function prosesKelulusanPemulangan(permohonan) {
    if (!permohonan || permohonan.jenisTransaksi !== "pemulangan") return true;
    const kategori = String(permohonan.kategori || "").toLowerCase().includes("peribadi") ? "peribadi" : "umum";
    const senarai = kategori === "peribadi" ? dapatkanSenaraiJilidPeribadi() : dapatkanSenaraiJilidUmum();
    const rekod = senarai.find(item => String(item.id) === String(permohonan.jilidId));
    if (!rekod) {
        alert("Rekod jilid tidak dijumpai. Status pemulangan tidak dapat dikemaskini.");
        return false;
    }
    if (String(rekod.statusPinjaman || "").toLowerCase() !== "dipinjam") {
        alert("Jilid ini bukan lagi berstatus Dipinjam.");
        return false;
    }

    const statusSebelum = rekod.statusPinjaman;
    rekod.statusPinjaman = "Tersedia";
    rekod.peminjam = null;
    rekod.tarikhPulang = permohonan.maklumat?.["Tarikh Pemulangan"] || new Date().toLocaleDateString("ms-MY");
    const berjaya = kategori === "peribadi" ? simpanSenaraiJilidPeribadi(senarai) : simpanSenaraiJilidUmum(senarai);
    if (berjaya) rekodPerubahanStatusPinjaman(permohonan, rekod, statusSebelum, "Tersedia");
    return berjaya;
}

document.addEventListener("DOMContentLoaded", function () {
    Object.keys(konfigurasiPemulangan).forEach(kategori => {
        const config = konfigurasiPemulangan[kategori];
        const form = document.getElementById(config.form);
        paparPilihanPemulangan(kategori);
        document.getElementById(config.select)?.addEventListener("change", () => pilihJilidPemulangan(kategori));
        form?.addEventListener("submit", event => hantarPermohonanPemulangan(event, kategori));
        document.getElementById(config.reset)?.addEventListener("click", () => setTimeout(() => {
            document.getElementById(config.noFail).value = "";
            document.getElementById(config.jilid).value = "";
        }, 0));
    });
});
