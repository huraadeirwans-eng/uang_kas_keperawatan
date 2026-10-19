import React, { useState, useEffect } from 'react';
import { X, Printer, LogOut, Upload, Trash2, Edit3, Camera } from 'lucide-react';
import { Expense } from '../../types';
import { useKas } from '../../context/KasContext';
import {
  angkaKeTerbilang,
  formatRupiah,
  formatTanggalSingkat,
} from '../../utils/formatters';

interface BuktiKasKeluarModalProps {
  expense: Expense | null;
  onClose: () => void;
}

export const BuktiKasKeluarModal: React.FC<BuktiKasKeluarModalProps> = ({
  expense,
  onClose,
}) => {
  const { settings, updateSettings } = useKas();

  // Institution header (synced with settings, fully editable free-text)
  const [headerOrgName, setHeaderOrgName] = useState(
    settings.orgName && settings.orgName !== 'KAS UTAMA'
      ? settings.orgName
      : 'STRUKTURAL NURSING'
  );
  const [headerSubTitle, setHeaderSubTitle] = useState(
    settings.subTitle && settings.subTitle !== 'Sistem Pembukuan & Keuangan'
      ? settings.subTitle
      : 'Unit Pelayanan Keperawatan • Tanda Bukti Pengeluaran Kas'
  );

  useEffect(() => {
    if (settings.orgName && settings.orgName !== 'KAS UTAMA') {
      setHeaderOrgName(settings.orgName);
    }
    if (settings.subTitle && settings.subTitle !== 'Sistem Pembukuan & Keuangan') {
      setHeaderSubTitle(settings.subTitle);
    }
  }, [settings.orgName, settings.subTitle]);

  // Free text editable fields matching user's exact specification
  const [telahTerimaDari, setTelahTerimaDari] = useState('');
  const [uangSejumlah, setUangSejumlah] = useState('');
  const [untukPembayaran, setUntukPembayaran] = useState('');
  const [lokasiTanggal, setLokasiTanggal] = useState('');

  // 3 Signatories (Free text Title Label, Name & Position)
  const [disetujuiLabel, setDisetujuiLabel] = useState('Disetujui Oleh');
  const [disetujuiNama, setDisetujuiNama] = useState('');
  const [disetujuiJabatan, setDisetujuiJabatan] = useState('');
  const [disetujuiTtd, setDisetujuiTtd] = useState<string>('');

  const [penyerahLabel, setPenyerahLabel] = useState('Yang Menyerahkan');
  const [penyerahNama, setPenyerahNama] = useState('');
  const [penyerahJabatan, setPenyerahJabatan] = useState('');
  const [penyerahTtd, setPenyerahTtd] = useState<string>('');

  const [penerimaLabel, setPenerimaLabel] = useState('Yang Menerima Uang');
  const [penerimaNama, setPenerimaNama] = useState('');
  const [penerimaJabatan, setPenerimaJabatan] = useState('');
  const [penerimaTtd, setPenerimaTtd] = useState<string>('');

  // Initialize or update fields whenever the selected expense changes
  useEffect(() => {
    if (!expense) return;

    setTelahTerimaDari(settings.orgName || 'STRUKTURAL NURSING');
    setUangSejumlah(`${angkaKeTerbilang(expense.amount)} Rupiah`);
    setUntukPembayaran(expense.description || expense.category || 'Pembayaran Operasional');

    // Format date as Palembang, Tanggal / Nama Bulan / Tahun (misal: Palembang, 03 Oktober 2026)
    const bulanIndo = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    try {
      const parts = expense.date.split('-');
      if (parts.length === 3) {
        const dayStr = parts[2].padStart(2, '0');
        const monthIndex = parseInt(parts[1], 10) - 1;
        const monthName = bulanIndo[monthIndex] || parts[1];
        const yearStr = parts[0];
        setLokasiTanggal(`Palembang, ${dayStr} ${monthName} ${yearStr}`);
      } else {
        setLokasiTanggal(`Palembang, ${expense.date}`);
      }
    } catch (e) {
      setLokasiTanggal(`Palembang, ${expense.date}`);
    }

    setDisetujuiNama(settings.leaderName || 'Departemen Unit Head');
    setDisetujuiJabatan(settings.leaderTitle || 'Dept Unit Head');
    setDisetujuiTtd('');

    setPenyerahNama(settings.treasurerName || 'Bendahara Kas');
    setPenyerahJabatan(settings.treasurerTitle || 'Bendahara Kas');
    setPenyerahTtd('');

    setPenerimaNama(expense.recipient || 'Penerima Dana');
    setPenerimaJabatan('Penerima Dana');
    setPenerimaTtd('');
  }, [expense, settings]);

  if (!expense) return null;

  const handlePrint = () => {
    window.print();
  };

  // Helper for image upload on signatures
  const handleSignatureUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setter(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-300 flex flex-col max-h-[96vh]">
        {/* Top Control Bar with EXIT Menu (No Print) */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between no-print shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-800 text-sm tracking-tight">
              Kwitansi Bukti Kas Keluar
            </span>
            <span className="text-xs text-slate-500 font-mono">
              #{expense.code}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Kwitansi BKK</span>
            </button>

            {/* Prominent EXIT button */}
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
              title="Keluar / Tutup Formulir"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span>Exit</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Voucher Document (EXACT MATCH TO USER'S REFERENCE IMAGE) */}
        <div className="p-6 sm:p-10 space-y-5 print-page bg-white text-slate-900 flex-1 overflow-y-auto">
          {/* Header Kop: Logo on left (synced with settings.landscapeLogoUrl & settings.logoHeight), Heading centered */}
          <div className="relative flex items-center justify-center pb-3 border-b-2 border-slate-900 min-h-[64px]">
            {/* Logo on top left - Synced with Setting menu */}
            {settings.showLogoInReceipts !== false && (
              <div className="absolute left-0 top-0 bottom-0 flex items-center group">
                {settings.landscapeLogoUrl ? (
                  <img
                    src={settings.landscapeLogoUrl}
                    alt={settings.orgName || 'Logo Instansi'}
                    referrerPolicy="no-referrer"
                    className="max-w-[150px] sm:max-w-[190px] object-contain transition-all"
                    style={{ height: `${Math.min(Math.max(settings.logoHeight || 52, 32), 74)}px` }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs">
                    <div className="w-8 h-8 rounded-full border-2 border-emerald-700 flex items-center justify-center font-black text-sm">
                      +
                    </div>
                    <div className="leading-tight text-[11px]">
                      <div className="font-black text-emerald-900">STRUKTURAL</div>
                      <div className="font-extrabold text-slate-800">NURSING</div>
                    </div>
                  </div>
                )}
                {/* Quick Upload / Change Logo button (no-print) */}
                <label
                  className="absolute -bottom-1 -left-1 p-1 bg-white/95 hover:bg-white text-slate-700 hover:text-blue-700 rounded-full shadow-md border border-slate-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer no-print"
                  title="Ganti Logo (Tersimpan ke Pengaturan)"
                >
                  <Camera className="w-3 h-3" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        if (event.target?.result) {
                          updateSettings({ landscapeLogoUrl: event.target.result as string });
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {/* Centered Heading (Free Teks) */}
            <div className="text-center px-12 sm:px-16 w-full max-w-xl">
              <input
                type="text"
                value={headerOrgName}
                onChange={(e) => setHeaderOrgName(e.target.value)}
                className="w-full text-center text-sm sm:text-base font-black tracking-wider text-slate-900 uppercase font-sans bg-transparent border-none focus:outline-hidden hover:bg-slate-50 focus:bg-blue-50/50 rounded py-0.5 transition-colors"
                placeholder="NAMA INSTANSI / UNIT"
              />
              <input
                type="text"
                value={headerSubTitle}
                onChange={(e) => setHeaderSubTitle(e.target.value)}
                className="w-full text-center text-xs sm:text-sm font-semibold text-slate-800 mt-0.5 bg-transparent border-none focus:outline-hidden hover:bg-slate-50 focus:bg-blue-50/50 rounded py-0.5 transition-colors"
                placeholder="Sub-judul / Unit Pelayanan"
              />
            </div>
          </div>

          {/* Subheader Title: KWITANSI PENERIMAAN UANG */}
          <div className="text-center pt-1">
            <h2 className="text-sm sm:text-base font-black text-slate-950 uppercase tracking-wide underline underline-offset-4 font-sans">
              KWITANSI PENERIMAAN UANG
            </h2>
          </div>

          {/* 3 Main Fields with Colon Alignment */}
          <div className="space-y-2.5 text-xs sm:text-sm pt-2">
            {/* Field 1: Telah Terima Dari */}
            <div className="grid grid-cols-12 gap-2 items-center">
              <span className="col-span-3 sm:col-span-3 font-medium text-slate-800 whitespace-nowrap">
                Telah Terima Dari
              </span>
              <span className="col-span-1 text-center font-bold">:</span>
              <div className="col-span-8">
                <input
                  type="text"
                  value={telahTerimaDari}
                  onChange={(e) => setTelahTerimaDari(e.target.value)}
                  className="w-full font-semibold text-slate-900 bg-transparent border-b border-dotted border-slate-400 hover:border-slate-700 focus:border-blue-600 focus:outline-hidden py-0.5"
                  placeholder="Free Teks (Nama Pembayar / Kasir)"
                />
              </div>
            </div>

            {/* Field 2: Uang Sejumlah */}
            <div className="grid grid-cols-12 gap-2 items-start">
              <span className="col-span-3 sm:col-span-3 font-medium text-slate-800 whitespace-nowrap pt-0.5">
                Uang Sejumlah
              </span>
              <span className="col-span-1 text-center font-bold pt-0.5">:</span>
              <div className="col-span-8">
                <textarea
                  rows={2}
                  value={uangSejumlah}
                  onChange={(e) => setUangSejumlah(e.target.value)}
                  className="w-full font-semibold italic text-slate-900 bg-transparent border-b border-dotted border-slate-400 hover:border-slate-700 focus:border-blue-600 focus:outline-hidden py-0.5 leading-relaxed resize-none"
                  placeholder="Sesuai dengan jumlah uang yang dikeluarkan (Terbilang)"
                />
              </div>
            </div>

            {/* Field 3: Untuk Pembayaran */}
            <div className="grid grid-cols-12 gap-2 items-start">
              <span className="col-span-3 sm:col-span-3 font-medium text-slate-800 whitespace-nowrap pt-0.5">
                Untuk Pembayaran
              </span>
              <span className="col-span-1 text-center font-bold pt-0.5">:</span>
              <div className="col-span-8">
                <textarea
                  rows={2}
                  value={untukPembayaran}
                  onChange={(e) => setUntukPembayaran(e.target.value)}
                  className="w-full font-medium text-slate-900 bg-transparent border-b border-dotted border-slate-400 hover:border-slate-700 focus:border-blue-600 focus:outline-hidden py-0.5 resize-none"
                  placeholder="Free Teks (Keperluan / Uraian Belanja)"
                />
              </div>
            </div>
          </div>

          {/* Highlight Box: TOTAL DIBAYARKAN / DITERIMA & Amount */}
          <div className="border-2 border-slate-900 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/60">
            <div className="text-left w-full sm:w-auto">
              <div className="font-black text-xs sm:text-sm text-slate-950 uppercase tracking-wide underline underline-offset-2">
                TOTAL DIBAYARKAN / DITERIMA
              </div>
              <div className="text-[11px] sm:text-xs text-slate-600 mt-0.5 font-medium">
                Sesuai dengan bukti pengeluaran sah
              </div>
            </div>

            {/* Bordered Pill Box on Right (Amount without JUMLAH UANG KELUAR) */}
            <div className="border border-slate-900 rounded-lg px-5 sm:px-7 py-2.5 text-center bg-white shadow-2xs w-full sm:w-auto flex items-center justify-center">
              <span className="font-mono font-black text-base sm:text-lg text-slate-950 tabular-nums">
                {formatRupiah(expense.amount)}
              </span>
            </div>
          </div>

          {/* Date & Location: Palembang, Tanggal / Nama Bulan / Tahun (Posisi sebelah kiri - Full Visibility) */}
          <div className="pt-2 flex justify-start text-left w-full">
            <input
              type="text"
              value={lokasiTanggal}
              onChange={(e) => setLokasiTanggal(e.target.value)}
              className="w-full max-w-md font-bold text-xs sm:text-sm text-slate-950 bg-transparent border-none focus:outline-hidden py-0.5 px-1.5 text-left hover:bg-slate-50 focus:bg-blue-50/50 rounded transition-colors"
              placeholder="Palembang, DD Bulan YYYY"
            />
          </div>

          {/* 3 Signature Columns (Disetujui Oleh | Yang Menyerahkan | Yang Menerima Uang) */}
          <div className="grid grid-cols-3 gap-3 sm:gap-6 text-center text-xs pt-4">
            {/* Col 1: Disetujui Oleh */}
            <div className="flex flex-col justify-between items-center h-52 sm:h-56">
              <input
                type="text"
                value={disetujuiLabel}
                onChange={(e) => setDisetujuiLabel(e.target.value)}
                className="w-full text-center font-bold text-slate-900 text-xs sm:text-sm bg-transparent border-none focus:outline-hidden hover:bg-slate-50 focus:bg-blue-50/50 rounded py-0.5 transition-colors"
                placeholder="Disetujui Oleh"
              />

              {/* Signature Area (Ttd basah, upload, paste) */}
              <div className="w-full flex-1 flex flex-col items-center justify-center relative my-1">
                {disetujuiTtd ? (
                  <div className="relative group">
                    <img
                      src={disetujuiTtd}
                      alt="Ttd"
                      className="max-h-20 object-contain mx-auto"
                    />
                    <button
                      onClick={() => setDisetujuiTtd('')}
                      className="absolute -top-2 -right-2 p-1 bg-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity no-print"
                      title="Hapus Ttd"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <span className="text-[10px] text-slate-400 italic no-print">
                      Ttd (basah, upload, paste)
                    </span>
                    <label className="mt-1 inline-flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 cursor-pointer font-semibold no-print">
                      <Upload className="w-2.5 h-2.5" />
                      <span>Upload Ttd</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleSignatureUpload(e, setDisetujuiTtd)}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Name & Position (Free Teks) with Line in the Middle */}
              <div className="w-full flex flex-col items-center">
                {/* 1. Tulisan Nama (Atas) */}
                <input
                  type="text"
                  value={disetujuiNama}
                  onChange={(e) => setDisetujuiNama(e.target.value)}
                  className="w-full text-center font-bold text-slate-950 text-xs sm:text-sm bg-transparent border-none focus:outline-hidden hover:bg-slate-50 focus:bg-blue-50/50 rounded py-0.5 transition-colors"
                  placeholder="(Nama Terang)"
                />
                {/* 2. Garis di tengah: tepat di bawah nama dan di atas jabatan */}
                <div className="w-4/5 sm:w-full border-b border-slate-700 my-0.5"></div>
                {/* 3. Tulisan Jabatan (Bawah) */}
                <input
                  type="text"
                  value={disetujuiJabatan}
                  onChange={(e) => setDisetujuiJabatan(e.target.value)}
                  className="w-full text-center text-[11px] sm:text-xs text-slate-700 bg-transparent border-none focus:outline-hidden hover:bg-slate-50 focus:bg-blue-50/50 rounded py-0.5 transition-colors"
                  placeholder="Jabatan"
                />
              </div>
            </div>

            {/* Col 2: Yang Menyerahkan */}
            <div className="flex flex-col justify-between items-center h-52 sm:h-56">
              <input
                type="text"
                value={penyerahLabel}
                onChange={(e) => setPenyerahLabel(e.target.value)}
                className="w-full text-center font-bold text-slate-900 text-xs sm:text-sm bg-transparent border-none focus:outline-hidden hover:bg-slate-50 focus:bg-blue-50/50 rounded py-0.5 transition-colors"
                placeholder="Yang Menyerahkan"
              />

              {/* Signature Area (Ttd basah, upload, paste) */}
              <div className="w-full flex-1 flex flex-col items-center justify-center relative my-1">
                {penyerahTtd ? (
                  <div className="relative group">
                    <img
                      src={penyerahTtd}
                      alt="Ttd"
                      className="max-h-20 object-contain mx-auto"
                    />
                    <button
                      onClick={() => setPenyerahTtd('')}
                      className="absolute -top-2 -right-2 p-1 bg-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity no-print"
                      title="Hapus Ttd"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <span className="text-[10px] text-slate-400 italic no-print">
                      Ttd (basah, upload, paste)
                    </span>
                    <label className="mt-1 inline-flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 cursor-pointer font-semibold no-print">
                      <Upload className="w-2.5 h-2.5" />
                      <span>Upload Ttd</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleSignatureUpload(e, setPenyerahTtd)}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Name & Position (Free Teks) with Line in the Middle */}
              <div className="w-full flex flex-col items-center">
                {/* 1. Tulisan Nama (Atas) */}
                <input
                  type="text"
                  value={penyerahNama}
                  onChange={(e) => setPenyerahNama(e.target.value)}
                  className="w-full text-center font-bold text-slate-950 text-xs sm:text-sm bg-transparent border-none focus:outline-hidden hover:bg-slate-50 focus:bg-blue-50/50 rounded py-0.5 transition-colors"
                  placeholder="(Nama Terang)"
                />
                {/* 2. Garis di tengah: tepat di bawah nama dan di atas jabatan */}
                <div className="w-4/5 sm:w-full border-b border-slate-700 my-0.5"></div>
                {/* 3. Tulisan Jabatan (Bawah) */}
                <input
                  type="text"
                  value={penyerahJabatan}
                  onChange={(e) => setPenyerahJabatan(e.target.value)}
                  className="w-full text-center text-[11px] sm:text-xs text-slate-700 bg-transparent border-none focus:outline-hidden hover:bg-slate-50 focus:bg-blue-50/50 rounded py-0.5 transition-colors"
                  placeholder="Jabatan"
                />
              </div>
            </div>

            {/* Col 3: Yang Menerima Uang */}
            <div className="flex flex-col justify-between items-center h-52 sm:h-56">
              <input
                type="text"
                value={penerimaLabel}
                onChange={(e) => setPenerimaLabel(e.target.value)}
                className="w-full text-center font-bold text-slate-900 text-xs sm:text-sm bg-transparent border-none focus:outline-hidden hover:bg-slate-50 focus:bg-blue-50/50 rounded py-0.5 transition-colors"
                placeholder="Yang Menerima Uang"
              />

              {/* Signature Area (Ttd basah, upload, paste) */}
              <div className="w-full flex-1 flex flex-col items-center justify-center relative my-1">
                {penerimaTtd ? (
                  <div className="relative group">
                    <img
                      src={penerimaTtd}
                      alt="Ttd"
                      className="max-h-20 object-contain mx-auto"
                    />
                    <button
                      onClick={() => setPenerimaTtd('')}
                      className="absolute -top-2 -right-2 p-1 bg-rose-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity no-print"
                      title="Hapus Ttd"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <span className="text-[10px] text-slate-400 italic no-print">
                      Ttd (basah, upload, paste)
                    </span>
                    <label className="mt-1 inline-flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 cursor-pointer font-semibold no-print">
                      <Upload className="w-2.5 h-2.5" />
                      <span>Upload Ttd</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleSignatureUpload(e, setPenerimaTtd)}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* Name & Position (Free Teks) with Line in the Middle */}
              <div className="w-full flex flex-col items-center">
                {/* 1. Tulisan Nama (Atas) */}
                <input
                  type="text"
                  value={penerimaNama}
                  onChange={(e) => setPenerimaNama(e.target.value)}
                  className="w-full text-center font-bold text-slate-950 text-xs sm:text-sm bg-transparent border-none focus:outline-hidden hover:bg-slate-50 focus:bg-blue-50/50 rounded py-0.5 transition-colors"
                  placeholder="(Nama Terang)"
                />
                {/* 2. Garis di tengah: tepat di bawah nama dan di atas jabatan */}
                <div className="w-4/5 sm:w-full border-b border-slate-700 my-0.5"></div>
                {/* 3. Tulisan Jabatan (Bawah) */}
                <input
                  type="text"
                  value={penerimaJabatan}
                  onChange={(e) => setPenerimaJabatan(e.target.value)}
                  className="w-full text-center text-[11px] sm:text-xs text-slate-700 bg-transparent border-none focus:outline-hidden hover:bg-slate-50 focus:bg-blue-50/50 rounded py-0.5 transition-colors"
                  placeholder="Jabatan"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Action Footer with Exit Button (No Print) */}
        <div className="p-3.5 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 no-print shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            Teks bertanda <span className="font-semibold text-slate-700 underline">Free Teks</span> dapat Anda edit langsung di atas sebelum mencetak.
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Kwitansi BKK</span>
            </button>

            {/* EXIT Button */}
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-rose-700 bg-white hover:bg-rose-50 border border-rose-300 rounded-lg transition-colors shadow-2xs cursor-pointer"
              title="Keluar / Tutup Formulir"
            >
              <LogOut className="w-4 h-4 text-rose-600" />
              <span>Exit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
