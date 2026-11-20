/* ==========================================
   E-FAIL 2.0
   DASHBOARD: CARIAN FAIL & AUDIT TRAIL
========================================== */


// FUNCTION: dapatkanSemuaRekodDashboard
// PURPOSE: Mendapatkan semua fail dan jilid daripada shared Masterlist.
function dapatkanSemuaRekodDashboard(kataKunci = "") {
    const semuaRekod = typeof carianRekodFail === "function"
        ? carianRekodFail("semua", kataKunci)
        : (typeof dapatkanMasterlist === "function" ? dapatkanMasterlist() : []);

    return semuaRekod.map(item => ({
        ...item,
        rekodId: item.rekodId || item.id,
        failId: item.idFail || item.failId || item.id,
        noFail: item.noFail || "",
        tajuk: item.tajuk || "",
        kategori: item.kategori || item.kategoriLabel || item.kategoriKod || "",
        jilid: Number(item.jilid) || 1,
        statusJilid: item.statusJilid || "Aktif",
        statusPinjaman: item.statusPinjaman || "Tersedia"
    }));
}


// FUNCTION: paparJadualDashboard
// PURPOSE: Memaparkan semua fail dan jilid serta menyokong carian.
function paparJadualDashboard() {
    const tbody = document.getElementById("dashboardFileTableBody");
    const inputCarian = document.getElementById("dashboardFileSearch");
    const jumlah = document.getElementById("dashboardFileCount");
    if (!tbody) return;

    const carian = (inputCarian?.value || "").trim().toLowerCase();
    const semuaRekod = dapatkanSemuaRekodDashboard();
    const hasil = carian
    ? dapatkanSemuaRekodDashboard(carian)
    : [];

    if (jumlah) jumlah.textContent = hasil.length + " daripada " + semuaRekod.length + " rekod";

    if (!hasil.length) {
    tbody.innerHTML = `
        <tr>
            <td colspan="6" class="muted">
                ${carian
                    ? "Tiada rekod dijumpai"
                    : "Taip untuk mencari rekod"}
            </td>
        </tr>
    `;
    return;

}

    paparPagination(tbody, hasil, "dashboard", fail => `
        <tr class="dashboard-file-row" data-audit-fail="${escapeHTML(fail.failId)}" data-audit-no="${escapeHTML(fail.noFail)}" data-audit-jilid="${escapeHTML(fail.jilid)}" style="cursor:pointer" title="Klik untuk melihat Audit Trail">
            <td><b>${escapeHTML(fail.noFail)}</b></td><td>${escapeHTML(fail.tajuk)}</td>
            <td>${escapeHTML(fail.bahagian || "-")}</td><td>Jilid ${escapeHTML(fail.jilid)}</td>
            <td>${escapeHTML(fail.statusJilid)}</td><td>${escapeHTML(fail.statusPinjaman)}</td>
        </tr>`);
}

