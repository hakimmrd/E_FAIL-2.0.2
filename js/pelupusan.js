
/* ==========================================
   E-FAIL 2.0
   MODULE: PELUPUSAN

   - Tempoh tidak aktif: 5 tahun
   - Amaran awal: 1 bulan sebelum 5 tahun
   - Sumber aktiviti: Audit Trail
   - Buat masa ini: Fail Umum sahaja
========================================== */
// ==========================================
// PAGINATION PELUPUSAN
// ==========================================

let halamanPelupusanSemasa = 1;
const rekodSetiapHalamanPelupusan = 10;

const TEMPOH_PELUPUSAN_TAHUN = 5;
const AMARAN_PELUPUSAN_BULAN = 1;



// ==========================================
// 1. PARSE TARIKH
// ==========================================

function parseTarikhPelupusan(nilai) {
    if (!nilai) return null;

    if (nilai instanceof Date) {
        return Number.isNaN(nilai.getTime()) ? null : new Date(nilai);
    }

    const teks = String(nilai).trim();

    if (!teks || teks === "-") return null;

    // Format dd/mm/yyyy atau dd-mm-yyyy
    const padananMY = teks.match(
        /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/
    );

    if (padananMY) {
        const [, hari, bulan, tahun, jam = "0", minit = "0", saat = "0"] = padananMY;

        const tarikh = new Date(
            Number(tahun),
            Number(bulan) - 1,
            Number(hari),
            Number(jam),
            Number(minit),
            Number(saat)
        );

        return Number.isNaN(tarikh.getTime()) ? null : tarikh;
    }

    const tarikh = new Date(teks);

    return Number.isNaN(tarikh.getTime()) ? null : tarikh;
}


// ==========================================
// 2. TAMBAH TEMPOH KALENDAR
// ==========================================

function tambahTempohPelupusan(tarikhAsal, tahun = 0, bulan = 0) {
    const hasil = new Date(tarikhAsal);
    const hariAsal = hasil.getDate();

    hasil.setDate(1);
    hasil.setMonth(hasil.getMonth() + bulan);
    hasil.setFullYear(hasil.getFullYear() + tahun);

    const hariAkhir = new Date(
        hasil.getFullYear(),
        hasil.getMonth() + 1,
        0
    ).getDate();

    hasil.setDate(Math.min(hariAsal, hariAkhir));

    return hasil;
}


