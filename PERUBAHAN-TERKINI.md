# Nota perubahan e-FAIL 2.0 — versi semakan workflow

## Perubahan dibuat

1. **Storage diasingkan mengikut kategori**
   - `storage-umum.js`: Fail Umum dan Jilid Umum.
   - `storage-peribadi.js`: Fail Peribadi dan Jilid Peribadi.
   - `storage-pengguna.js`: Rekod pengguna.
   - `storage.js`: approval queue bersama, audit trail, Masterlist dan helper.
   - LocalStorage keys sedia ada dikekalkan.

2. **Pembukaan Fail melalui Pengesahan**
   - Pembukaan Fail Umum dan Peribadi dihantar ke `efailRequests`.
   - Rekod sebenar hanya dicipta dalam storage kategori selepas Pentadbir meluluskan permohonan.
   - Penolakan tidak mencipta rekod fail.

3. **Masterlist**
   - `dapatkanMasterlist()` menggabungkan rekod daripada storage Umum, Peribadi dan jilid untuk paparan.
   - Masterlist tidak disimpan sebagai salinan data kedua.
   - Modul Laporan, Pengurusan Jilid, Pinjaman dan Pemulangan menggunakan Masterlist.

4. **Pinjaman dan Pemulangan**
   - Kedua-dua kategori mempunyai ID borang yang unik.
   - Pinjaman hanya menukar status kepada `Dipinjam` selepas kelulusan Pentadbir.
   - Pemulangan hanya menukar status kepada `Tersedia` selepas kelulusan Pentadbir.
   - Permohonan pinjaman/pemulangan yang masih menunggu pengesahan tidak boleh dihantar berulang bagi jilid yang sama.

5. **Audit Trail**
   - Audit direkodkan apabila status berubah antara `Tersedia` dan `Dipinjam`.
   - Penolakan atau permohonan yang masih menunggu tidak mengubah status jilid.

6. **Sejarah Permohonan**
   - Permohonan baharu menyimpan identiti pemohon.
   - Sejarah dipaparkan mengikut pengguna semasa, bukan semua permohonan.

7. **ID HTML dan borang**
   - ID pendua bagi borang Pengemaskinian, Pinjaman dan Pemulangan Peribadi telah dijadikan unik.
   - Sasaran label dan atribut `form` disemak semula.

8. **CSS**
   - `css/main.css` tidak diubah.

## Semakan yang dijalankan

- Semua fail JavaScript lulus `node --check`.
- Tiada ID HTML pendua.
- Semua `label[for]` dan atribut `form` merujuk elemen yang wujud.
- Ujian smoke melalui JavaScript: kelulusan pembukaan fail, pembukaan jilid baharu, status jilid aktif/tidak aktif, kelulusan pinjaman, kelulusan pemulangan dan dua rekod Audit Trail.
- Ujian klik penuh dalam browser sebenar masih perlu dibuat.

## Perkara yang perlu diputuskan

- Borang Pembukaan Fail dalam ZIP asal tidak mempunyai medan `No. Fail`. Buat masa ini rekod yang diluluskan menyimpan nombor fail kosong jika pengguna tidak membekalkannya. Perlu diputuskan sama ada nombor fail dimasukkan oleh pemohon atau ditetapkan oleh Pentadbir selepas kelulusan.
- Borang Fail Umum mempunyai dua medan berlabel `Maklumat Pemohon`. Kedua-duanya dikekalkan kerana maksud medan kedua belum jelas.

## Had prototaip

Sistem masih menggunakan `localStorage` dan data demo. Ia belum menjadi backend Laravel/MySQL, belum menyokong storan berpusat berbilang pengguna, dan belum disambungkan kepada Government SSO.
