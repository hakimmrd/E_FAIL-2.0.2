
/* ==========================================
   MODULE: PEMBUKAAN JILID BAHARU
   Tujuan: Dua senarai fail, dua borang berasingan,
   satu aliran permohonan dan satu approval queue.
========================================== */

let failJilidDipilih = null;


// ==========================================
// KONFIGURASI BORANG
// ==========================================

const konfigurasiBorangJilid = {
    umum: {
        modal: "modalJilidUmum",
        form: "formJilidUmum",
        jenis: "jpJenisFailUmum",
        tajuk: "jpTajukUmum",
        deskripsi: "jpDeskripsiUmum",
        noFail: "jpNoFailUmum",
        peringkat: "jpPeringkatUmum",
        jilid: "jpJilidUmum",
        lokasi: "jpLokasiUmum",
        keteranganLokasi: "jpKeteranganLokasiUmum",
        catatan: "jpCatatanUmum",
        sebab: "jpSebabKemaskiniUmum",
        bilanganLampiran: "jpbilanganlampiranUmum",
        tarikhPertama: "jpdatefirstcontentUmum",
        tarikhTerakhir: "jpdatelastcontentUmum",
        namaPemohon: "jpNamaPemohonUmum",
        jawatanPemohon: "jpJawatanPemohonUmum",
        bahagianPemohon: "jpBahagianPemohonUmum",
        failId: "jpFailIdUmum",
        kategoriFail: "jpKategoriFailUmum"
    },

    peribadi: {
        modal: "modalJilidPeribadi",
        form: "formJilidPeribadi",
        jenis: "jpJenisFailPeribadi",
        tajuk: "jpTajukPeribadi",
        deskripsi: "jpDeskripsiPeribadi",
        noFail: "jpNoFailPeribadi",
        peringkat: "jpPeringkatPeribadi",
        jilid: "jpJilidPeribadi",
        lokasi: "jpLokasiPeribadi",
        keteranganLokasi: "jpKeteranganLokasiPeribadi",
        catatan: "jpCatatanPeribadi",
        sebab: "jpSebabKemaskiniPeribadi",
        bilanganLampiran: "jpbilanganlampiranPeribadi",
        jawatan: "jpjawatanPeribadi",
        tarikhPertama: "jpdatefirstcontentPeribadi",
        tarikhTerakhir: "jpdatelastcontentPeribadi",
        namaPemohon: "jpNamaPemohonPeribadi",
        jawatanPemohon: "jpJawatanPemohonPeribadi",
        bahagianPemohon: "jpBahagianPemohonPeribadi",
        failId: "jpFailIdPeribadi",
        kategoriFail: "jpKategoriFailPeribadi"
    }
};


// ==========================================
// HELPER FUNCTIONS
// ==========================================

function dapatkanElemen(id) {
    return document.getElementById(id);
}

function tetapkanNilai(id, nilai) {
    const elemen = dapatkanElemen(id);
    if (elemen) elemen.value = nilai ?? "";
}

function dapatkanNilai(id) {
    return dapatkanElemen(id)?.value?.trim() || "";
}


// ==========================================
// FUNCTION: paparJadualJilid
// PURPOSE: Papar dan tapis senarai fail serta jilid.
// ==========================================


function paparJadualJilid(kategori) {
    const peribadi = kategori === "peribadi";

    const tbody = document.getElementById(
        peribadi ? "senaraiFailPeribadi" : "senaraiFailUmum"
    );

    if (!tbody) return;

    const carian = (
        document.getElementById(
            peribadi ? "carianFailPeribadi" : "carianFailUmum"
        )?.value || ""
    ).trim();

    const bahagian = document.getElementById(
        peribadi ? "filterBahagianFailPeribadi" : "filterBahagianFailUmum"
    )?.value || "";
    
    // Paparkan rekod hanya apabila pengguna membuat carian.
const adaCarian = carian.length > 0 || bahagian.length > 0;

const hasil = adaCarian
    ? carianRekodFail(kategori, carian, {
        bahagian: bahagian
    }).map(fail => ({
        ...fail,
        idAsal: fail.idFail || fail.failId || fail.id
    }))
    : [];

    // Paparkan jadual.
    paparPagination(
        tbody,
        hasil,
        peribadi ? "jilid-peribadi" : "jilid-umum",
        fail => `
            <tr>
                <td>${escapeHTML(fail.noFail)}</td>
                <td>${escapeHTML(fail.tajuk)}</td>
                <td>${escapeHTML(fail.peringkat)}</td>
                <td>${escapeHTML(fail.lokasi)}</td>
                <td>
                    Jilid ${escapeHTML(fail.jilid)}
                    <br><small>${escapeHTML(fail.statusJilid)}</small>
                    <br><small>${escapeHTML(fail.statusPinjaman)}</small>
                </td>
                <td>
                    <button type="button"
                        class="jp-action"
                        data-pilih-fail="${escapeHTML(fail.idAsal)}"
                        data-kategori="${peribadi ? "peribadi" : "umum"}">
                        Pilih
                    </button>
                </td>
            </tr>
        `
    );

    const kosong = dapatkanElemen(
        peribadi ? "failPeribadiKosong" : "failUmumKosong"
    );

    const jumlah = dapatkanElemen(
        peribadi ? "jumlahFailPeribadi" : "jumlahFailUmum"
    );

    if (kosong) {
    kosong.hidden = hasil.length > 0;
    kosong.textContent = adaCarian
        ? "Tiada rekod dijumpai"
        : "Taip untuk mencari rekod";
}
    if (jumlah) jumlah.textContent = hasil.length + " rekod";
}



