/* ==========================================
   MODULE: SEJARAH PERMOHONAN
   Pengguna hanya melihat permohonan miliknya.
========================================== */

function permohonanMilikPengguna(permohonan, profil = dapatkanProfilPenggunaDemo()) {
    if (!permohonan || !profil) return false;

    const id = String(profil.id || "").trim();
    const emel = String(profil.emel || "").trim().toLowerCase();
    const noKP = String(profil.noKP || "").replace(/[-\s]/g, "");
    const nama = String(profil.nama || "").trim().toLowerCase();

    if (id && permohonan.pemohonId) return String(permohonan.pemohonId) === id;
    if (emel && permohonan.pemohonEmel) return String(permohonan.pemohonEmel).trim().toLowerCase() === emel;
    if (noKP && permohonan.pemohonNoKP) return String(permohonan.pemohonNoKP).replace(/[-\s]/g, "") === noKP;

    const namaPermohonan = String(
        permohonan.pemohonNama || permohonan.maklumat?.["Maklumat Pemohon"] || permohonan.applicant || ""
    ).trim().toLowerCase();
    return Boolean(nama && namaPermohonan && nama !== "-" && namaPermohonan === nama);
}

function dapatkanPermohonanPengguna() {
    const profil = dapatkanProfilPenggunaDemo();
    return dapatkanSenaraiPermohonan().filter(item => permohonanMilikPengguna(item, profil));
}

function paparSejarahPermohonan() {
    const tbody = document.getElementById("requestHistoryBody");
    if (!tbody) return;

    const semuaPermohonan = dapatkanPermohonanPengguna();
    const carian = (document.getElementById("requestSearch")?.value || "").toLowerCase();
    const penapisStatus = document.getElementById("requestStatusFilter")?.value || "";

    document.getElementById("totalRequests").textContent = semuaPermohonan.length;
    document.getElementById("pendingRequests").textContent = semuaPermohonan.filter(item => normalisasiStatus(item.status) === "pending").length;
    document.getElementById("approvedRequests").textContent = semuaPermohonan.filter(item => normalisasiStatus(item.status) === "approved").length;
    document.getElementById("rejectedRequests").textContent = semuaPermohonan.filter(item => normalisasiStatus(item.status) === "rejected").length;

    const hasil = semuaPermohonan.filter(item => {
        const teks = [item.id, item.modul, item.noFail, item.maklumat?.["No. Fail"]].join(" ").toLowerCase();
        return teks.includes(carian) && (!penapisStatus || normalisasiStatus(item.status) === penapisStatus);
    });

    const emptyMessage = document.getElementById("requestEmpty");
    if (emptyMessage) emptyMessage.hidden = hasil.length > 0;

    paparPagination(tbody, hasil, "sejarah-permohonan", item => {
        const status = normalisasiStatus(item.status);
        return `<tr>
            <td>${escapeHTML(item.id)}</td>
            <td>${escapeHTML(item.modul || "-")}</td>
            <td>${escapeHTML(item.tarikhPermohonan || "-")}</td>
            <td><span class="request-status request-status--${escapeHTML(status)}">${escapeHTML(labelStatus(status))}</span></td>
            <td>${escapeHTML(item.catatanPentadbir || item.remark || "-")}</td>
            <td><button type="button" class="button button--light" data-history-view="${escapeHTML(item.id)}">Lihat</button></td>
        </tr>`;
    });
}

function lihatSejarahPermohonan(id) {
    const rekod = dapatkanPermohonanPengguna().find(item => item.id === id);
    if (!rekod) {
        alert("Permohonan tidak dijumpai dalam sejarah akaun pengguna ini.");
        return;
    }

    const status = normalisasiStatus(rekod.status);
    document.getElementById("requestDetailId").textContent = rekod.id || "-";
    document.getElementById("requestDetailModule").textContent = rekod.modul || "-";
    document.getElementById("requestDetailDate").textContent = rekod.tarikhPermohonan || "-";
    document.getElementById("requestDetailApplicant").textContent = dapatkanNamaPemohon(rekod);
    document.getElementById("requestDetailFile").textContent = (rekod.noFail || rekod.maklumat?.["No. Fail"] || "-") +
        (rekod.jilid || rekod.maklumat?.["Jilid"] ? " / Jilid " + (rekod.jilid || rekod.maklumat?.["Jilid"]) : "");
    document.getElementById("requestDetailApprover").textContent = rekod.disahkanOleh || "Belum disahkan";
    document.getElementById("requestAdminRemarks").textContent = rekod.catatanPentadbir || "Tiada catatan.";
    document.getElementById("requestDetailStatus").innerHTML = `<span class="request-status request-status--${escapeHTML(status)}">${escapeHTML(labelStatus(status))}</span>`;
    document.getElementById("requestDetailModal").style.display = "flex";
}

function tutupSejarahModal() {
    const modal = document.getElementById("requestDetailModal");
    if (modal) modal.style.display = "none";
}

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("requestSearch")?.addEventListener("input", paparSejarahPermohonan);
    document.getElementById("requestStatusFilter")?.addEventListener("change", paparSejarahPermohonan);
    document.addEventListener("click", function (event) {
        const viewButton = event.target.closest("[data-history-view]");
        if (viewButton) lihatSejarahPermohonan(viewButton.dataset.historyView);
        if (event.target.closest("[data-close-request]")) tutupSejarahModal();
    });
    paparSejarahPermohonan();
});
