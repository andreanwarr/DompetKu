# Arsitektur DompetKu

## Stack

- Laravel 13 sebagai backend, autentikasi, validasi, dan API Inertia.
- React 19 + TypeScript + Inertia untuk antarmuka.
- Tailwind CSS 4 + komponen shadcn/Radix untuk UI responsif dan aksesibel.
- PostgreSQL 17 untuk local parity dan production; SQLite tetap didukung untuk demo cepat.
- Redis untuk cache dan antrean production.
- PhpSpreadsheet untuk export `.xlsx`.

## Model saldo

Semua perpindahan uang disimpan sebagai jurnal double-entry. Total debit harus selalu sama dengan total kredit.

- **Saldo saat ini**: saldo awal seluruh sumber dana + debit − kredit sampai hari ini.
- **Saldo periode**: pemasukan − pengeluaran dalam filter dashboard.
- **Saldo keseluruhan**: sumber dana + tabungan + kasbon yang belum dibayar − sisa pinjaman.
- Pemberian kasbon: debit piutang, kredit sumber dana.
- Pembayaran kasbon: debit sumber dana, kredit piutang; bunga/denda masuk pendapatan.
- Penerimaan pinjaman: debit sumber dana, kredit utang.
- Pembayaran pinjaman: debit utang/biaya, kredit sumber dana.

Query selalu dibatasi `user_id`; route model binding tambahan diverifikasi terhadap pemilik resource.

## Topologi production

```text
Internet/TLS proxy
        |
     Nginx
        |
   PHP-FPM app ---- PostgreSQL
        |          Redis
        +---- queue worker
        +---- scheduler
```

`Dockerfile` menghasilkan target terpisah `app` dan `web`. Volume persisten hanya dipakai untuk data PostgreSQL, Redis, dan file aplikasi yang memang perlu bertahan.

## Responsif dan aksesibilitas

- Base style ditujukan untuk 320–639 px, lalu ditingkatkan pada breakpoint `sm`, `md`, dan `xl`.
- Sidebar menjadi sheet/off-canvas pada mobile.
- Form dan kartu menjadi satu kolom pada layar kecil.
- Input mobile memakai ukuran font 16 px untuk mencegah auto-zoom iOS.
- Kontrol utama memakai target sentuh minimal 44 px.
- Skip link, focus ring, label, ARIA untuk tab/icon, dan reduced-motion tersedia.

## Portabilitas deployment

Kode aplikasi tidak menyimpan state server secara lokal. Konfigurasi berasal dari environment, schema dikelola migration, dan proses web/worker/scheduler memakai image aplikasi yang sama. Karena itu perpindahan dari laptop ke VPS cukup mengganti environment/secrets, membangun image, menjalankan migration, lalu menyalakan service.