// ==========================================
// FUNCTION: bukaBorangJilid
// PURPOSE: Buka popup mengikut kategori fail.
// ==========================================

function bukaBorangJilid(id, kategori) {

    const config = konfigurasiBorangJilid[kategori];
    if (!config) return;

    const data = kategori === "peribadi"
        ? senaraiFailPeribadi
        : senaraiFailUmum;

    const fail = data.find(item => item.id === id);
    if (!fail) return;

    failJilidDipilih = { ...fail, kategori };

    const profil = dapatkanProfilPenggunaDemo();

    const labelJenis = dapatkanElemen(config.jenis);

    if (labelJenis) {
        labelJenis.textContent =
            (fail.kategori || (kategori === "peribadi" ? "Fail Peribadi" : "Fail Umum")) +
            " · Sila semak maklumat automatik";
    }

    tetapkanNilai(config.tajuk, fail.tajuk || "");
    tetapkanNilai(config.deskripsi, fail.deskripsi || "");
    tetapkanNilai(config.noFail, fail.noFail || "");
    tetapkanNilai(config.peringkat, fail.peringkat || "");

    // Kira jilid seterusnya berdasarkan jilid terakhir diluluskan.
    const jilidTerakhir = dapatkanJilidTerakhir(
        fail.noFail,
        fail.id,
        fail.jilid,
        kategori
    );

    tetapkanNilai(
        config.jilid,
        String((Number(jilidTerakhir) || 0) + 1)
    );

    tetapkanNilai(config.lokasi, fail.lokasi || "");
    tetapkanNilai(config.keteranganLokasi, fail.keteranganLokasi || "");
    tetapkanNilai(config.catatan, fail.catatan || "");

    // Isi dropdown sebab jika pilihan sepadan.
    const dropdownSebab = dapatkanElemen(config.sebab);

    if (dropdownSebab) {
        const sebabSediaAda = Array.from(dropdownSebab.options)
            .some(option => option.value === fail.sebabKemaskini);

        dropdownSebab.value = sebabSediaAda
            ? fail.sebabKemaskini
            : "";
    }

    // Maklumat pemohon.
    tetapkanNilai(config.namaPemohon, profil?.nama || "");
    tetapkanNilai(config.jawatanPemohon, profil?.jawatan || "");
    tetapkanNilai(config.bahagianPemohon, profil?.bahagian || "");

    // Hidden fields.
    tetapkanNilai(config.failId, fail.id);
    tetapkanNilai(config.kategoriFail, kategori);

    // Medan tambahan Fail Peribadi jika wujud.
    if (config.jawatan) {
        tetapkanNilai(config.jawatan, fail.jawatan || "");
    }

    const modal = dapatkanElemen(config.modal);

    if (modal && !modal.open) {
        modal.showModal();
    }
}


// ==========================================
// FUNCTION: tutupModalJilid
// PURPOSE: Tutup popup yang sedang dibuka.
// ==========================================

function tutupModalJilid(kategori) {

    if (kategori && konfigurasiBorangJilid[kategori]) {
        dapatkanElemen(
            konfigurasiBorangJilid[kategori].modal
        )?.close();

        return;
    }

    Object.values(konfigurasiBorangJilid).forEach(config => {
        const modal = dapatkanElemen(config.modal);

        if (modal?.open) modal.close();
    });
}


