/* ==========================================
   MODULE: PENGESAHAN PERMOHONAN
   Tujuan: Semakan, kelulusan dan penolakan
========================================== */

/* ==========================================
   E-FAIL 2.0
   PENGESAHAN PERMOHONAN (PENTADBIR)
========================================== */

// STATE: ID permohonan yang sedang disemak.
let permohonanAktifId = null;
let tabPengesahanAktif = "pending";

// ==========================================
// DISPLAY REQUEST LIST
// ==========================================

// FUNCTION: paparSenaraiPengesahan
// PURPOSE: Memaparkan senarai permohonan untuk tindakan Pentadbir.
function paparSenaraiPengesahan() {

    const tbody = document.getElementById("approvalTableBody");

    if (!tbody) return;

    const semuaPermohonan = dapatkanSenaraiPermohonan();

    const carian = (
        document.getElementById("approvalSearch")?.value || ""
    ).toLowerCase();

    const penapisModul =
        document.getElementById("approvalModuleFilter")?.value || "";

    // Update summary counters

    const jumlahMenunggu = semuaPermohonan.filter(item => normalisasiStatus(item.status) === "pending").length;
    const pendingCount = document.getElementById("approvalPendingCount");
    const pendingTabCount = document.getElementById("pendingTabCount");
    if (pendingCount) pendingCount.textContent = jumlahMenunggu;
    if (pendingTabCount) pendingTabCount.textContent = jumlahMenunggu;

    document.getElementById("approvalApprovedCount").textContent =
        semuaPermohonan.filter(item =>
            normalisasiStatus(item.status) === "approved"
        ).length;

    document.getElementById("approvalRejectedCount").textContent =
        semuaPermohonan.filter(item =>
            normalisasiStatus(item.status) === "rejected"
        ).length;

    // Filter requests

    const hasil = semuaPermohonan.filter(item => {

        const status = normalisasiStatus(item.status);

        const sepadanTab =
            tabPengesahanAktif === "pending"
                ? status === "pending"
                : status !== "pending";

        const sepadanCarian =
            (item.id || "").toLowerCase().includes(carian) ||
            (item.modul || "").toLowerCase().includes(carian) ||
            dapatkanNamaPemohon(item).toLowerCase().includes(carian);

        const namaModul = String(item.modul || "");
        const sepadanModul = !penapisModul ||
            namaModul === penapisModul ||
            namaModul.toLowerCase().includes(penapisModul.toLowerCase()) ||
            (penapisModul === "Pendaftaran Fail" && namaModul.toLowerCase().includes("pembukaan fail"));

        return sepadanTab && sepadanCarian && sepadanModul;
    });

    // Update empty state and result count

    document.getElementById("approvalEmpty").hidden =
        hasil.length > 0;

    document.getElementById("approvalResultCount").textContent =
        hasil.length + " permohonan";

    // Display table

    paparPagination(tbody, hasil, "pengesahan", item => {

        const status = normalisasiStatus(item.status);

        return `
            <tr>
                <td>${escapeHTML(item.id)}</td>
                <td>${escapeHTML(item.modul || "-")}</td>
                <td>${escapeHTML(dapatkanNamaPemohon(item))}</td>
                <td>${escapeHTML(item.tarikhPermohonan || "-")}</td>

                <td>
                    <span class="request-status request-status--${escapeHTML(status)}">
                        ${escapeHTML(labelStatus(status))}
                    </span>
                </td>

                <td>
                    <button
                        type="button"
                        class="button button--light"
                        data-approval-view="${escapeHTML(item.id)}">
                        ${status === "pending" ? "Semak" : "Lihat"}
                    </button>
                </td>
            </tr>
        `;

    });
}

// ==========================================
// VIEW REQUEST DETAILS
// ==========================================

