# e-FAIL 2.0 — Panduan Susunan Kod

## Prinsip penyusunan
- `css/main.css` dikekalkan; tiada perubahan CSS dibuat dalam kemas kini ini.
- `index.html` kekal sebagai halaman utama.
- JavaScript diasingkan mengikut tanggungjawab dan kategori data.
- Nama localStorage sedia ada dikekalkan supaya data demo lama boleh terus digunakan.
- Permohonan kekal dalam satu approval queue bersama: `efailRequests`.
- Rekod fail hanya diwujudkan/dikemaskini selepas Pentadbir meluluskan permohonan.

## Fail JavaScript aktif

| Fail | Tanggungjawab |
|---|---|
| `permissions.js` | Kawalan paparan mengikut peranan demo |
| `storage.js` | Storage bersama, approval queue, audit trail, Masterlist, helper, pagination dan pemprosesan transaksi bersama |
| `storage-umum.js` | Rekod Fail Umum dan Jilid Umum (`efailFailUmum`, `efailJilidUmum`) |
| `storage-peribadi.js` | Rekod Fail Peribadi dan Jilid Peribadi (`efailFailPeribadi`, `efailJilidPeribadi`) |
| `storage-pengguna.js` | Rekod pengguna (`efailUsers`) |
| `permohonan-jilid.js` | Jadual/carian jilid dan dua popup berasingan yang berkongsi fungsi JavaScript |
| `pendaftaran.js` | Hantar permohonan Pembukaan Fail Umum/Peribadi ke approval queue |
| `pengesahan.js` | Paparan, kelulusan dan penolakan; memproses rekod sebenar selepas kelulusan |
| `permohonan-pengemaskinian.js` | Hantar permohonan pengemaskinian/naik taraf |
| `permohonan-pinjaman.js` | Pilihan jilid daripada Masterlist dan permohonan pinjaman |
| `pergerakan.js` | Permohonan pemulangan, perubahan status pinjaman selepas kelulusan dan audit status |
| `sejarah-permohonan.js` | Paparan permohonan milik pengguna semasa sahaja |
| `laporan.js` | Laporan berdasarkan Masterlist sahaja |
| `pengguna.js` | Paparan dan pengurusan rekod pengguna |
| `dashboard.js`, `sidebar.js`, `main.js`, `settings.js`, `notifikasi.js`, `pelupusan.js` | Fungsi modul masing-masing |

## Aliran transaksi
1. Pengguna menghantar permohonan ke `efailRequests`.
2. Pentadbir menyemak permohonan melalui `pengesahan.js`.
3. Jika ditolak, rekod permohonan dan sebab penolakan disimpan; rekod fail/jilid tidak diubah.
4. Jika diluluskan, fungsi pemprosesan transaksi mengemas kini storage kategori yang betul.
5. Pinjaman dan pemulangan hanya menukar `statusPinjaman` selepas kelulusan. Perubahan `Tersedia`/`Dipinjam` direkodkan dalam `efailAuditTrail`.

## Masterlist
`dapatkanMasterlist()` menggabungkan data Fail Umum, Fail Peribadi dan jilid masing-masing untuk paparan/penggunaan modul. Ia tidak menyimpan salinan kedua. Modul Laporan, Pinjaman, Pemulangan dan Pengurusan Jilid membaca Masterlist.

## LocalStorage keys dikekalkan
- `efailFailUmum`
- `efailFailPeribadi`
- `efailJilidUmum`
- `efailJilidPeribadi`
- `efailUsers`
- `efailRequests`
- `efailAuditTrail`

## Nota prototaip
Semua ini masih menggunakan `localStorage` dan data demo. Ia belum menjadi backend Laravel/MySQL, dan kawalan peranan di frontend bukan kawalan keselamatan sebenar. Integrasi SSO dan kawalan akses backend perlu dibuat kemudian.

## Perkara yang perlu disahkan
Borang Pembukaan Fail dalam versi ZIP ini belum mempunyai medan `No. Fail`. Oleh itu, rekod yang diwujudkan selepas kelulusan akan menyimpan `noFail` kosong sehingga proses penetapan nombor fail dipersetujui. Jangan anggap ID rekod dalaman sebagai nombor fail rasmi.
