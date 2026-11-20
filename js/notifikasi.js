
/* ==========================================
   E-FAIL 2.0
   NOTIFICATION SYSTEM
========================================== */

// DAPATKAN NILAI REKOD
function nilaiNotifikasi(permohonan, nama) {
    return permohonan?.[nama] ??
           permohonan?.maklumat?.[nama] ??
           "";
}

// DAPATKAN STATUS
function statusNotifikasi(permohonan) {
    return String(permohonan?.status || "").toLowerCase().trim();
}

// DAPATKAN JENIS TRANSAKSI
// Gunakan modul sebagai fallback kerana sesetengah
// permohonan tidak mempunyai jenisTransaksi.
function jenisNotifikasi(permohonan) {
    return String(
        permohonan?.jenisTransaksi ||
        permohonan?.jenisPermohonan ||
        permohonan?.jenis ||
        permohonan?.modul ||
        ""
    ).toLowerCase().trim();
}

// SEMAK STATUS MENUNGGU
function permohonanMenunggu(permohonan) {
    const status = statusNotifikasi(permohonan);

    return status.includes("menunggu") ||
           status.includes("pending");
}

// ==========================================
// TARIKH PINJAMAN
// ==========================================

function tukarTarikhNotifikasi(nilai) {
    if (!nilai) return null;

    // Format tarikh Malaysia: DD/MM/YYYY
    const padanan = String(nilai).match(
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})/
    );

    if (padanan) {
        return new Date(
            Number(padanan[3]),
            Number(padanan[2]) - 1,
            Number(padanan[1])
        );
    }

    const tarikh = new Date(nilai);

    return isNaN(tarikh.getTime()) ? null : tarikh;
}

function kiraHariPinjaman(rekodJilid) {
    const tarikh = tukarTarikhNotifikasi(
        rekodJilid?.tarikhPinjam
    );

    if (!tarikh) return null;

    const hariIni = new Date();
    hariIni.setHours(0, 0, 0, 0);
    tarikh.setHours(0, 0, 0, 0);

    return Math.floor(
        (hariIni - tarikh) / (1000 * 60 * 60 * 24)
    );
}

// ==========================================
// SEMAK PERMOHONAN PEMULANGAN
// ==========================================

function pemulanganSedangDiproses(rekodJilid, semuaPermohonan) {
    return semuaPermohonan.some(permohonan => {
        const jenis = jenisNotifikasi(permohonan);
        const status = statusNotifikasi(permohonan);

        return jenis.includes("pemulang") &&
               String(permohonan.jilidId) === String(rekodJilid.id) &&
               (
                   status.includes("menunggu") ||
                   status.includes("pending") ||
                   status.includes("lulus") ||
                   status.includes("approved")
               );
    });
}

// ==========================================
// NOTIFIKASI PENGGUNA / PENYELARAS
// PERINGATAN PEMULANGAN FAIL
// ==========================================

function dapatkanNotifikasiPemulangan(semuaPermohonan) {

    // Ambil rekod jilid daripada storage sebenar
    const semuaJilid = typeof dapatkanSenaraiJilid === "function"
        ? dapatkanSenaraiJilid()
        : [];

    return semuaJilid
        .filter(rekodJilid => {

            // Hanya jilid yang sedang dipinjam
            if (
                String(rekodJilid.statusPinjaman).toLowerCase() !== "dipinjam"
            ) {
                return false;
            }

            // Jangan beri peringatan jika pemulangan sudah dipohon
            if (pemulanganSedangDiproses(rekodJilid, semuaPermohonan)) {
                return false;
            }

            const hari = kiraHariPinjaman(rekodJilid);

            // Peringatan bermula hari ke-12
            return hari !== null && hari >= 12;
        })
        .map(rekodJilid => {

            const hari = kiraHariPinjaman(rekodJilid);

            return {
                tajuk: "Peringatan Pemulangan Fail",
                mesej: `Fail ${rekodJilid.noFail} · Jilid ${rekodJilid.jilid} telah dipinjam selama ${hari} hari. Sila pulangkan fail.`,
                rujukan: rekodJilid.noFail || rekodJilid.id,
                jenis: "warning",
                ikon: "bi-clock-history",
                halaman: "page-pergerakan",
                jumlah: 1
            };
        });
}

// ==========================================
// NOTIFIKASI PENTADBIR
// KELULUSAN PERMOHONAN
// ==========================================