// FUNCTION: lihatButiranPengesahan
// PURPOSE: Memaparkan butiran permohonan dalam modal pengesahan.
function lihatButiranPengesahan(id) {

    const semuaPermohonan = dapatkanSenaraiPermohonan();

    const rekod = semuaPermohonan.find(item => item.id === id);

    if (!rekod) {
        alert("Rekod permohonan tidak dijumpai.");
        return;
    }

    permohonanAktifId = id;

    const status = normalisasiStatus(rekod.status);

    // Basic information

    document.getElementById("detailReference").textContent =
        rekod.id || "-";

    document.getElementById("detailStatus").textContent =
        labelStatus(status);

    document.getElementById("detailApplicant").textContent =
        dapatkanNamaPemohon(rekod);

    document.getElementById("detailModule").textContent =
        rekod.modul || "-";

    document.getElementById("detailDate").textContent =
        rekod.tarikhPermohonan || "-";

    // Department information

    const maklumat = rekod.maklumat || {};
    const sokongan = rekod.sokongan || {};

    document.getElementById("detailDepartment").textContent =
        maklumat["Bahagian / Seksyen"] ||
        sokongan["Bahagian / Seksyen"] ||
        "-";

    // Display submitted form information

    const semuaMaklumat = {
        ...maklumat,
        ...sokongan
    };

    document.getElementById("detailForm").innerHTML =
        Object.entries(semuaMaklumat).map(([label, value]) => `
            <div class="detail-item">
                <div class="detail-label">${escapeHTML(label)}</div>
                <div class="detail-value">${escapeHTML(value || "-")}</div>
            </div>
        `).join("") || "Tiada maklumat permohonan.";

    // Supporting document

    document.getElementById("detailDocument").textContent =
        "Dokumen sokongan belum disambungkan dalam versi demo.";

    // Remarks

    document.getElementById("approvalRemarks").value =
        rekod.catatanPentadbir || "";

    document.getElementById("approvalValidation").textContent = "";

    // Show or hide approval actions

    const bahagianTindakan =
        document.getElementById("approvalActionSection");

    const butangTindakan =
        document.getElementById("approvalDetailActions");

    const notaSejarah =
        document.getElementById("approvalHistoryNote");

    const masihMenunggu = status === "pending";

    // Paparkan No. Fail hanya untuk permohonan Pembukaan Fail.
const bahagianNoFail = document.getElementById("approvalNoFailSection");
const inputNoFail = document.getElementById("approvalNoFail");

const permohonanPembukaan =
    rekod.jenisTransaksi === "pembukaan-fail";

if (bahagianNoFail) {
    bahagianNoFail.hidden = !(masihMenunggu && permohonanPembukaan);
}

if (inputNoFail) {
    inputNoFail.value = "";
}

    bahagianTindakan.hidden = !masihMenunggu;
    butangTindakan.hidden = !masihMenunggu;
    notaSejarah.hidden = masihMenunggu;

    // Open modal

    const modal = document.getElementById("approvalDetailModal");

    if (modal) {
        modal.style.display = "flex";
        modal.setAttribute("aria-hidden", "false");
    }
}

// ==========================================
// CLOSE MODAL
// ==========================================

// FUNCTION: tutupModalPengesahan
// PURPOSE: Menutup modal pengesahan.
function tutupModalPengesahan() {

    const modal = document.getElementById("approvalDetailModal");

    if (modal) {
        modal.style.display = "none";
        modal.setAttribute("aria-hidden", "true");
    }

    permohonanAktifId = null;
}

// ==========================================
// APPROVE OR REJECT REQUEST
// ==========================================

