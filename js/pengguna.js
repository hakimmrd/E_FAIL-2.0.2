/* MODULE: PENGURUSAN PENGGUNA
   Rekod hanya dipaparkan selepas didaftarkan melalui borang Tambah Pengguna. */

function paparSenaraiPengguna() {
    const tbody = document.getElementById("senaraiPenggunaBody");
    if (!tbody) return;
    const senarai = dapatkanSenaraiPengguna();
    const render = item => `<tr>
        <td><b>${escapeHTML(item.nama)}</b><div class="muted">${escapeHTML(item.emel)}</div></td>
        <td>${escapeHTML(item.jawatan || "-")}</td>
        <td>${escapeHTML(item.bahagian || "-")}</td>
        <td>${escapeHTML(item.peranan || "-")}</td>
        <td><span class="pill ${item.status === "Aktif" ? "pill--green" : ""}">${escapeHTML(item.status || "Aktif")}</span></td>
        <td><button type="button" class="text-link" data-padam-pengguna="${escapeHTML(item.id)}">Padam</button></td>
    </tr>`;
    paparPagination(tbody, senarai, "pengguna", render);
    const jumlah = document.getElementById("jumlahPengguna");
    if (jumlah) jumlah.textContent = senarai.length + " Pengguna";
}

function daftarPenggunaBaharu(event) {
    event.preventDefault();
    const pengguna = {
        id: "USR-" + Date.now(),
        nama: document.getElementById("penggunaNama").value.trim(),
        noKP: document.getElementById("penggunaNoKP").value.trim(),
        emel: document.getElementById("penggunaEmel").value.trim(),
        jawatan: document.getElementById("penggunaJawatan").value.trim(),
        telefon: document.getElementById("penggunaTelefon").value.trim(),
        bahagian: document.getElementById("penggunaBahagian").value,
        peranan: document.getElementById("penggunaPeranan").value,
        status: document.getElementById("penggunaStatus").value,
        tarikhDaftar: new Date().toLocaleString("ms-MY")
    };
    if (!simpanPengguna(pengguna)) return;
    document.getElementById("formTambahPengguna").reset();
    paparSenaraiPengguna();
    alert("Pengguna berjaya didaftarkan.");
}

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("formTambahPengguna")?.addEventListener("submit", daftarPenggunaBaharu);
    document.addEventListener("click", function (event) {
        const butang = event.target.closest("[data-padam-pengguna]");
        if (!butang) return;
        if (!confirm("Padam rekod pengguna ini?")) return;
        const baki = dapatkanSenaraiPengguna().filter(item => item.id !== butang.dataset.padamPengguna);
        simpanSenaraiPengguna(baki);
        paparSenaraiPengguna();
    });
    paparSenaraiPengguna();
});
