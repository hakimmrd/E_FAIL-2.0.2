/* ==========================================
   MODULE: LAPORAN
   Semua laporan membaca MASTERLIST sahaja.
   Masterlist ialah gabungan paparan, bukan
   storage kedua yang menggandakan rekod.
========================================== */

function dapatkanSemuaDataLaporan() {
    return typeof dapatkanMasterlist === "function" ? dapatkanMasterlist() : [];
}

function tahunRekodLaporan(item) {
    const teks = [item.tarikhPendaftaran, item.tarikhKelulusan, item.tarikhPermohonan, item.tarikhMasa, item.tarikh].filter(Boolean).join(" ");
    return (teks.match(/20\d{2}/) || [])[0] || "";
}

function paparLaporan() {
    const semua = dapatkanSemuaDataLaporan();
    const jenis = document.getElementById("laporanJenis")?.value || "Semua Rekod";
    const bahagian = document.getElementById("laporanBahagian")?.value || "";
    const tahun = document.getElementById("laporanTahun")?.value || "";

    const hasil = semua.filter(item => {
        const padanJenis = jenis === "Semua Rekod" ||
            (jenis === "Senarai Fail Umum" && item.kategoriKod === "umum") ||
            (jenis === "Senarai Fail Peribadi" && item.kategoriKod === "peribadi") ||
            (jenis === "Semua Jilid" && (item.jenisRekod === "Jilid" || Number(item.jilid) > 1)) ||
            (jenis === "Jilid Aktif" && item.statusJilid === "Aktif") ||
            (jenis === "Jilid Tidak Aktif" && item.statusJilid === "Tidak Aktif") ||
            (jenis === "Jumlah Fail Dipinjam" && item.statusPinjaman === "Dipinjam") ||
            (jenis === "Jumlah Fail Tersedia" && item.statusPinjaman === "Tersedia") ||
            (jenis === "Lokasi" && Boolean(item.lokasi || item.keteranganLokasi));
        const padanBahagian = !bahagian || String(item.bahagian || "").includes(bahagian);
        const padanTahun = !tahun || tahunRekodLaporan(item) === tahun;
        return padanJenis && padanBahagian && padanTahun;
    });

    const aktif = hasil.filter(item => item.statusJilid === "Aktif").length;
    const tidakAktif = hasil.filter(item => item.statusJilid === "Tidak Aktif").length;
    const jumlah = document.getElementById("laporanJumlah");
    const aktifEl = document.getElementById("laporanAktif");
    const tidakEl = document.getElementById("laporanTidakAktif");
    if (jumlah) jumlah.textContent = hasil.length;
    if (aktifEl) aktifEl.textContent = aktif;
    if (tidakEl) tidakEl.textContent = tidakAktif;

    const tbody = document.getElementById("laporanTableBody");
    if (!tbody) return;
    const render = item => `<tr>
        <td>${escapeHTML(item.noFail || item.id || "-")}</td>
        <td>${escapeHTML(item.tajuk || "-")}</td>
        <td>${escapeHTML(item.kategori || "-")}</td>
        <td>${escapeHTML(item.bahagian || "-")}</td>
        <td>${escapeHTML(item.jilid ? "Jilid " + item.jilid : "-")}</td>
        <td>${escapeHTML(item.statusPinjaman || "Tersedia")} / ${escapeHTML(item.statusJilid || "-")}</td>
        <td>${escapeHTML(tahunRekodLaporan(item) || "-")}</td>
    </tr>`;
    paparPagination(tbody, hasil, "laporan", render);
    const count = document.getElementById("laporanCount");
    if (count) count.textContent = hasil.length + " rekod ditemui daripada Masterlist";
}

document.addEventListener("DOMContentLoaded", function () {
    const pilihTahun = document.getElementById("laporanTahun");
    if (pilihTahun) {
        const tahun = [...new Set(dapatkanSemuaDataLaporan().map(tahunRekodLaporan).filter(Boolean))].sort().reverse();
        pilihTahun.innerHTML = '<option value="">Semua Tahun</option>' +
            tahun.map(x => `<option value="${escapeHTML(x)}">${escapeHTML(x)}</option>`).join("");
    }
    document.getElementById("laporanJana")?.addEventListener("click", paparLaporan);
    document.getElementById("laporanJenis")?.addEventListener("change", paparLaporan);
    document.getElementById("laporanBahagian")?.addEventListener("change", paparLaporan);
    document.getElementById("laporanTahun")?.addEventListener("change", paparLaporan);
    paparLaporan();
});
