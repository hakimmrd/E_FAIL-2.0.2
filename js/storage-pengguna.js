/* ==========================================
   STORAGE: PENGGUNA
   Profil dan rekod pengguna sistem.
========================================== */

function dapatkanSenaraiPengguna() {
    return bacaStorageSenarai("efailUsers");
}

function simpanSenaraiPengguna(data) {
    return simpanStorageSenarai("efailUsers", data);
}

function simpanPengguna(pengguna) {
    const senarai = dapatkanSenaraiPengguna();
    const emel = String(pengguna.emel || "").trim().toLowerCase();
    const noKP = String(pengguna.noKP || "").replace(/[-\s]/g, "");

    if (senarai.some(u =>
        (emel && String(u.emel || "").trim().toLowerCase() === emel) ||
        (noKP && String(u.noKP || "").replace(/[-\s]/g, "") === noKP)
    )) {
        alert("Emel atau No. Kad Pengenalan telah didaftarkan.");
        return false;
    }

    senarai.push(pengguna);
    return simpanSenaraiPengguna(senarai);
}
