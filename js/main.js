/* ==========================================
   E-FAIL 2.0
   MAIN INITIALISATION
========================================== */

document.addEventListener('DOMContentLoaded', function () {
    // Restore a direct URL hash only when the selected demo role can access it.
    const requestedPage = window.location.hash.replace(/^#/, '');
    if (requestedPage && document.getElementById('page-' + requestedPage) && window.showPage) {
        window.showPage(requestedPage);
    }
});

/* ==========================================
   MODULE: TOPBAR DATE AND TIME
========================================== */

// FUNCTION: updateTopbarDateTime
// PURPOSE: Mengemas kini tarikh dan masa pada topbar.
function updateTopbarDateTime() {
    const now = new Date();
    const date = now.toLocaleDateString("ms-MY", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const time = now.toLocaleTimeString("ms-MY", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
    document.getElementById("liveDate").textContent = date;
    document.getElementById("liveTime").textContent = time;
}

// Paparkan serta kemas kini masa setiap saat.
document.addEventListener("DOMContentLoaded", function () {
    updateTopbarDateTime();
    setInterval(updateTopbarDateTime, 1000);
});


// Pastikan medan Taraf/Kategori Fail hanya boleh diubah dalam Pendaftaran dan Naik Taraf.
document.addEventListener("click", function () { if (typeof kawalMedanTarafKategoriFail === "function") kawalMedanTarafKategoriFail(); });
