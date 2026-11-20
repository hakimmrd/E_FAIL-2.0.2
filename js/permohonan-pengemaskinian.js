
/* ==========================================
   MODULE: PENGEMASKINIAN FAIL
   Tujuan: Carian, pemilihan dan permohonan pengemaskinian Fail Umum/Peribadi.
========================================== */

// STORAGE SEMENTARA: Rekod yang dipilih bagi setiap kategori.
const senaraiPilihanNaikTaraf = {
    umum: [],
    peribadi: []
};

// FUNCTION: escapeHTMLNaikTaraf
// PURPOSE: Mengelakkan kandungan rekod dimasukkan sebagai HTML aktif.
function escapeHTMLNaikTaraf(nilai) {
    return String(nilai ?? "").replace(/[&<>"']/g, aksara => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[aksara]);
}

// FUNCTION: dapatkanPilihanNaikTaraf
// PURPOSE: Mendapatkan rekod fail berdasarkan kategori.
function dapatkanPilihanNaikTaraf(kategori, kataKunci = "", bahagian = "") {
    if (typeof carianRekodFail !== "function") return [];

    const hasil = carianRekodFail(kategori, kataKunci, { bahagian });

    return hasil.map(item => ({
        ...item,
        failId: item.idFail || item.failId || item.id,
        noFail: item.noFail || "",
        tajuk: item.tajuk || "",
        jilid: Number(item.jilid) || 1,
        kategori,
        peringkat: item.peringkat || item.taraf || "",
        lokasi: item.lokasi || item.keteranganLokasi || "",
        keterangan: item.keteranganFail || item.keterangan || item.deskripsi || ""
    }));
}

// FUNCTION: paparJadualNaikTaraf
// PURPOSE: Memaparkan rekod selepas pengguna membuat carian atau penapisan.
function paparJadualNaikTaraf(kategori) {
    const peribadi = kategori === "peribadi";
    const akhiran = peribadi ? "Peribadi" : "Umum";

    const carian = document.getElementById("carianNaikTaraf" + akhiran);
    const filter = document.getElementById("filterBahagianNaikTaraf" + akhiran);
    const tbody = document.getElementById("senaraiNaikTaraf" + akhiran);
    const kosong = document.getElementById("naikTaraf" + akhiran + "Kosong");
    const jumlah = document.getElementById("jumlahNaikTaraf" + akhiran);

    if (!tbody || !kosong || !jumlah) return;

    const kataKunci = carian?.value.trim() || "";
    const bahagian = filter?.value || "";
    const adaCarian = kataKunci.length > 0 || bahagian.length > 0;

    const hasil = adaCarian
        ? dapatkanPilihanNaikTaraf(kategori, kataKunci, bahagian)
        : [];

    senaraiPilihanNaikTaraf[kategori] = hasil;
    tbody.innerHTML = "";

    if (!hasil.length) {
        kosong.textContent = adaCarian ? "Tiada rekod dijumpai" : "Taip untuk mencari rekod";
        kosong.hidden = false;
        jumlah.textContent = "0 rekod";
        return;
    }

    kosong.hidden = true;

    tbody.innerHTML = hasil.map((item, index) => `
        <tr>
            <td>${escapeHTMLNaikTaraf(item.noFail)}</td>
            <td>${escapeHTMLNaikTaraf(item.tajuk)}</td>
            <td>${escapeHTMLNaikTaraf(item.peringkat)}</td>
            <td>${escapeHTMLNaikTaraf(peribadi ? item.keterangan : item.lokasi)}</td>
            <td>${escapeHTMLNaikTaraf(item.jilid)}</td>
            <td>
                <button type="button" class="button button--light"
                    data-pilih-naik-taraf="${index}"
                    data-kategori="${kategori}">
                    Pilih
                </button>
            </td>
        </tr>
    `).join("");

    jumlah.textContent = hasil.length + " rekod";
}

// FUNCTION: dapatkanProfilNaikTaraf
// PURPOSE: Mendapatkan maklumat pemohon daripada profil demo.
function dapatkanProfilNaikTaraf() {
    if (typeof dapatkanProfilPenggunaDemo !== "function") return {};

    return dapatkanProfilPenggunaDemo() || {};
}

// FUNCTION: isiBorangNaikTaraf
// PURPOSE: Mengisi maklumat fail dan pemohon dalam popup.
function isiBorangNaikTaraf(item, kategori) {
    const peribadi = kategori === "peribadi";
    const akhiran = peribadi ? "Peribadi" : "Umum";
    const profil = dapatkanProfilNaikTaraf();

    const isi = (id, nilai) => {
        const input = document.getElementById(id + akhiran);
        if (input) input.value = nilai ?? "";
    };

    isi("naikTarafNoFail", item.noFail);
    isi("naikTarafJilid", item.jilid);
    isi("naikTarafTajuk", item.tajuk);
    isi("naikTarafPeringkat", item.peringkat);
    isi("naikTarafKategori", peribadi ? "Fail Peribadi" : "Fail Umum");
    isi("naikTarafLokasi", item.lokasi);
    isi("naikTarafKeterangan", item.keterangan);
    isi("naikTarafNama", profil.nama || profil.namaPengguna || profil.namaPenuh || "");
    isi("naikTarafBahagian", profil.bahagian || profil.bahagianSeksyen || profil.jabatan || "");
    isi("naikTarafTarikh", new Date().toLocaleDateString("en-CA"));
    isi("naikTarafCatatan", "");
    isi("naikTarafFailId", item.failId);

    const modal = document.getElementById("modalNaikTaraf" + akhiran);

    if (modal?.showModal) {
        modal.showModal();
    } else if (modal) {
        modal.setAttribute("open", "");
    }
}

// FUNCTION: tutupPopupNaikTaraf
// PURPOSE: Menutup popup pengemaskinian.
function tutupPopupNaikTaraf(kategori) {
    const akhiran = kategori === "peribadi" ? "Peribadi" : "Umum";
    const modal = document.getElementById("modalNaikTaraf" + akhiran);

    if (modal?.close) {
        modal.close();
    } else {
        modal?.removeAttribute("open");
    }
}

// FUNCTION: hantarPermohonanNaikTaraf
// PURPOSE: Menghantar permohonan ke senarai Pengesahan Pentadbir.
function hantarPermohonanNaikTaraf(form, kategori) {
    const peribadi = kategori === "peribadi";
    const akhiran = peribadi ? "Peribadi" : "Umum";
    const item = senaraiPilihanNaikTaraf[kategori].find(rekod =>
        String(rekod.failId) === String(document.getElementById("naikTarafFailId" + akhiran)?.value)
    );

    if (!item) {
        alert("Rekod fail tidak dijumpai. Sila buat carian dan pilih fail semula.");
        return;
    }

    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const ambil = id => document.getElementById(id + akhiran)?.value.trim() || "";

    const kemaskini = {
        tajuk: ambil("naikTarafTajuk"),
        peringkat: ambil("naikTarafPeringkat"),
        kategori: kategori,
        lokasi: ambil("naikTarafLokasi"),
        keterangan: ambil("naikTarafKeterangan"),
        tarikhPengemaskinian: ambil("naikTarafTarikh"),
        catatan: ambil("naikTarafCatatan")
    };

    const permohonan = {
        id: "EF-NT-" + Date.now(),
        modul: "Pengemaskinian Fail",
        maklumat: {
            "No. Fail": item.noFail,
            "Jilid": String(item.jilid),
            "Tajuk Fail Asal": item.tajuk,
            "Tajuk Fail Baharu": kemaskini.tajuk,
            "Taraf Fail Asal": item.peringkat,
            "Taraf Fail Baharu": kemaskini.peringkat,
            "Kategori Fail": peribadi ? "Fail Peribadi" : "Fail Umum",
            "Lokasi Baharu": kemaskini.lokasi,
            "Keterangan Baharu": kemaskini.keterangan,
            "Nama Pemohon": ambil("naikTarafNama"),
            "Bahagian / Seksyen": ambil("naikTarafBahagian"),
            "Tarikh Pengemaskinian": kemaskini.tarikhPengemaskinian,
            "Catatan": kemaskini.catatan
        },
        sokongan: {},
        failId: item.failId,
        noFail: item.noFail,
        jilid: item.jilid,
        kategori: kategori,
        kategoriAsal: kategori,
        jenisTransaksi: "naik-taraf",
        kemaskini,
        status: "Menunggu Pengesahan",
        catatanPentadbir: "",
        tarikhPermohonan: new Date().toLocaleString("ms-MY")
    };

    if (typeof simpanPermohonan !== "function") {
        alert("Fungsi simpanPermohonan tidak dijumpai.");
        return;
    }

    if (!simpanPermohonan(permohonan)) return;

    if (typeof refreshPaparanPermohonan === "function") {
        refreshPaparanPermohonan();
    }

    alert(
        "Permohonan Pengemaskinian Fail berjaya dihantar!\n\n" +
        "No. Fail: " + item.noFail +
        "\nJilid: " + item.jilid +
        "\nNo. Rujukan: " + permohonan.id
    );

    form.reset();
    tutupPopupNaikTaraf(kategori);
}

// EVENT: PENGURUSAN CARIAN, PEMILIHAN DAN BORANG
function initNaikTaraf() {
    ["umum", "peribadi"].forEach(kategori => {
        const akhiran = kategori === "peribadi" ? "Peribadi" : "Umum";

        document.getElementById("carianNaikTaraf" + akhiran)
            ?.addEventListener("input", () => paparJadualNaikTaraf(kategori));

        document.getElementById("filterBahagianNaikTaraf" + akhiran)
            ?.addEventListener("change", () => paparJadualNaikTaraf(kategori));

        const form = document.getElementById(kategori === "peribadi" ? "formPembukaanPeribadi" : "formPembukaan");

        form?.addEventListener("submit", event => {
            event.preventDefault();
            hantarPermohonanNaikTaraf(form, kategori);
        });
    });

    document.addEventListener("click", event => {
        const pilih = event.target.closest("[data-pilih-naik-taraf]");

        if (pilih) {
            const kategori = pilih.dataset.kategori;
            const index = Number(pilih.dataset.pilihNaikTaraf);
            const item = senaraiPilihanNaikTaraf[kategori]?.[index];

            if (item) isiBorangNaikTaraf(item, kategori);
            return;
        }

        const tutup = event.target.closest("[data-close-naik-taraf]");

        if (tutup) {
            tutupPopupNaikTaraf(tutup.dataset.closeNaikTaraf);
        }
    });

    // Paparan awal: jadual kosong sehingga carian dibuat.
    paparJadualNaikTaraf("umum");
    paparJadualNaikTaraf("peribadi");
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNaikTaraf);
} else {
    initNaikTaraf();
}
