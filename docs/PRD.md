# PRD — Plant Area System

Versi: 1.0 · 1 Oktober 2026 · Pemilik produk: Maintenance Tuban
Target: aplikasi mandiri; implementasi awal Next.js + TypeScript + SQLite pada Node.js 24.
Baseline: fitur Plant Area System sampai revisi pilihan bag oranye dan Consumable Room aktif.

## 1. Tujuan produk

Menyediakan satu aplikasi maintenance untuk melihat umur bag filter per koordinat, mencatat penggantian beberapa bag dalam satu WO, menelusuri history, serta mengelola penerimaan dan pengeluaran consumable Workshop. Pengguna harus dapat melihat hasil transaksi segera setelah menyimpan dan membaca kembali data setelah reload.

### Hasil yang harus dicapai

- Empat equipment dapat diakses dari Dashboard → Equipment Process → Bag Filter.
- Setiap koordinat memiliki kondisi terkini dan seluruh history pemasangan/penggantian.
- Satu penggantian dapat memuat banyak koordinat, termasuk lintas kompartemen.
- Consumable Room menghitung saldo dari transaksi masuk/keluar, dengan pencatatan pekerjaan dan WO.
- Aplikasi dapat berjalan di luar Sites tanpa header identitas ChatGPT atau Cloudflare D1.

## 2. Ruang lingkup dan pengguna

MVP memiliki satu operator maintenance yang dikonfigurasi administrator melalui environment server. Seluruh tindakan tulis mencatat identitas operator dari sesi server. Login dan halaman operasional dilindungi; tidak ada registrasi publik.

Termasuk: Dashboard, Equipment Process, Bag Filter, Workshop, Consumable Room, autentikasi mandiri, penyimpanan lokal persisten, history dan pencarian.

Di luar MVP: integrasi SAP, approval transaksi, Drawing Database, Part Cost, Tools Tracking, Breakdown/Urgent WO, import data produksi Sites, transaksi koreksi/reversal, stok minimum/notifikasi, multi-user/RBAC, kuantitas pecahan, deployment hosting mandiri. Modul di luar MVP tetap berupa kartu rencana tanpa tautan aktif.

Source dan data simulasi disalin; database aktual pada Sites tidak diekspor otomatis. Aplikasi Sites tetap berjalan terpisah.

## 3. Konfigurasi equipment

| Equipment | Total comp. | Utara | Selatan | Bag per comp. | Total bag |
|---|---:|---:|---:|---:|---:|
| 561-BF1 | 24 | 12 | 12 | 136 | 3.264 |
| 562-BF1 | 24 | 12 | 12 | 136 | 3.264 |
| 421-BF1 | 30 | 15 | 15 | 136 | 4.080 |
| 422-BF2 | 30 | 15 | 15 | 136 | 4.080 |

Kode 422-BF2 mengikuti daftar equipment utama yang terakhir dikonfirmasi. Setiap comp. terdiri dari 8 kolom × 17 baris.

| Elemen | Ketentuan |
|---|---|
| Kolom tampilan | H, G, F, E, D, C, B, A dari kiri ke kanan |
| Kolom database | H=1 sampai A=8 |
| Comp. Utara | Tampilan 1–12 atau 1–15; nomor lokal sama |
| Comp. Selatan | Tampilan 24–13 atau 30–16 dari kiri ke kanan |
| Nomor lokal Selatan | `totalComp + 1 - nomorTampilan` |
| Baris Utara | 17–1 dari atas ke bawah |
| Baris Selatan | 1–17 dari atas ke bawah |

Kunci koordinat: equipment + sisi + comp. lokal + kolom + baris. Identitas koordinat stabil walaupun nomor tampilannya berbeda.

## 4. PRD Front End

### 4.1 Navigasi dan halaman