function formatTarikhPelupusan(tarikh) {
    if (!tarikh) return "-";

    return tarikh.toLocaleDateString("ms-MY", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}


function hariAntaraPelupusan(tarikhMula, tarikhAkhir) {
    const satuHari = 24 * 60 * 60 * 1000;

    const mula = new Date(
        tarikhMula.getFullYear(),
        tarikhMula.getMonth(),
        tarikhMula.getDate()
    );

    const akhir = new Date(
        tarikhAkhir.getFullYear(),
        tarikhAkhir.getMonth(),
        tarikhAkhir.getDate()
    );

    return Math.ceil((akhir - mula) / satuHari);
}


// ==========================================
// 3. SEMAK AKTIVITI AUDIT TRAIL
// ==========================================

function auditLayakUntukPelupusan(rekod) {
    const aktiviti = String(
        rekod.aktiviti || rekod.tindakan || ""
    ).toLowerCase();

    const status = String(
        rekod.status || ""
    ).toLowerCase();

    if (!aktiviti) return false;

    // Aktiviti yang tidak dikira
    if (/lihat|papar|view|carian/.test(aktiviti)) {
        return false;
    }

    // Aktiviti yang layak
    if (!/pinjam|pulang|pemulangan|pergerakan|pindah|kemaskini|kemas kini|naik taraf|daftar jilid|pembukaan jilid/.test(aktiviti)) {
        return false;
    }

    // Jika status tersedia, pastikan transaksi selesai
    if (status && !/selesai|completed|diluluskan|approved/.test(status)) {
        return false;
    }

    return true;
}


// ==========================================
// 4. PADANKAN AUDIT DENGAN JILID
// ==========================================

function rekodAuditPadanJilid(rekodAudit, jilid) {
    const idAudit = rekodAudit.failId || "";
    const noAudit = rekodAudit.noFail || "";

    const padanFail =
        (idAudit && String(idAudit) === String(jilid.failId)) ||
        (noAudit && String(noAudit) === String(jilid.noFail));

    if (!padanFail) return false;

    // Aktiviti tanpa nombor jilid dianggap aktiviti fail
    return !rekodAudit.jilid ||
        Number(rekodAudit.jilid) === Number(jilid.jilid);
}


// ==========================================
// 5. DAPATKAN TARIKH ASAS JILID
// ==========================================

function dapatkanTarikhAsasJilid(jilid, failAsal) {
    const tarikhJilid = [
        jilid.tarikhDaftar,
        jilid.tarikhPendaftaran,
        jilid.tarikhKelulusan,
        jilid.tarikhDibuka,
        jilid.created_at,
        jilid.createdAt
    ];

    for (const nilai of tarikhJilid) {
        const tarikh = parseTarikhPelupusan(nilai);

        if (tarikh) return tarikh;
    }

    const tarikhFail = [
        failAsal?.tarikhDaftar,
        failAsal?.tarikhPendaftaran,
        failAsal?.tarikhDibuka,
        failAsal?.tarikhKelulusan,
        failAsal?.created_at,
        failAsal?.createdAt
    ];

    for (const nilai of tarikhFail) {
        const tarikh = parseTarikhPelupusan(nilai);

        if (tarikh) return tarikh;
    }

    return null;
}



// ==========================================
// 6. DAPATKAN SEMUA JILID UNTUK PELUPUSAN
// SUMBER: MASTERLIST (UMUM + PERIBADI)
// ==========================================

function binaSenaraiJilidUmumUntukPelupusan() {
    const masterlist =
        typeof dapatkanMasterlist === "function"
            ? dapatkanMasterlist()
            : [];

    return masterlist
        .filter(item =>
            String(item.statusJilid || "").trim().toLowerCase() === "tidak aktif"
        )
        .map(item => ({
            ...item,
            kategori:
                item.kategori ||
                (item.kategoriKod === "peribadi"
                    ? "Fail Peribadi"
                    : "Fail Umum")
        }));
}



// ==========================================
// 7. KIRA COUNTDOWN PELUPUSAN
// ==========================================

function kiraStatusPelupusan(jilid, auditSemua, hariIni = new Date()) {
    const tarikhAsas = dapatkanTarikhAsasJilid(jilid, jilid);

    const auditPadan = auditSemua
        .filter(item =>
            rekodAuditPadanJilid(item, jilid) &&
            auditLayakUntukPelupusan(item)
        )
        .map(item =>
            parseTarikhPelupusan(
                item.tarikhMasa ||
                item.tarikh ||
                item.created_at
            )
        )
        .filter(Boolean);

    const tarikhTerakhir = [
        tarikhAsas,
        ...auditPadan
    ]
        .filter(Boolean)
        .sort((a, b) => b - a)[0] || null;

    if (!tarikhTerakhir) {
        return {
            tarikhTerakhir: null,
            tarikhAmaran: null,
            tarikhLayak: null,
            status: "Perlu Tarikh Rekod",
            bakiHari: null
        };
    }

    // Tarikh genap lima tahun
    const tarikhLayak = tambahTempohPelupusan(
        tarikhTerakhir,
        TEMPOH_PELUPUSAN_TAHUN,
        0
    );

    // Amaran satu bulan lebih awal
    const tarikhAmaran = tambahTempohPelupusan(
        tarikhLayak,
        0,
        -AMARAN_PELUPUSAN_BULAN
    );

    const bakiHari = hariAntaraPelupusan(
        hariIni,
        tarikhLayak
    );

    let status = "Dalam Tempoh";

    if (hariIni >= tarikhLayak) {
        status = "Tempoh Dicapai";
    } else if (hariIni >= tarikhAmaran) {
        status = "Hampir Tempoh";
    }

    return {
        tarikhTerakhir,
        tarikhAmaran,
        tarikhLayak,
        status,
        bakiHari
    };
}



// ==========================================
// 8. PAPARKAN SENARAI PELUPUSAN
// ==========================================

function paparSenaraiPelupusan() {
    const halaman = document.getElementById("page-pelupusan");
    const tbody = document.getElementById("senaraiPelupusan");

    if (!halaman || !tbody) return;

    const audit = typeof dapatkanSenaraiAuditTrail === "function"
        ? dapatkanSenaraiAuditTrail()
        : [];

    const hariIni = new Date();

    const senarai = binaSenaraiJilidUmumUntukPelupusan().map(jilid => ({
        jilid,
        kiraan: kiraStatusPelupusan(jilid, audit, hariIni)
    }));

    // Susun rekod: hampir tempoh dan tempoh dicapai dahulu
    const susunan = [...senarai].sort((a, b) => {
        const keutamaan = {
            "Tempoh Dicapai": 1,
            "Hampir Tempoh": 2,
            "Dalam Tempoh": 3,
            "Perlu Tarikh Rekod": 4
        };

        const bezaStatus =
            (keutamaan[a.kiraan.status] || 5) -
            (keutamaan[b.kiraan.status] || 5);

        if (bezaStatus !== 0) return bezaStatus;

        const tarikhA = a.kiraan.tarikhLayak?.getTime() ?? Infinity;
        const tarikhB = b.kiraan.tarikhLayak?.getTime() ?? Infinity;

        return tarikhA - tarikhB;
    });

    // Pagination
    const jumlahRekod = susunan.length;
    const jumlahHalaman = Math.max(
        1,
        Math.ceil(jumlahRekod / rekodSetiapHalamanPelupusan)
    );

    halamanPelupusanSemasa = Math.min(
        Math.max(1, halamanPelupusanSemasa),
        jumlahHalaman
    );

    const mula = (halamanPelupusanSemasa - 1) *
        rekodSetiapHalamanPelupusan;

    const rekodPaparan = susunan.slice(
        mula,
        mula + rekodSetiapHalamanPelupusan
    );

    // Paparkan jadual
    tbody.innerHTML = rekodPaparan.length
        ? rekodPaparan.map(({ jilid, kiraan }) => {
            const tahun = kiraan.tarikhLayak
                ? kiraan.tarikhLayak.getFullYear()
                : "-";

            let label = "Dalam Tempoh";
            let kelas = "";
            let tindakan = "Pemantauan";

            if (kiraan.status === "Hampir Tempoh") {
                label = `Amaran awal · ${kiraan.bakiHari} hari lagi`;
                kelas = "pill--orange";
                tindakan = "Hampir layak";
            } else if (kiraan.status === "Tempoh Dicapai") {
                label = "Tempoh dicapai";
                kelas = "pill--orange";
                tindakan = "Untuk semakan";
            } else if (kiraan.status === "Perlu Tarikh Rekod") {
                label = "Tarikh rekod tiada";
                tindakan = "Semak tarikh";
            }

            const noFail = jilid.noFail || "-";
            const nomborJilid = jilid.jilid || 1;
            const kategori = jilid.kategori || "-";

            const tarikhAsas = kiraan.tarikhTerakhir
                ? `Tarikh asas: ${formatTarikhPelupusan(kiraan.tarikhTerakhir)}`
                : "Tarikh asas belum direkodkan";

            const tarikhLayak = kiraan.tarikhLayak
                ? `Layak: ${formatTarikhPelupusan(kiraan.tarikhLayak)}`
                : "";

            return `
                <tr>
                    <td>
                        <b>${escapeHTML(noFail)}</b><br>
                        <small>${escapeHTML(tarikhAsas)}</small>
                    </td>
                    <td>
                        Jilid ${escapeHTML(nomborJilid)}<br>
                        <small>${escapeHTML(kategori)}</small>
                    </td>
                    <td>${escapeHTML(tahun)}</td>
                    <td>
                        <span class="pill ${kelas}">
                            ${escapeHTML(label)}
                        </span><br>
                        <small>${escapeHTML(tarikhLayak)}</small>
                    </td>
                    <td>${escapeHTML(tindakan)}</td>
                </tr>
            `;
        }).join("")
        : `
            <tr>
                <td colspan="5" class="muted">
                    Tiada rekod jilid tidak aktif untuk dipantau.
                </td>
            </tr>
        `;

    // Jumlah keseluruhan rekod
    const jumlahEl = document.getElementById("jumlahRekodPelupusan");

    if (jumlahEl) {
        jumlahEl.textContent = `${jumlahRekod} rekod`;
    }

    // Jumlah rekod yang hampir atau telah mencapai tempoh
    const untukTindakan = susunan.filter(item =>
        item.kiraan.status === "Hampir Tempoh" ||
        item.kiraan.status === "Tempoh Dicapai"
    );

    const ringkasan = halaman.querySelector(
        ".release-progress__number"
    );

    if (ringkasan) {
        ringkasan.innerHTML = `
            ${untukTindakan.length}
            <span style="font-size:10px;color:var(--muted)">fail/jilid</span>
        `;
    }

    const caption = halaman.querySelector(
        ".release-progress__caption"
    );

    if (caption) {
        caption.textContent = "Fail/jilid hampir atau telah mencapai tempoh lima tahun";
    }

    // Maklumat halaman
    const info = document.getElementById("infoPaginationPelupusan");

    if (info) {
        const rekodMula = jumlahRekod === 0 ? 0 : mula + 1;
        const rekodAkhir = Math.min(
            mula + rekodSetiapHalamanPelupusan,
            jumlahRekod
        );

        info.textContent =
            `Memaparkan ${rekodMula}-${rekodAkhir} daripada ${jumlahRekod} rekod · Halaman ${halamanPelupusanSemasa}/${jumlahHalaman}`;
    }

    // Kawalan butang pagination
    const sebelum = document.getElementById("pelupusanSebelum");
    const seterusnya = document.getElementById("pelupusanSeterusnya");

    if (sebelum) sebelum.disabled = halamanPelupusanSemasa <= 1;
    if (seterusnya) seterusnya.disabled = halamanPelupusanSemasa >= jumlahHalaman;
}

// ==========================================
// 9. JALANKAN SELEPAS HALAMAN DIMUATKAN
// ==========================================

document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("pelupusanSebelum")?.addEventListener("click", function() {
        if (halamanPelupusanSemasa > 1) {
            halamanPelupusanSemasa--;
            paparSenaraiPelupusan();
        }
    });

    document.getElementById("pelupusanSeterusnya")?.addEventListener("click", function() {
        halamanPelupusanSemasa++;
        paparSenaraiPelupusan();
    });

    paparSenaraiPelupusan();
});