// ==========================================
// FUNCTION: hantarPermohonanJilid
// PURPOSE: Hantar permohonan ke approval queue.
// ==========================================

function hantarPermohonanJilid(event) {

    event.preventDefault();

    const kategori = event.currentTarget.id === "formJilidPeribadi"
        ? "peribadi"
        : "umum";

    const config = konfigurasiBorangJilid[kategori];

    if (
        !config ||
        !failJilidDipilih ||
        failJilidDipilih.kategori !== kategori
    ) {
        alert("Sila pilih rekod fail yang betul terlebih dahulu.");
        return;
    }

    const form = event.currentTarget;

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const profil = dapatkanProfilPenggunaDemo();

    const maklumat = {
        "Maklumat Pemohon": profil?.nama || "",
        "Jawatan Pemohon": profil?.jawatan || "",
        "Bahagian Pemohon": profil?.bahagian || "",
        "Kategori Fail": kategori === "peribadi" ? "Fail Peribadi" : "Fail Umum",
        "Tajuk": dapatkanNilai(config.tajuk),
        "Deskripsi Fail": dapatkanNilai(config.deskripsi),
        "No. Fail": dapatkanNilai(config.noFail),
        "Peringkat Fail": dapatkanNilai(config.peringkat),
        "Jilid": dapatkanNilai(config.jilid),
        "Lokasi": dapatkanNilai(config.lokasi),
        "Keterangan Lokasi": dapatkanNilai(config.keteranganLokasi),
        "Catatan": dapatkanNilai(config.catatan),
        "Sebab Kemaskini": dapatkanNilai(config.sebab),
        "Bilangan Lampiran": dapatkanNilai(config.bilanganLampiran),
        "Tarikh Kandungan Pertama": dapatkanNilai(config.tarikhPertama),
        "Tarikh Kandungan Terakhir": dapatkanNilai(config.tarikhTerakhir)
    };

    // Medan tambahan yang hanya ada pada borang Fail Peribadi.
    if (config.jawatan) {
        maklumat["Jawatan"] = dapatkanNilai(config.jawatan);
    }

    const permohonan = {
        id: "EF-JB-" + Date.now(),
        modul: "Pembukaan Jilid Baharu - " +
            (kategori === "peribadi" ? "Fail Peribadi" : "Fail Umum"),
        maklumat: maklumat,
        sokongan: {},
        failId: failJilidDipilih.id,
        kategoriFail: kategori,
        jilidAsal: Number(failJilidDipilih.jilid) || 0,
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
        "Permohonan berjaya dihantar untuk pengesahan Pentadbir.\n\n" +
        "No. Rujukan: " + permohonan.id +
        "\nStatus: " + permohonan.status
    );

    form.reset();

    tutupModalJilid(kategori);
    failJilidDipilih = null;
}


// ==========================================
// EVENT LISTENERS
// ==========================================

document.addEventListener("DOMContentLoaded", function () {

    // Carian Fail Umum.
    dapatkanElemen("carianFailUmum")
        ?.addEventListener("input", () => paparJadualJilid("umum"));

    dapatkanElemen("filterBahagianFailUmum")
        ?.addEventListener("change", () => paparJadualJilid("umum"));

    // Carian Fail Peribadi.
    dapatkanElemen("carianFailPeribadi")
        ?.addEventListener("input", () => paparJadualJilid("peribadi"));

    dapatkanElemen("filterBahagianFailPeribadi")
        ?.addEventListener("change", () => paparJadualJilid("peribadi"));

    // Pilih fail dan tutup popup.
    document.addEventListener("click", function (event) {

        const button = event.target.closest("[data-pilih-fail]");

        if (button) {
            bukaBorangJilid(
                button.dataset.pilihFail,
                button.dataset.kategori
            );
        }

        const butangTutup = event.target.closest("[data-close-jilid]");

        if (butangTutup) {
            const modal = butangTutup.closest("dialog");

            if (modal?.open) modal.close();

            failJilidDipilih = null;
        }
    });

    // Kedua-dua borang menggunakan fungsi submit yang sama.
    dapatkanElemen("formJilidUmum")
        ?.addEventListener("submit", hantarPermohonanJilid);

    dapatkanElemen("formJilidPeribadi")
        ?.addEventListener("submit", hantarPermohonanJilid);

    // Paparkan jadual awal.
    paparJadualJilid("umum");
    paparJadualJilid("peribadi");
});
