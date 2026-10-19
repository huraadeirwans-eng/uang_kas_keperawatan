# Buku Kas Profesional - Struktural Nursing

Aplikasi pembukuan dan manajemen buku kas profesional yang dirancang untuk pengelolaan keuangan organisasi, kas unit keperawatan, pencatatan iuran peserta, pengeluaran kas, kuitansi digital, serta galeri bukti nota kuitansi.

## ✨ Fitur Utama

- **Dashboard Finansial Terpadu**: Ringkasan saldo kas, total pendapatan, total pengeluaran, dan visualisasi status kas.
- **Pencatatan Pendapatan (Kas Masuk)**:
  - Format kode otomatis (`IN-XXXX-XXX`)
  - Filter periode (Bulan) & Tahun
  - Cetak kuitansi tanda terima digital siap print / PDF
- **Pencatatan Pengeluaran (Kas Keluar)**:
  - Input nota kuitansi (upload & kompresi foto nota otomatis)
  - Cetak Bukti Kas Keluar resmi (BKK)
- **Daftar Peserta & Manajemen Jabatan**:
  - Pilihan Jabatan lengkap: *Staff Pelaksana*, *Team Leader*, *Departemen Unit Head*, *Nursing Preceptor*, *IPCN*, *Komite Mutu RS*, *Komite Keperawatan*, *MPP*
  - Pencatatan Unit Kerja keperawatan (Emergency Unit, ICU, NICU, PICU, Inpatient Unit, dsb.)
  - Ekspor data peserta ke CSV / Excel
- **Galeri Bukti Pengeluaran**:
  - Peninjauan seluruh foto bukti transfer/nota dengan zoom dan unduh
- **Kustomisasi & Pengaturan**:
  - Nama organisasi, penanggung jawab, bendahara
  - Pengaturan logo organisasi landscape
- **Cetak Laporan Kas Resmi**:
  - Rekapitulasi kas siap cetak (A4 landscape/portrait)

---

## 🚀 Menjalankan di Komputer Lokal

1. **Clone repository ini**:
   ```bash
   git clone https://github.com/USERNAME/REPO_NAME.git
   cd REPO_NAME
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Jalankan development server**:
   ```bash
   npm run dev
   ```
   Aplikasi akan aktif di `http://localhost:3000`.

4. **Build untuk produksi**:
   ```bash
   npm run build
   ```

---

## 🌐 Panduan Upload ke GitHub & Deploy ke Vercel

### Langkah 1: Upload ke GitHub

1. Buka [GitHub](https://github.com/) dan buat repository baru (misalnya bernama `buku-kas-nursing`). Biarkan repositori kosong (jangan centang *Initialize with README*).
2. Di folder project lokal Anda, jalankan perintah Git berikut di terminal:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Aplikasi Buku Kas Profesional"
   git branch -M main
   git remote add origin https://github.com/USERNAME/buku-kas-nursing.git
   git push -u origin main
   ```
   *(Ganti `USERNAME` dan `buku-kas-nursing` sesuai akun GitHub Anda)*

### Langkah 2: Deploy ke Vercel

1. Buka [Vercel](https://vercel.com/) dan login menggunakan akun **GitHub** Anda.
2. Klik tombol **"Add New..."** lalu pilih **"Project"**.
3. Cari repository `buku-kas-nursing` yang baru saja Anda push, lalu klik **"Import"**.
4. Vercel akan otomatis mengenali project ini sebagai **Vite**:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. File `vercel.json` sudah disediakan di project ini untuk memastikan semua route SPA berfungsi optimal tanpa error 404 saat di-refresh.
6. Klik tombol **"Deploy"**.
7. Dalam kurun waktu 1–2 menit, website Anda sudah aktif secara publik dengan domain gratis (contoh: `https://buku-kas-nursing.vercel.app`).
8. Setiap kali Anda melakukan perubahan dan `git push` ke GitHub, Vercel akan otomatis memperbarui website publik Anda secara instan!