| Route | Halaman / tugas utama |
|---|---|
| `/login` | Login operator |
| `/` | Dashboard: Workshop dan Equipment Process |
| `/equipment-process` | Daftar modul equipment |
| `/equipment-process/bag-filter` | Empat kartu equipment aktif |
| `/equipment-process/bag-filter/561-bf1` | Monitoring 561-BF1 |
| `/equipment-process/bag-filter/562-bf1` | Monitoring 562-BF1 |
| `/equipment-process/bag-filter/421-bf1` | Monitoring 421-BF1 |
| `/equipment-process/bag-filter/422-bf2` | Monitoring 422-BF2 |
| `/workshop` | Daftar modul Workshop |
| `/workshop/consumable-room` | Stok dan transaksi consumable |

Gunakan breadcrumb pada halaman operasional dan tautan nyata untuk navigasi. Login berhasil menuju Dashboard. Logout menghapus sesi dan menuju login.

### 4.2 Tema visual

| Area | Warna / perilaku |
|---|---|
| Equipment Process | Hijau forest: struktur utama `#153d39`; latar netral terang |
| Label comp. | `Comp. 1`, `Comp. 2`, dst.; blok hijau tua, teks putih |
| Label baris / kolom | Hijau muda; garis grid halus; konsisten dengan tema |
| Bag dipilih | Oranye `#ed9b36`, border kontras; berlaku di overview dan detail |
| Workshop | Gunmetal `#30373c`, titanium abu terang, aksen coklat/copper `#865d37` / `#b88a5c` |

Warna oranye menunjukkan pilihan sementara, bukan umur bag. Batalkan pilihan dengan klik ulang untuk mengembalikan warna umur. Teks umur pada warna hijau gelap harus berwarna terang agar terbaca.

### 4.3 Bag Filter — overview

Tampilkan seluruh 24 atau 30 comp. dalam dua baris, masing-masing 12 atau 15 blok; tanpa scroll horizontal pada overview. Urutan mengikuti tabel konfigurasi. Klik judul comp. membuka detail; klik sel bag menambah/menghapus pilihan. Detail comp. menyediakan target klik yang lebih besar pada layar kecil.

Tampilkan ringkasan equipment, skala tetap 0–900 hari, dan jumlah posisi yang memiliki data. Sel yang belum memiliki data berwarna abu-abu. Warna umur bergradasi hijau terang → hijau sangat gelap dan tetap gelap setelah 900 hari. Tidak ada input skala warna pada display.

### 4.4 Perhitungan umur

```
umurJam = max(0, floor((waktuSekarang - installedAt) / 3.600.000))
umurHari = floor(umurJam / 24)
fraksiWarna = clamp(umurJam / 21.600, 0, 1)
```

Bag dianggap running terus 24/7 sejak pemasangan. Tidak perlu input jam operasi harian atau stoplog. Display diperbarui setiap 60 detik. Catatan legacy yang hanya memiliki pembacaan hour meter ditampilkan dengan tanggal estimasi dan diberi keterangan.

Tanggal disimpan sebagai ISO UTC; tampilan history menggunakan zona Asia/Jakarta. Input datetime-local mengikuti waktu lokal browser dan dikonversi ke ISO UTC saat dikirim.

### 4.5 Form penggantian multi-bag

1. Pilih satu atau lebih koordinat pada overview/detail, boleh lintas comp.
2. Daftar pilihan menampilkan nomor comp. tampilan dan koordinat huruf/baris.
3. Pengguna dapat menghapus satu pilihan atau membersihkan semua.
4. Isi tanggal/jam pemasangan, alasan wajib, dan WO opsional.
5. Klik Simpan; satu tanggal/alasan/WO berlaku untuk seluruh pilihan.
6. Setelah berhasil, muat ulang data, bersihkan pilihan, tampilkan konfirmasi, dan perbarui umur/history.

Maksimal 500 posisi per penyimpanan. Jangan hanya menyimpan status terbaru; setiap pemasangan adalah record baru agar history tetap utuh.

### 4.6 History WO dan koordinat

