# Hasil validasi — 1 Oktober 2026

Target: aplikasi mandiri Next.js 16.3.4, Node.js 24.19.0, SQLite lokal.

| Pemeriksaan | Hasil |
|---|---|
| TypeScript `tsc --noEmit` | Lulus |
| Production build `next build --webpack` | Lulus, seluruh route operasional tersedia |
| Core tests | 3/3 lulus |
| HTTP integration pada production server lokal | Lulus |
| Migrasi SQLite dan reopen file database | Lulus |
| Rollback batch gagal | Lulus, perubahan sebelumnya tidak tersimpan |
| Session signature/password dan token tampering | Lulus |
| Baseline seluruh koordinat + 19 WO/equipment | Lulus |
| Login/logout dan route dengan sesi | Lulus; logout redirect ke origin aplikasi |
| API tanpa sesi dan origin tidak sah | Ditolak |
| Master SAP unik, receive pack, issue eceran | Lulus |
| Shortage dan dua issue bersamaan | Lulus; saldo tidak negatif |
| Demo replacement pada 561/562/421/422 | Lulus; terpisah dari aktual |
| Validasi comp. maksimum per equipment | Lulus |

Pengujian HTTP menggunakan database sementara serta kredensial uji yang dibuat acak. Data uji tidak dimasukkan ke paket. Server pengujian dihentikan setelah test.

Belum diverifikasi: visual browser pada perangkat pengguna, deployment hosting mandiri, clean install pada mesin baru, migrasi data aktual Sites. Build menggunakan dependency yang sudah tersedia di workspace; percobaan install offline tidak selesai karena metadata package mirror tidak tersedia. Lockfile disertakan untuk instalasi pada lingkungan dengan akses registry yang sesuai.

Batas MVP: satu operator dari environment, satu instance server SQLite, kuantitas integer, tidak ada undo/reversal, login rate limit per proses. Detail produksi dan fase berikutnya ada pada PRD.
