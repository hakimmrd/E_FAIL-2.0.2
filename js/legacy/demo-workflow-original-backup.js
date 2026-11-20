
/* ==========================================
   MODUL PENGEMASKINIAN FAIL
   DEMO SUBMISSION WORKFLOW
========================================== */

function hantarPermohonan() {

    const formUtama = document.getElementById("formPembukaan");
    const formSokongan = document.getElementById("formSokongan");

    // 1. Check both forms
    if (!formUtama.checkValidity()) {
        formUtama.reportValidity();
        return;
    }

    if (!formSokongan.checkValidity()) {
        formSokongan.reportValidity();
        return;
    }

    // 2. Collect form information
    function kumpulMaklumat(form) {

        const data = {};

        form.querySelectorAll(".field").forEach(field => {

            const label = field.querySelector("label");
            const input = field.querySelector("input, select, textarea");

            if (label && input) {

                const nama = label.textContent
                    .replace("*", "")
                    .trim();

                data[nama] = input.value.trim();
            }

        });

        return data;
    }

    const maklumatUtama = kumpulMaklumat(formUtama);
    const maklumatSokongan = kumpulMaklumat(formSokongan);

    // 3. Create demo application
    const permohonan = {

        id: "EF-" + Date.now(),

        modul: "Pengemaskinian Fail",

        maklumat: maklumatUtama,

        sokongan: maklumatSokongan,

        status: "Menunggu Pengesahan",

        catatanPentadbir: "",

        tarikhPermohonan: new Date().toLocaleString("ms-MY")

    };

    // 4. Save into browser storage
    let senaraiPermohonan = [];

    try {
        senaraiPermohonan = JSON.parse(
            localStorage.getItem("efailRequests") || "[]"
        );

        if (!Array.isArray(senaraiPermohonan)) {
            senaraiPermohonan = [];
        }

    } catch (error) {
        console.error("Ralat membaca data:", error);
        alert("Data demo tidak dapat dibaca.");
        return;
    }

   

senaraiPermohonan.push(permohonan);

// 4. Save into browser storage
try {
    localStorage.setItem(
        "efailRequests",
        JSON.stringify(senaraiPermohonan)
    );

} catch (error) {
    console.error("Ralat menyimpan data:", error);
    alert("Permohonan tidak dapat disimpan: " + error.message);
    return;
}

// Refresh Sejarah Permohonan separately
try {
    paparSejarahPermohonan();
} catch (error) {
    console.error("Ralat memaparkan sejarah:", error);
}

// 5. Confirmation
alert(
    "Permohonan berjaya dihantar!\n\n" +
    "No. Rujukan: " + permohonan.id +
    "\nStatus: " + permohonan.status
);

// 6. Reset both forms
formUtama.reset();
formSokongan.reset();

console.log("Permohonan demo:", permohonan);

}
/* ==========================================
   E-FAIL 2.0
   SEJARAH PERMOHONAN
========================================== */

// Read requests from the same storage used
// by the submission form.

function dapatkanSenaraiPermohonan() {
    try {
        const data = JSON.parse(
            localStorage.getItem("efailRequests") || "[]"
        );

        return Array.isArray(data) ? data : [];

    } catch (error) {
        console.error("Ralat membaca sejarah:", error);
        return [];
    }
}


// Convert status into the values used by
// your existing status filter.

function normalisasiStatus(status) {

    const statusMap = {
        "Menunggu Pengesahan": "pending",
        "Diluluskan": "approved",
        "Ditolak": "rejected",
        "Dalam Proses": "progress",
        "Selesai": "completed"
    };

    return statusMap[status] || status || "pending";
}


// Display status in Malay.

function labelStatus(status) {

    const labels = {
        pending: "Menunggu Pengesahan",
        approved: "Diluluskan",
        rejected: "Ditolak",
        progress: "Dalam Proses",
        completed: "Selesai"
    };

    return labels[normalisasiStatus(status)] || status;
}


// Get applicant name from the submitted form.

function dapatkanNamaPemohon(item) {

    return item.maklumat?.["Maklumat Pemohon"] ||
           item.applicant ||
           "-";
}


// ==========================================
// DISPLAY HISTORY TABLE AND SUMMARY
// ==========================================