Pencarian WO: nomor WO, alasan, tanggal, dan koordinat (misalnya `18 B1`). Record dikelompokkan berdasarkan WO dan waktu pencatatan batch. Tampilkan jumlah bag, tanggal pemasangan, alasan, serta tombol koordinat untuk membuka timeline.

Timeline koordinat: pemasangan awal dan seluruh penggantian, WO, alasan, pencatat, waktu pencatatan, umur bag yang terpasang sekarang, serta masa pakai tiap bag sebelumnya sampai penggantian berikutnya. Urutan ditentukan tanggal pemasangan, dengan ID sebagai tie-breaker.

### 4.7 Demo

Demo menyediakan baseline lengkap untuk semua koordinat dan 19 cluster WO per equipment. Beberapa koordinat pernah diganti lebih dari satu kali. Generator deterministik menggunakan acuan 1 Oktober 2026 sehingga history tidak berubah saat reload.

Penggantian demo benar-benar dapat disimpan dan digabungkan dengan baseline simulasi. Data tulis demo dipisahkan dari aktual melalui dataset. Kontrol dan keterangan Mode Demo berada di footer paling bawah. Halaman pertama tidak menampilkan banner demo besar; disclosure di footer tetap tersedia.

### 4.8 Consumable Room

Halaman dibuka dari Workshop. Area penyimpanan: Workshop, Finishmill, Utilities, atau Semua area untuk membaca stok/history.

**Master material:** kode SAP unik, nama, satuan eceran, isi per pack berupa integer positif, dan area. Material baru memiliki saldo nol. Untuk menambah saldo awal, catat penerimaan pertama.

**Saldo stok:** daftar dapat dicari melalui nama/SAP/satuan. Tampilkan nama, SAP, area, isi per pack, jumlah tersedia dan satuan. Ringkasan menghitung jumlah jenis material, jenis dengan stok >0, dan jenis dengan stok nol; jangan menjumlahkan kuantitas dengan satuan berbeda.

**Penerimaan:** pilih material, jumlah pack integer positif, referensi penerimaan wajib. Pratinjau menampilkan jumlah eceran yang masuk dan saldo setelah transaksi.

**Pengeluaran:** pilih material, jumlah eceran integer positif, pekerjaan/equipment wajib, WO dan referensi opsional. Pratinjau saldo; tombol simpan nonaktif jika saldo akan negatif.

**History:** tanggal/pencatat, material/SAP/area, jenis transaksi, kuantitas bertanda +/−, pack jika penerimaan, referensi, WO dan pekerjaan. Cari lewat material/SAP/WO/pekerjaan/referensi/pencatat/tanggal; filter jenis dan area. Tampilkan 20 record awal lalu tombol tambahan.

### 4.9 State antarmuka

Tersedia state loading, kosong, hasil pencarian kosong, error dengan retry, sukses tersimpan, dan busy saat submit. Button submit dinonaktifkan selama penyimpanan. Gunakan label form, fokus keyboard, aria-pressed untuk pilihan, role alert/status, dan kontras teks yang memadai.

## 5. PRD Back End

### 5.1 Arsitektur MVP

- Next.js App Router dan Route Handlers, runtime Node.js.
- React + TypeScript; CSS/Tailwind untuk UI.
- SQLite file persisten dengan Node `node:sqlite`, WAL, foreign keys, busy timeout.
- Migration SQL dijalankan berurutan sekali berdasarkan tabel `schema_migrations`.
- Adapter database berada di `lib/database.ts`; jangan memasukkan SQL ke client component.
- Sesi signed cookie HttpOnly, SameSite=Lax, masa berlaku 8 jam.
- Username/password/secret dan lokasi database berasal dari environment, bukan source client.

SQLite cocok untuk satu server dan volume awal. Deployment multi-instance/shared database memerlukan migrasi adapter ke PostgreSQL/MySQL dan pengujian concurrency ulang; belum termasuk rilis ini. File SQLite harus berada pada persistent disk, bukan filesystem ephemeral.

### 5.2 Model data

