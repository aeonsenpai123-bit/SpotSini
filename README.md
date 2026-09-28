# Spot SiNi — Direktori & Peta Usaha Mikro Kelurahan Penggilingan

**Spot SiNi** adalah platform web direktori geospasial interaktif untuk warga dan pelaku usaha mikro di **Kelurahan Penggilingan (Kecamatan Cakung, Kota Administrasi Jakarta Timur)**, mencakup wilayah **RW 01 hingga RW 07**.

---

## 🚀 Fitur Utama

1. **Direktori Interaktif Usaha Mikro**:
   - Filter sektor usaha (Kuliner, Konveksi, Sembako, Jasa).
   - Filter wilayah kewilayahan (RW 01 s/d RW 07).
   - Pencarian cerdas berbasis nama usaha, produk, dan pemilik.
2. **Pemetaan Geospasial Interaktif**:
   - Peta skematik wilayah RW 01–07 berbasis koordinat geospasial.
   - Sakelar tampilan langsung ke Google Maps Embed / Satelit.
   - Penanda interaktif per sektor dengan rincian instan saat diklik.
3. **Detail Profil & Navigasi**:
   - ID Registrasi Kelurahan resmi (contoh: `REG-PGL-01-001`).
   - Lencana status terverifikasi kelurahan.
   - Tombol langsung percakapan WhatsApp pengelola usaha.
   - Modal panduan rute Google Maps dan salin koordinat GPS.
4. **Pendaftaran Mandiri Usaha Baru**:
   - Pengisian formulir partisipatif pelaku usaha.
   - Tombol deteksi koordinat GPS otomatis via Browser Geolocation API.
   - Validasi data wajib dan animasi perayaan (*confetti*).
5. **Statistik Kewilayahan & Kependudukan**:
   - Grafik sebaran usaha per RW (RW 01–RW 07).
   - Data demografi Kelurahan Penggilingan (populasi, jumlah KK, luas km²).
6. **Rekap & Laporan Resmi Kelurahan**:
   - Pratinjau tabel rekapitulasi data usaha mikro.
   - Ekspor berkas spreadsheet Excel (`.xlsx`) via pustaka SheetJS.
   - Cetak dokumen resmi dengan format **Kop Surat Resmi Kelurahan Penggilingan**, nomor surat kelurahan, dan kolom tanda tangan Lurah.

---

## 🛠️ Teknologi yang Digunakan

- **Framework**: React 18 dengan TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Ikon UI**: Lucide React
- **Spreadsheet**: SheetJS (`xlsx`)
- **Visual Effects**: Canvas Confetti
- **Penyimpanan**: Browser `localStorage`

---

## 📦 Cara Menjalankan Aplikasi

1. Buka terminal di direktori proyek ini:
   ```bash
   cd "C:\Users\HYPE AMD\.gemini\antigravity\scratch\spotsini"
   ```

2. Pasang dependensi:
   ```bash
   npm install
   ```

3. Jalankan server pengembangan lokal:
   ```bash
   npm run dev
   ```
   Aplikasi akan berjalan di `http://localhost:3000`.

4. Membangun untuk produksi:
   ```bash
   npm run build
   ```