function paparSejarahPermohonan() {

    const tbody = document.getElementById("requestHistoryBody");

    if (!tbody) return;

    const semuaPermohonan = dapatkanSenaraiPermohonan();

    const carian = (
        document.getElementById("requestSearch")?.value || ""
    ).toLowerCase();

    const penapisStatus =
        document.getElementById("requestStatusFilter")?.value || "";

    // Update summary cards
    document.getElementById("totalRequests").textContent =
        semuaPermohonan.length;

    document.getElementById("pendingRequests").textContent =
        semuaPermohonan.filter(item =>
            normalisasiStatus(item.status) === "pending"
        ).length;

    document.getElementById("approvedRequests").textContent =
        semuaPermohonan.filter(item =>
            normalisasiStatus(item.status) === "approved"
        ).length;

    document.getElementById("rejectedRequests").textContent =
        semuaPermohonan.filter(item =>
            normalisasiStatus(item.status) === "rejected"
        ).length;


    // Apply search and status filter
    const hasil = semuaPermohonan.filter(item => {

        const id = (item.id || "").toLowerCase();
        const modul = (item.modul || "").toLowerCase();

        const sepadanCarian =
            id.includes(carian) || modul.includes(carian);

        const sepadanStatus =
            !penapisStatus ||
            normalisasiStatus(item.status) === penapisStatus;

        return sepadanCarian && sepadanStatus;
    });


    // Empty message
    const emptyMessage = document.getElementById("requestEmpty");

    emptyMessage.hidden = hasil.length > 0;


    // Display table rows
    tbody.innerHTML = hasil.map(item => {

        const status = normalisasiStatus(item.status);

        const catatan =
            item.catatanPentadbir ||
            item.remark ||
            "-";

        return `
            <tr>
                <td>${escapeHTML(item.id)}</td>

                <td>${escapeHTML(item.modul)}</td>

                <td>${escapeHTML(item.tarikhPermohonan || "-")}</td>

                <td>
                    <span class="request-status request-status--${escapeHTML(status)}">
                        ${escapeHTML(labelStatus(status))}
                    </span>
                </td>

                <td>${escapeHTML(catatan)}</td>

                <td>
                    <button
                        type="button"
                        class="button button--light"
                        data-history-view="${escapeHTML(item.id)}">
                        Lihat
                    </button>
                </td>
            </tr>
        `;

    }).join("");
}


// ==========================================
// VIEW REQUEST DETAILS
// ==========================================

function lihatSejarahPermohonan(id) {

    const semuaPermohonan = dapatkanSenaraiPermohonan();

    const rekod = semuaPermohonan.find(item => item.id === id);

    if (!rekod) {
        alert("Rekod permohonan tidak dijumpai.");
        return;
    }

    const status = normalisasiStatus(rekod.status);

    document.getElementById("requestDetailId").textContent =
        rekod.id;

    document.getElementById("requestDetailModule").textContent =
        rekod.modul || "-";

    document.getElementById("requestDetailDate").textContent =
        rekod.tarikhPermohonan || "-";

    document.getElementById("requestDetailApplicant").textContent =
        dapatkanNamaPemohon(rekod);

    document.getElementById("requestAdminRemarks").textContent =
        rekod.catatanPentadbir || rekod.remark || "Tiada catatan.";

    document.getElementById("requestDetailStatus").innerHTML = `
        <span class="request-status request-status--${escapeHTML(status)}">
            ${escapeHTML(labelStatus(status))}
        </span>
    `;

    // Open existing modal
    document.getElementById("requestDetailModal").style.display = "flex";
}


// ==========================================
// CLOSE REQUEST DETAIL MODAL
// ==========================================

function tutupSejarahModal() {

    document.getElementById("requestDetailModal").style.display = "none";
}


// ==========================================
// CONNECT SEARCH, FILTER AND VIEW BUTTONS
// ==========================================

document.getElementById("requestSearch")
    ?.addEventListener("input", paparSejarahPermohonan);

document.getElementById("requestStatusFilter")
    ?.addEventListener("change", paparSejarahPermohonan);


// Event delegation for dynamically generated
// Lihat buttons and existing modal close buttons.

document.addEventListener("click", function(event) {

    const viewButton = event.target.closest("[data-history-view]");

    if (viewButton) {
        lihatSejarahPermohonan(viewButton.dataset.historyView);
    }

    if (event.target.closest("[data-close-request]")) {
        tutupSejarahModal();
    }

});

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}
// Initial display

paparSejarahPermohonan();

/* ==========================================
   E-FAIL 2.0
   PENGESAHAN PERMOHONAN (PENTADBIR)
========================================== */

let permohonanAktifId = null;
let tabPengesahanAktif = "pending";


// ==========================================
// DISPLAY REQUEST LIST
// ==========================================

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

    document.getElementById("approvalPendingCount").textContent =
        semuaPermohonan.filter(item =>
            normalisasiStatus(item.status) === "pending"
        ).length;

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

        const sepadanModul =
            !penapisModul || item.modul === penapisModul;

        return sepadanTab && sepadanCarian && sepadanModul;
    });


    // Update empty state and result count

    document.getElementById("approvalEmpty").hidden =
        hasil.length > 0;

    document.getElementById("approvalResultCount").textContent =
        hasil.length + " permohonan";


    // Display table

    tbody.innerHTML = hasil.map(item => {

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

    }).join("");
}


// ==========================================
// VIEW REQUEST DETAILS
// ==========================================

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

    bahagianTindakan.hidden = !masihMenunggu;
    butangTindakan.hidden = !masihMenunggu;
    notaSejarah.hidden = masihMenunggu;


    // Open modal

    const modal = document.getElementById("approvalDetailModal");

    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");
}