function dapatkanNotifikasiKelulusan(semuaPermohonan) {

    const menunggu = semuaPermohonan.filter(
        permohonanMenunggu
    );

  const kategori = [
    {
        nama: "Pengesahan Pembukaan Fail",
        kataKunci: ["pembukaan-fail", "pembukaan fail"]
    },
    {
        nama: "Pengesahan Pendaftaran Fail",
        kataKunci: ["pendaftaran"]
    },
    {
        nama: "Pengesahan Kemaskini Fail",
        kataKunci: ["pengemaskinian", "naik-taraf", "kemaskini"]
    },
    {
        nama: "Pengesahan Pinjaman Fail",
        kataKunci: ["pinjaman"]
    },
    {
        nama: "Pengesahan Pembukaan Jilid Baharu",
        kataKunci: ["pembukaan jilid", "jilid baru"]
    },
    {
        nama: "Pengesahan Pemulangan Fail",
        kataKunci: ["pemulangan"]
    }
];

    return kategori.map(item => {

        const jumlah = menunggu.filter(permohonan => {
            const jenis = jenisNotifikasi(permohonan);

            return item.kataKunci.some(kata =>
                jenis.includes(kata)
            );
        }).length;

        return {
            tajuk: item.nama,
            jumlah: jumlah,
            halaman: "page-pengesahan"
        };
    });
}

// ==========================================
// PAPARKAN NOTIFIKASI
// ==========================================

function paparNotifikasi() {

    const senarai = document.getElementById("notificationList");
    const badge = document.getElementById("notificationBadge");
    const jumlah = document.getElementById("notificationCount");

    if (!senarai) return;

    const semuaPermohonan = dapatkanSenaraiPermohonan();


    // Dapatkan peranan pengguna
    const profil = typeof dapatkanProfilPenggunaDemo === "function"
        ? dapatkanProfilPenggunaDemo()
        : {};

    const peranan = String(
        profil?.role || profil?.peranan || ""
    ).toLowerCase();

    const pentadbir = peranan.includes("pentadbir");

    let notifikasi = pentadbir
        ? dapatkanNotifikasiKelulusan(semuaPermohonan)
        : dapatkanNotifikasiPemulangan(semuaPermohonan);

    // Kira jumlah notifikasi
    const jumlahNotifikasi = pentadbir
        ? notifikasi.reduce((total, item) => total + item.jumlah, 0)
        : notifikasi.length;

    // Kemaskini badge
    if (badge) {
        badge.textContent = jumlahNotifikasi;
        badge.style.display = jumlahNotifikasi
            ? "inline-flex"
            : "none";
    }

    if (jumlah) {
        jumlah.textContent = `${jumlahNotifikasi} Baru`;
    }

    // Tiada notifikasi
    if (!jumlahNotifikasi) {
        senarai.innerHTML = `
            <div class="notification-item">
                <div class="notification-content">
                    <p>Tiada notifikasi baharu.</p>
                </div>
            </div>`;
        return;
    }

    // PAPARAN PENTADBIR
    if (pentadbir) {

        senarai.innerHTML = notifikasi.map(item => `
            <div class="notification-item"
                 data-go="${item.halaman}">

                <span class="notification-count-box ${
                    item.jumlah > 0
                        ? "has-notification"
                        : "no-notification"
                }">
                    ${item.jumlah}
                </span>

                <div class="notification-content">
                    <strong>${item.tajuk}</strong>
                </div>

            </div>
        `).join("");

    }

    // PAPARAN PENGGUNA / PENYELARAS
    else {

        senarai.innerHTML = notifikasi.map(item => `
            <div class="notification-item unread"
                 data-go="${item.halaman}">

                <div class="notification-icon ${item.jenis}">
                    <i class="bi ${item.ikon}"></i>
                </div>

                <div class="notification-content">
                    <strong>${item.tajuk}</strong>
                    <p>${item.mesej}</p>
                    <small>${item.rujukan}</small>

                    <span class="notification-action">
                        Lihat Pergerakan Fail →
                    </span>
                </div>

            </div>
        `).join("");
    }
}

// ==========================================
// KLIK NOTIFIKASI
// ==========================================

document.addEventListener("click", function(event) {

    const notifikasi = event.target.closest(
        ".notification-item[data-go]"
    );

    if (!notifikasi) return;

    const halaman = notifikasi.dataset.go;

    if (typeof openModule === "function") {
        openModule(halaman);
    }
});

// ==========================================
// MUATKAN NOTIFIKASI
// ==========================================

document.addEventListener("DOMContentLoaded", function() {
    paparNotifikasi();
});