// FUNCTION: tindakanPengesahan
// PURPOSE: Menyimpan keputusan kelulusan atau penolakan.
function tindakanPengesahan(statusBaharu) {

    if (!permohonanAktifId) {
        alert("Tiada permohonan dipilih.");
        return;
    }

    const catatan = document.getElementById("approvalRemarks").value.trim();

    if (statusBaharu === "Ditolak" && !catatan) {
        document.getElementById("approvalValidation").textContent =
            "Sila masukkan sebab penolakan sebelum meneruskan.";
        return;
    }

    const semuaPermohonan = dapatkanSenaraiPermohonan();

    const indeks = semuaPermohonan.findIndex(
        item => item.id === permohonanAktifId
    );

    if (indeks === -1) {
        alert("Permohonan tidak dijumpai.");
        return;
    }

    const permohonan = semuaPermohonan[indeks];

    if (normalisasiStatus(permohonan.status) !== "pending") {
        alert("Permohonan ini telah mempunyai keputusan.");
        return;
    }

// PROSES PEMBUKAAN FAIL
// No. Fail ditetapkan oleh Pentadbir semasa kelulusan.
if (
    permohonan.jenisTransaksi === "pembukaan-fail" &&
    statusBaharu === "Diluluskan"
) {
    const inputNoFail = document.getElementById("approvalNoFail");
    const noFail = inputNoFail?.value.trim();

    if (!noFail) {
        document.getElementById("approvalValidation").textContent =
            "Sila masukkan No. Fail sebelum meluluskan permohonan.";
        inputNoFail?.focus();
        return;
    }

    // Masukkan No. Fail yang ditetapkan ke dalam maklumat permohonan.
    permohonan.maklumat = permohonan.maklumat || {};
    permohonan.maklumat["No. Fail"] = noFail;

    try {
        const rekodFail = ciptaRekodFailDaripadaPermohonan(permohonan);

        permohonan.failId = rekodFail.id;
        permohonan.noFail = rekodFail.noFail || noFail;
        permohonan.kategori =
            rekodFail.kategori === "Fail Peribadi" ? "peribadi" : "umum";

    } catch (error) {
        console.error("Ralat mencipta rekod pembukaan fail:", error);
        alert("Rekod fail gagal diwujudkan: " + error.message);
        return;
    }
}

    // PROSES NAIK TARAF: taraf/kategori fail hanya berubah selepas diluluskan.
    if (permohonan.jenisTransaksi === "naik-taraf" && statusBaharu === "Diluluskan") {
        if (typeof kemaskiniRekodFailNaikTaraf === "function" &&
            !kemaskiniRekodFailNaikTaraf(permohonan)) {
            alert("Maklumat fail gagal dikemaskini. Sila semak rekod fail asal.");
            return;
        }
    }

    // PROSES JILID: Hanya apabila permohonan jilid diluluskan.
    const permohonanJilid =
        (permohonan.modul || "").startsWith("Pembukaan Jilid Baharu - ");

    if (permohonanJilid && statusBaharu === "Diluluskan") {

        try {
            const rekodJilid = ciptaRekodJilid(permohonan);

            // Simpan nombor jilid sebenar yang telah diberikan.
            permohonan.maklumat["Jilid"] = String(rekodJilid.jilid);

        } catch (error) {
            console.error("Ralat mencipta rekod jilid:", error);
            alert("Rekod jilid gagal dicipta: " + error.message);
            return;
        }
    }

    // PROSES PINJAMAN: jilid menjadi Dipinjam selepas permohonan diluluskan.
    if ((permohonan.modul || "").toLowerCase().includes("pinjaman") && statusBaharu === "Diluluskan") {
        if (typeof prosesKelulusanPinjaman === "function" && !prosesKelulusanPinjaman(permohonan)) return;
    }

    // PROSES PEMULANGAN: status jilid kembali Tersedia hanya selepas diluluskan.
    if (permohonan.jenisTransaksi === "pemulangan" && statusBaharu === "Diluluskan") {
        if (typeof prosesKelulusanPemulangan === "function" && !prosesKelulusanPemulangan(permohonan)) return;
    }
    
    // PROSES PEMINDAHAN: kemas kini jilid hanya selepas diluluskan.
    if (permohonan.jenisTransaksi === "pemindahan" && statusBaharu === "Diluluskan") {
    if (typeof prosesKelulusanPemindahan === "function" &&
        !prosesKelulusanPemindahan(permohonan)) return;
    }
    
    // KEMASKINI STATUS PERMOHONAN DAN SIMPAN IDENTITI PENTADBIR.
    const profilPentadbir = typeof dapatkanProfilPenggunaDemo === "function" ? dapatkanProfilPenggunaDemo() : {};
    permohonan.disahkanOleh = profilPentadbir.nama || "-";
    permohonan.status = statusBaharu;
    permohonan.catatanPentadbir = catatan;
    permohonan.tarikhTindakanPentadbir = new Date().toLocaleString("ms-MY");

    
    // SIMPAN PERMOHONAN YANG TELAH DIKEMASKINI.
    if (!simpanStorageSenarai("efailRequests", semuaPermohonan)) return;

    // REFRESH SEMUA PAPARAN BERKAITAN.
    refreshPaparanPermohonan();

    // TUTUP MODAL.
    tutupModalPengesahan();

    alert(
        statusBaharu === "Diluluskan"
            ? "Permohonan berjaya diluluskan."
            : "Permohonan telah ditolak."
    );


// REFRESH NOTIFICATION COUNT
if (typeof paparNotifikasi === "function") {
    paparNotifikasi();
}

    tutupModalPengesahan();

    alert(
        statusBaharu === "Diluluskan"
            ? "Permohonan berjaya diluluskan."
            : "Permohonan telah ditolak."
    );
}

// ==========================================
// EVENT LISTENERS: CARIAN, TAB DAN BUTANG TINDAKAN
// ==========================================

// Search

document.getElementById("approvalSearch")
    ?.addEventListener("input", paparSenaraiPengesahan);

// Module filter

document.getElementById("approvalModuleFilter")
    ?.addEventListener("change", paparSenaraiPengesahan);

// Tabs and dynamic buttons

document.addEventListener("click", function(event) {

    // Switch tabs

    const tab = event.target.closest("[data-approval-tab]");

    if (tab) {

        tabPengesahanAktif = tab.dataset.approvalTab;

        document.querySelectorAll("[data-approval-tab]").forEach(button => {

            const aktif =
                button.dataset.approvalTab === tabPengesahanAktif;

            button.classList.toggle("active", aktif);

            button.setAttribute("aria-selected", aktif ? "true" : "false");
        });

        paparSenaraiPengesahan();
    }

    // Open request details

    const butangLihat = event.target.closest("[data-approval-view]");

    if (butangLihat) {
        lihatButiranPengesahan(butangLihat.dataset.approvalView);
    }

    // Close modal

    if (event.target.closest("[data-close-approval]")) {
        tutupModalPengesahan();
    }

});

// Approve button

document.getElementById("approvalApprove")
    ?.addEventListener("click", function() {

        tindakanPengesahan("Diluluskan");

    });

// Reject button

document.getElementById("approvalReject")
    ?.addEventListener("click", function() {

        tindakanPengesahan("Ditolak");

    });

// Initial display

paparSenaraiPengesahan();