// FUNCTION: bukaAuditTrailDashboard
// PURPOSE: Memaparkan sejarah tindakan bagi fail dan jilid yang dipilih.
function bukaAuditTrailDashboard(failId, noFail, jilid) {
    const rekod = dapatkanSemuaRekodDashboard().find(item =>
        String(item.failId) === String(failId) &&
        String(item.noFail) === String(noFail) &&
        String(item.jilid) === String(jilid)
    );
    if (!rekod) return;

    const modal = document.getElementById("dashboardAuditModal");
    const title = document.getElementById("dashboardAuditTitle");
    const subtitle = document.getElementById("dashboardAuditSubtitle");
    const info = document.getElementById("dashboardAuditFileInfo");
    const tbody = document.getElementById("dashboardAuditTableBody");

    if (!modal || !info || !tbody) return;

    if (title) title.textContent = "Audit Trail — " + rekod.noFail;
    if (subtitle) subtitle.textContent = (rekod.tajuk || "-") + " · Jilid " + rekod.jilid;

    info.innerHTML = `
        <div class="jp-form-grid">
            <div class="field"><label>No. Fail</label><input readonly value="${escapeHTML(rekod.noFail)}"></div>
            <div class="field"><label>Tajuk Fail</label><input readonly value="${escapeHTML(rekod.tajuk)}"></div>
            <div class="field"><label>Bahagian</label><input readonly value="${escapeHTML(rekod.bahagian || "-")}"></div>
            <div class="field"><label>Jilid</label><input readonly value="${escapeHTML(rekod.jilid)}"></div>
            <div class="field"><label>Status Jilid</label><input readonly value="${escapeHTML(rekod.statusJilid)}"></div>
            <div class="field"><label>Status Pinjaman</label><input readonly value="${escapeHTML(rekod.statusPinjaman)}"></div>
        </div>
    `;

    const permohonan = typeof dapatkanSenaraiPermohonan === "function" ? dapatkanSenaraiPermohonan() : [];
    const auditPermohonan = permohonan.filter(item => {
        const no = item.noFail || item.maklumat?.["No. Fail"] || "";
        const idFail = item.failId || "";
        const nomborJilid = item.jilid || item.maklumat?.["Jilid"] || "";
        const padanFail = (idFail && String(idFail) === String(rekod.failId)) || String(no) === String(rekod.noFail);
        return padanFail && (!nomborJilid || String(nomborJilid) === String(rekod.jilid));
    }).flatMap(item => {
        const nama = typeof dapatkanNamaPemohon === "function" ? dapatkanNamaPemohon(item) : (item.maklumat?.["Maklumat Pemohon"] || "-");
        const tarikhHantar = item.tarikhPermohonan || "-";
        const events = [{
            tarikhMasa: tarikhHantar, tindakan: "Permohonan dihantar — " + (item.modul || ""),
            namaPengguna: nama, disahkanOleh: "-", status: "Permohonan diterima"
        }];
        if (item.tarikhTindakanPentadbir || ["Diluluskan", "Ditolak"].includes(item.status)) {
            events.push({
                tarikhMasa: item.tarikhTindakanPentadbir || tarikhHantar,
                tindakan: (item.modul || "Permohonan") + " — keputusan pengesahan",
                namaPengguna: nama, disahkanOleh: item.disahkanOleh || item.namaPentadbir || "-",
                status: item.status || "-"
            });
        }
        return events;
    });
    const semuaAudit = typeof dapatkanSenaraiAuditTrail === "function" ? dapatkanSenaraiAuditTrail() : [];
    const auditLama = semuaAudit.filter(item =>
        (item.failId && String(item.failId) === String(rekod.failId)) ||
        (item.noFail && String(item.noFail) === String(rekod.noFail) &&
            (!item.jilid || String(item.jilid) === String(rekod.jilid)))
    );
    const sejarah = [...auditPermohonan, ...auditLama].sort((a, b) =>
        String(b.tarikhMasa || b.tarikh || "").localeCompare(String(a.tarikhMasa || a.tarikh || ""))
    );

    if (sejarah.length) paparPagination(tbody, sejarah, "audit-trail", item => `
        <tr>
            <td>${escapeHTML(item.tarikhMasa || [item.tarikh, item.masa].filter(Boolean).join(" ") || "-")}</td>
            <td>${escapeHTML(item.tindakan || item.aktiviti || "-")}</td>
            <td>${escapeHTML(item.namaPengguna || item.peminjam || item.disediakanOleh || "-")}</td>
            <td>${escapeHTML(item.disahkanOleh || item.namaPentadbir || "-")}</td>
            <td>${escapeHTML(item.status || "-")}</td>
        </tr>
    `);
    else tbody.innerHTML = '<tr><td colspan="5" class="muted">Belum ada rekod permohonan, pengesahan atau pergerakan untuk jilid ini.</td></tr>';

    if (!modal.open) modal.showModal();
}

// EVENT LISTENERS: Carian jadual dan paparan audit trail.
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("dashboardFileSearch")?.addEventListener("input", paparJadualDashboard);

    document.getElementById("dashboardFileTableBody")?.addEventListener("click", function (event) {
        const row = event.target.closest("[data-audit-fail]");
        if (row) bukaAuditTrailDashboard(row.dataset.auditFail, row.dataset.auditNo, row.dataset.auditJilid);
    });

    document.addEventListener("click", function (event) {
        if (event.target.closest("[data-close-audit]")) {
            document.getElementById("dashboardAuditModal")?.close();
        }
    });

    paparJadualDashboard();
});


// FUNCTION: toggleNotifications
// PURPOSE: Membuka atau menutup dropdown notifikasi.
function toggleNotifications() {
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) dropdown.classList.toggle('show');
}

// FUNCTION: markAllRead
// PURPOSE: Menandakan semua notifikasi sebagai telah dibaca.
function markAllRead() {
    document.querySelectorAll('.notification-item').forEach(item => {
        item.classList.remove('unread');
    });

    const count = document.getElementById('notificationCount');
    if (count) {
        count.textContent = '0';
        count.style.display = 'none';
    }
}

// EVENT LISTENER: Tutup dropdown notifikasi apabila klik di luar.
document.addEventListener('click', function(event) {
    const wrapper = document.querySelector('.notification-wrapper');
    const dropdown = document.getElementById('notificationDropdown');

    if (wrapper && dropdown && !wrapper.contains(event.target)) {
        dropdown.classList.remove('show');
    }
});