| Tabel | Field inti / batasan |
|---|---|
| `materials` | id PK, sap_code UNIQUE, name, unit, pack_size, area, created_at |
| `stock_moves` | id PK, material_id FK, type, quantity signed, packs nullable, reference, wo nullable, job nullable, area, actor, created_at |
| `equipment` | code PK, runhours legacy, updated_at, updated_by |
| `bag_changes` | id PK, equipment_code, side, compartment lokal, column, row, installed_at_hours legacy, installed_at nullable, dataset actual/demo, reason, wo nullable, actor, created_at |
| `schema_migrations` | name PK, applied_at |

Index: koordinat `bag_changes(equipment_code,side,compartment,column,row)` dan `stock_moves(material_id)`.

Saldo dihitung dari `SUM(stock_moves.quantity)` per material. Penerimaan positif, pengeluaran negatif. Riwayat bersifat append-only pada MVP; tidak tersedia edit/hapus dari UI.

### 5.3 Kontrak API

Kontrak `/api/data` dipertahankan untuk mengurangi perubahan front end saat porting. Refactor ke endpoint REST terpisah dapat dilakukan pada fase berikutnya.

| Method / endpoint | Input | Output / perilaku |
|---|---|---|
| POST `/api/auth/login` | username, password | Cookie sesi; `{ok:true}` |
| POST `/api/auth/logout` | — | Hapus cookie; redirect login |
| GET `/api/data?equipment=561-BF1` | equipment yang valid | materials, moves, equipment, bags aktual, demoBags tersimpan |
| GET `/api/data?scope=consumables` | — | materials beserta saldo, seluruh history moves |
| POST `/api/data`, action=`material` | sapCode, name, unit, packSize, area | Buat material saldo nol |
| POST `/api/data`, action=`receive` | materialId, packs, reference, area | Tambah stok dari konversi pack |
| POST `/api/data`, action=`issue` | materialId, quantity, job, area, wo?, reference? | Kurangi stok secara atomic |
| POST `/api/data`, action=`bags` | equipmentCode, dataset, positions[], installedAt, reason, wo? | Simpan seluruh koordinat dalam satu transaksi |

`positions[]`: `{side:"Utara"|"Selatan",compartment:1..perSide,column:1..8,row:1..17}`.

Action `bag` (satu posisi) dan `hours` (legacy 561-BF1) tetap diterima untuk kompatibilitas; UI baru tidak menggunakan input hour meter.

Contoh penggantian:

```json
{
  "action": "bags", "equipmentCode": "421-BF1", "dataset": "demo",
  "positions": [
    {"side":"Utara","compartment":15,"column":1,"row":17},
    {"side":"Selatan","compartment":1,"column":8,"row":1}
  ],
  "installedAt": "2026-10-01T07:00:00.000Z",
  "reason": "Bag bocor", "wo": "WO-421-001"
}
```

Contoh penerimaan: `{"action":"receive","materialId":1,"packs":2,"reference":"GR-001","area":"Workshop"}`.
Contoh pengeluaran: `{"action":"issue","materialId":1,"quantity":30,"job":"Welding 561-RM1","wo":"WO-001","area":"Workshop"}`.

Status: 200 sukses; 400 input invalid; 401 sesi invalid; 403 origin invalid; 409 SAP duplikat atau stok tidak cukup; 429 batas percobaan login; 503 konfigurasi/koneksi/persistence error.

### 5.4 Validasi dan transaksi

| Operasi | Validasi server |
|---|---|
| Material | SAP/nama/satuan wajib; area whitelist; packSize integer 1–1.000.000 |
| Penerimaan | Material ada; area sama dengan master; packs integer 1–100.000; referensi wajib |
| Pengeluaran | Material ada; area sama; quantity integer 1–1.000.000; job wajib; saldo cukup |
| Penggantian bag | Equipment whitelist; dataset actual/demo; 1–500 koordinat unik; dimensi sesuai equipment; reason 1–500 karakter; WO ≤100 karakter |
| Tanggal bag | Valid; sejak 1 Jan 2000; tidak lebih dari 60 detik ke depan |
| Auth | Password environment ≥12 karakter; signing secret ≥32 karakter; cookie tidak dapat dibaca JS |

