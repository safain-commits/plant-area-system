# Plant Area System — aplikasi mandiri

Monitoring empat Bag Filter dan transaksi Consumable Room. Implementasi Front End/Back End sudah diport dari prototipe Sites; spesifikasi lengkap ada di [PRD](docs/PRD.md).

## Persyaratan

Node.js 24+, npm 11+. SQLite menggunakan modul bawaan Node; tidak perlu memasang server database.

## Jalankan lokal

1. `npm ci`.
2. Salin `.env.example` menjadi `.env.local`.
3. Isi `APP_USERNAME`, `APP_PASSWORD` minimal 12 karakter, dan `APP_SESSION_SECRET` acak minimal 32 karakter. Untuk localhost HTTP, gunakan `APP_COOKIE_SECURE=false`.
4. `npm run dev` lalu buka `http://127.0.0.1:3000/login`.
5. Masuk dengan akun environment; pilih modul melalui Dashboard.

Database dibuat otomatis di `data/plant-area.sqlite`, termasuk migration. Material baru memiliki stok nol; tambah stok melalui penerimaan. Bag Filter membuka simulasi lengkap secara default; kontrol dataset ada di footer.

## Pemeriksaan

`npm run typecheck`, `npm test`, `npm run build`, dan `npm run test:integration`. Test integrasi memulai server lokal dengan database sementara, menguji HTTP, lalu menghentikan server dan menghapus data uji.

Smoke test menambah data: gunakan database test terpisah dan masukkan kredensial melalui environment shell sebelum `npm run test:smoke`. `scripts/smoke.mjs` membaca APP_USERNAME/APP_PASSWORD dari environment shell, bukan `.env.local` secara otomatis.

## Deployment mandiri

Jalankan `npm run build` lalu `npm start` pada satu server Node di belakang reverse proxy HTTPS. Server default mengikat 127.0.0.1; expose melalui reverse proxy, bukan mengubahnya menjadi endpoint publik tanpa HTTPS. Set `APP_COOKIE_SECURE=true`, `APP_ORIGIN` sesuai domain HTTPS, secret/password yang kuat, serta `APP_DATABASE_PATH` ke persistent disk. Folder `migrations/` harus ikut tersedia saat runtime. Backup database SQLite konsisten melalui fasilitas backup SQLite saat server berjalan atau salin file database setelah server dihentikan.

Aplikasi ini belum dipublikasikan pada hosting mandiri. Tidak menyalin data aktual prototipe Sites; hanya source dan baseline demo.

## Codex

Buka folder ini di Codex dan gunakan [CODEX_PROMPT](docs/CODEX_PROMPT.md). Hasil pemeriksaan sesi awal ada pada [VALIDATION](docs/VALIDATION.md).