// ==========================================
// CLOSE MODAL
// ==========================================

function tutupModalPengesahan() {

    const modal = document.getElementById("approvalDetailModal");

    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");

    permohonanAktifId = null;
}


// ==========================================
// APPROVE OR REJECT REQUEST
// ==========================================

function tindakanPengesahan(statusBaharu) {

    if (!permohonanAktifId) {
        alert("Tiada permohonan dipilih.");
        return;
    }

    const catatan = document
        .getElementById("approvalRemarks")
        .value.trim();


    // Rejection requires a reason

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


    // Update existing request

    semuaPermohonan[indeks].status = statusBaharu;
    semuaPermohonan[indeks].catatanPentadbir = catatan;

    semuaPermohonan[indeks].tarikhTindakanPentadbir =
        new Date().toLocaleString("ms-MY");


    // Save updated data

    try {

        localStorage.setItem(
            "efailRequests",
            JSON.stringify(semuaPermohonan)
        );

    } catch (error) {

        console.error("Ralat menyimpan pengesahan:", error);

        alert("Gagal menyimpan pengesahan: " + error.message);

        return;
    }


    // Refresh both modules

    paparSenaraiPengesahan();
    paparSejarahPermohonan();

    tutupModalPengesahan();

    alert(
        statusBaharu === "Diluluskan"
            ? "Permohonan berjaya diluluskan."
            : "Permohonan telah ditolak."
    );
}


// ==========================================
// CONNECT BUTTONS AND FILTERS
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

/* ==========================================
   E-FAIL 2.0
   PERMOHONAN PINJAMAN FAIL
========================================== */

function hantarPermohonanPinjaman() {

    const form = document.getElementById("formPinjaman");

    // Check required fields
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    // Collect form information
    const maklumat = {};

    form.querySelectorAll(".field").forEach(field => {

        const label = field.querySelector("label");
        const input = field.querySelector("input, select, textarea");

        if (!label || !input) return;

        const namaMedan = label.textContent
            .replace("*", "")
            .trim();

        maklumat[namaMedan] = input.value.trim();

    });


    // Create application record
    const permohonan = {

        id: "EF-PJ-" + Date.now(),

        modul: "Pinjaman Fail",

        maklumat: maklumat,

        sokongan: {},

        status: "Menunggu Pengesahan",

        catatanPentadbir: "",

        tarikhPermohonan: new Date().toLocaleString("ms-MY")

    };


    // Save to shared localStorage
    try {

        const senaraiPermohonan = dapatkanSenaraiPermohonan();

        senaraiPermohonan.push(permohonan);

        localStorage.setItem(
            "efailRequests",
            JSON.stringify(senaraiPermohonan)
        );

    } catch (error) {

        console.error("Ralat menyimpan permohonan:", error);

        alert("Permohonan gagal disimpan: " + error.message);

        return;
    }


    // Refresh history and approval tables
    paparSejarahPermohonan();
    paparSenaraiPengesahan();


    // Confirmation
    alert(
        "Permohonan Pinjaman Fail berjaya dihantar!\n\n" +
        "No. Rujukan: " + permohonan.id +
        "\nStatus: " + permohonan.status
    );


    // Reset form
    form.reset();

    console.log("Permohonan Pinjaman Fail:", permohonan);

}/* ==========================================
   E-FAIL 2.0
   PENDAFTARAN FAIL
========================================== */

function hantarPermohonanPendaftaran() {

    const form = document.getElementById("formPendaftaran");

    // Check required fields
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    // Collect form information
    const maklumat = {};

    form.querySelectorAll(".field").forEach(field => {

        const label = field.querySelector("label");
        const input = field.querySelector("input, select, textarea");

        if (!label || !input) return;

        const namaMedan = label.textContent
            .replace("*", "")
            .trim();

        maklumat[namaMedan] = input.value.trim();

    });


    // Create application record
    const permohonan = {

        id: "EF-PD-" + Date.now(),

        modul: "Pendaftaran Fail",

        maklumat: maklumat,

        sokongan: {},

        status: "Menunggu Pengesahan",

        catatanPentadbir: "",

        tarikhPermohonan: new Date().toLocaleString("ms-MY")

    };


    // Save to shared localStorage
    try {

        const senaraiPermohonan = dapatkanSenaraiPermohonan();

        senaraiPermohonan.push(permohonan);

        localStorage.setItem(
            "efailRequests",
            JSON.stringify(senaraiPermohonan)
        );

    } catch (error) {

        console.error("Ralat menyimpan pendaftaran:", error);

        alert("Pendaftaran gagal disimpan: " + error.message);

        return;
    }


    // Refresh both modules
    paparSejarahPermohonan();
    paparSenaraiPengesahan();


    // Confirmation
    alert(
        "Pendaftaran Fail berjaya dihantar!\n\n" +
        "No. Rujukan: " + permohonan.id +
        "\nStatus: " + permohonan.status
    );


    // Reset form
    form.reset();

    console.log("Pendaftaran Fail:", permohonan);

}