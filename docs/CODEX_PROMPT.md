# Instruksi untuk Codex — Plant Area System

Buka repository ini sebagai workspace Codex. Baca `docs/PRD.md`, `README.md`, dan `docs/VALIDATION.md` terlebih dahulu. Gunakan aplikasi yang sudah ada sebagai baseline dan lanjutkan implementasinya; jangan mengganti fitur dengan mockup.

Target: aplikasi mandiri Next.js/TypeScript + SQLite pada Node.js 24. Tidak menggunakan Cloudflare D1, Sites proxy, atau identitas dari header ChatGPT. Jangan menambahkan integrasi/fitur di luar PRD tanpa instruksi pengguna.

Prioritas:
1. Pertahankan routing Dashboard → Equipment Process → empat Bag Filter dan Workshop → Consumable Room.
2. Pertahankan geometri: 561/562 =24 comp.; 421/422=30 comp.; 136 bag/comp. Kode final equipment keempat adalah 422-BF2.
3. Gunakan umur kalender 24/7 sejak installed_at, skala 0–900 hari; hijau terang ke hijau sangat gelap, pilihan sementara oranye.
4. Pastikan multi-selection, batch transaction, pencarian WO, history koordinat, dan dataset demo/aktual tetap berfungsi.
5. Kontrol Mode Demo berada di footer, bukan banner atas.
6. Consumable Room: master SAP unik, penerimaan pack, pengeluaran eceran, pekerjaan/WO, saldo atomic, dan history search.
7. Pertahankan tema Equipment forest green dan Workshop gunmetal/titanium/copper.
8. Semua halaman dan API operasional memerlukan sesi; actor berasal dari server. Jangan menaruh password/secret pada client atau Git.

Jalankan:
```
npm ci
npm run typecheck
npm test
npm run build
npm run test:integration
# Untuk memakai aplikasi setelah seluruh check lulus:
npm start
```

Smoke test menggunakan database uji terpisah; set APP_DATABASE_PATH ke file sementara sebelum menjalankan server untuk test. Jangan menjalankan smoke test pada database produksi karena menambah material, bag replacement, dan stock moves.

Jika sebuah check gagal, perbaiki penyebabnya, ulangi check terkait, dan catat hasil aktual di `docs/VALIDATION.md`. Jangan melaporkan UI browser test atau deployment berhasil apabila belum dilakukan.

Untuk penggunaan produksi, tentukan hosting dan persistent disk/database bersama terlebih dahulu. Jangan menjalankan beberapa instance dengan file SQLite berbeda karena saldo/history akan terpecah. Migrasi ke PostgreSQL/MySQL merupakan pekerjaan terpisah dengan acceptance criteria C01–C07 tetap wajib.