Seluruh posisi satu penggantian disimpan dalam transaksi database: semuanya berhasil atau rollback. Waktu pencatatan batch dan actor sama.

Pengeluaran menggunakan satu conditional INSERT dengan pengecekan saldo di database. Jangan melakukan read saldo → insert terpisah; dua pengeluaran bersamaan tidak boleh menghasilkan saldo negatif. Kegagalan shortage tidak boleh menambah history.

Server menentukan actor dari sesi, tidak mempercayai actor kiriman client. Mutation dari origin berbeda ditolak. Login memiliki pembatasan 10 percobaan gagal per proses dalam 15 menit; production multi-instance membutuhkan rate limiter bersama pada fase berikutnya.

## 6. Kriteria penerimaan

| ID | Skenario | Hasil yang harus terlihat |
|---|---|---|
| A01 | Akses halaman operasional tanpa sesi | Dialihkan ke login; API mengembalikan 401 |
| A02 | Login valid / invalid | Sesi terbentuk / akses ditolak |
| B01 | Buka keempat equipment dari menu | Route benar dan jumlah comp./bag sesuai konfigurasi |
| B02 | Overview 24 dan 30 comp. di desktop | Seluruh comp. terlihat tanpa scroll horizontal |
| B03 | Klik satu bag, klik ulang | Oranye saat dipilih; warna umur kembali saat dibatalkan |
| B04 | Pilih bag lintas comp., simpan satu WO | Semua bag tersimpan dalam batch; pilihan dibersihkan |
| B05 | Comp. lokal 15 di 421/422 dan 13 di 561/562 | Valid untuk 421/422; ditolak untuk 561/562 |
| B06 | Umur 0, 450, 900, >900 hari | Gradasi hijau konsisten; >900 tetap gelap |
| B07 | Simpan demo lalu reload / pindah aktual | Demo tetap ada; aktual tidak bertambah |
| B08 | Cari WO dan koordinat | Record sesuai dan tombol membuka timeline yang benar |
| B09 | Koordinat dengan beberapa penggantian | Seluruh history dan masa pakai terlihat |
| B10 | Presentasi halaman Bag Filter | Banner demo tidak berada di atas; kontrol tersedia di footer |
| C01 | Tambah master SAP baru / duplikat | Master saldo nol / error duplikat |
| C02 | Isi pack 50, terima 2 pack | Stok bertambah 100 satuan; history mencatat 2 pack |
| C03 | Keluarkan 30 dari stok 100 | Saldo 70; history −30 dengan pekerjaan/WO |
| C04 | Keluarkan 71 dari stok 70 | Ditolak; saldo dan history tidak berubah |
| C05 | Dua pengeluaran 50 bersamaan dari stok 70 | Satu sukses, satu ditolak; saldo akhir 20 |
| C06 | Transaksi area berbeda dari master | Ditolak server |
| C07 | Cari/filter history dan reload | Hasil sesuai; data tetap tersimpan |
| V01 | Workshop dibanding Equipment Process | Gunmetal/copper dibanding forest green |
| V02 | Tombol, form, dan pencarian pada layar kecil | Dapat digunakan; table history memiliki scroll sendiri |

## 7. Delivery dan pengembangan Codex

Paket berisi source, migration SQL, PRD ini, instruksi Codex, README, `.env.example`, serta pengujian database dan smoke test HTTP. Tidak menyertakan secret, database operasional, node_modules, atau hasil build.

Urutan verifikasi: install dependency → environment lokal → typecheck → test database → build → start → smoke test login dan input/output API → review UI.

Status awal: fitur baseline dan port runtime mandiri tersedia. Production hosting, database terpusat, provisioning multi-user, restore/import data Sites, dan review UI pada browser target harus diselesaikan jika aplikasi akan dipakai sebagai sistem produksi.
