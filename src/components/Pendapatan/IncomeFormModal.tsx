import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, Calendar, User, DollarSign, Tag, CreditCard, FileText } from 'lucide-react';
import { Income, PaymentMethod, IncomeStatus } from '../../types';
import { useKas } from '../../context/KasContext';
import { formatRupiah } from '../../utils/formatters';

interface IncomeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editIncome?: Income | null;
}

const BULAN_OPTIONS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const TAHUN_OPTIONS = ['2026', '2027', '2028', '2029', '2030', '2031', '2032'];

const SUMBER_PENERIMAAN_OPTIONS = [
  'Iuran Anggota',
  'Kas Awal',
  'Subsidi Dana RS',
  'Donasi',
  'Lainnya',
];

export const IncomeFormModal: React.FC<IncomeFormModalProps> = ({
  isOpen,
  onClose,
  editIncome,
}) => {
  const { participants, addIncome, updateIncome, deleteIncome } = useKas();

  // 1. Nama Lengkap & Peserta
  const [participantId, setParticipantId] = useState('');
  const [source, setSource] = useState('');
  const [isManualSource, setIsManualSource] = useState(false);

  // 2. Tanggal Pembayaran (YYYY-MM-DD for input, displayed as DD/MM/YYYY)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // 3. Periode Pembayaran (Januari s/d Desember)
  const [period, setPeriod] = useState('Oktober');

  // 4. Tahun (2026 dan seterusnya)
  const [year, setYear] = useState('2026');

  // 5. Sumber Penerimaan (Iuran Anggota, Kas Awal, Subsidi Dana RS, Donasi, Lainnya)
  const [sumberOption, setSumberOption] = useState('Iuran Anggota');
  const [customSumber, setCustomSumber] = useState('');

  // 6. Metode Pembayaran (QRIS, Transfer, Tunai)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Transfer');

  // 7. Nominal (Format Rupiah)
  const [amount, setAmount] = useState<number | ''>(250000);

  // 8. Status Pembayaran (Lunas, Belum Lunas)
  const [status, setStatus] = useState<IncomeStatus>('Lunas');

  // 9. Keterangan (Free Teks)
  const [notes, setNotes] = useState('');

  // Auto-detect month from date
  const getBulanFromDate = (d: string) => {
    try {
      const parts = d.split('-');
      if (parts.length >= 2) {
        const idx = parseInt(parts[1], 10) - 1;
        return BULAN_OPTIONS[idx] || 'Oktober';
      }
    } catch (e) {
      // fallback
    }
    return 'Oktober';
  };

  // Format date to DD/MM/YYYY for display
  const formatDateToDDMMYYYY = (isoDate: string) => {
    if (!isoDate) return '';
    const parts = isoDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoDate;
  };

  useEffect(() => {
    if (editIncome) {
      setDate(editIncome.date);
      setPeriod(editIncome.period || getBulanFromDate(editIncome.date));
      setYear(editIncome.year || editIncome.date.split('-')[0] || '2026');

      // Sumber Penerimaan
      const existingSumber = editIncome.acceptanceSource || editIncome.category || 'Iuran Anggota';
      if (SUMBER_PENERIMAAN_OPTIONS.includes(existingSumber) && existingSumber !== 'Lainnya') {
        setSumberOption(existingSumber);
        setCustomSumber('');
      } else {
        setSumberOption('Lainnya');
        setCustomSumber(existingSumber);
      }

      setSource(editIncome.source);
      setParticipantId(editIncome.participantId || '');
      setIsManualSource(!editIncome.participantId);

      // Map Payment Method to standard (QRIS, Transfer, Tunai)
      let meth: PaymentMethod = 'Transfer';
      if (editIncome.paymentMethod === 'QRIS') meth = 'QRIS';
      else if (editIncome.paymentMethod === 'Tunai') meth = 'Tunai';
      else meth = 'Transfer';
      setPaymentMethod(meth);

      // Status
      setStatus(editIncome.status === 'Tertunda' || editIncome.status === 'Belum Lunas' ? 'Belum Lunas' : 'Lunas');
      setAmount(editIncome.amount);
      setNotes(editIncome.notes || '');
    } else {
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
      setPeriod(getBulanFromDate(today));
      setYear(today.split('-')[0] || '2026');
      setSumberOption('Iuran Anggota');
      setCustomSumber('');
      setParticipantId(participants[0]?.id || '');
      setSource(participants[0]?.name || '');
      setIsManualSource(false);
      setPaymentMethod('Transfer');
      setAmount(250000);
      setStatus('Lunas');
      setNotes('');
    }
  }, [editIncome, isOpen, participants]);

  if (!isOpen) return null;

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    if (!editIncome) {
      setPeriod(getBulanFromDate(newDate));
      setYear(newDate.split('-')[0] || '2026');
    }
  };

  const handleParticipantSelect = (pId: string) => {
    if (pId === '__MANUAL__') {
      setParticipantId('');
      setSource('');
      setIsManualSource(true);
      return;
    }

    setParticipantId(pId);
    setIsManualSource(false);
    const p = participants.find((item) => item.id === pId);
    if (p) {
      setSource(p.name);
      const remaining = Math.max(0, p.targetAmount - p.totalPaid);
      if (remaining > 0) {
        setAmount(remaining);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!source.trim()) {
      alert('Mohon pilih atau masukkan Nama Lengkap!');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      alert('Mohon masukkan Nominal pembayaran yang valid!');
      return;
    }

    const finalSumber =
      sumberOption === 'Lainnya'
        ? customSumber.trim() || 'Lainnya'
        : sumberOption;

    const matchedParticipant = participantId
      ? participants.find((p) => p.id === participantId)
      : undefined;

    if (editIncome) {
      updateIncome(editIncome.id, {
        date,
        period,
        year,
        acceptanceSource: finalSumber,
        category: finalSumber,
        source: source.trim(),
        participantId: participantId || undefined,
        position: matchedParticipant?.position as string || editIncome.position,
        workUnit: (matchedParticipant?.workUnit || matchedParticipant?.groupOrDepartment) as string || editIncome.workUnit,
        amount: Number(amount),
        paymentMethod,
        status,
        notes: notes.trim(),
      });
    } else {
      addIncome({
        date,
        period,
        year,
        acceptanceSource: finalSumber,
        category: finalSumber,
        source: source.trim(),
        participantId: participantId || undefined,
        position: matchedParticipant?.position as string,
        workUnit: (matchedParticipant?.workUnit || matchedParticipant?.groupOrDepartment) as string,
        amount: Number(amount),
        paymentMethod,
        status,
        notes: notes.trim(),
      });
    }

    onClose();
  };

  const handleDeleteCurrent = () => {
    if (!editIncome) return;
    if (confirm(`Yakin ingin menghapus data pembayaran dari "${editIncome.source}"?`)) {
      deleteIncome(editIncome.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-300">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-slate-100 border-b border-slate-300 flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight uppercase">
              {editIncome ? 'Edit Data Iuran Masuk' : 'Kotak Dialog Catat Iuran Masuk'}
            </h2>
            <p className="text-[11px] text-slate-500">
              Pencatatan penerimaan kas dan pembayaran iuran
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 text-xs">
          {/* 1. NAMA LENGKAP (DROPDOWN DARI DAFTAR PESERTA) */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-600" />
              <span>NAMA LENGKAP *</span>
              <span className="text-[10px] font-normal text-slate-500">(Pilih dari Daftar Peserta)</span>
            </label>
            <select
              value={isManualSource ? '__MANUAL__' : participantId}
              onChange={(e) => handleParticipantSelect(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden bg-white font-medium text-slate-900"
            >
              <optgroup label="-- Pilih Peserta Terdaftar --">
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.position} ({p.workUnit || p.groupOrDepartment})
                  </option>
                ))}
              </optgroup>
              <optgroup label="-- Opsi Lainnya --">
                <option value="__MANUAL__">+ Masukkan Nama Manual / Pihak Luar</option>
              </optgroup>
            </select>

            {/* If Manual is chosen, input free text name */}
            {isManualSource && (
              <div className="mt-2">
                <input
                  type="text"
                  required
                  placeholder="Ketik Nama Lengkap Penyetor..."
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden bg-amber-50/30"
                />
              </div>
            )}
          </div>

          {/* 2 & 3 & 4. TANGGAL, PERIODE & TAHUN PEMBAYARAN */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* TANGGAL PEMBAYARAN (DD/MM/YYYY) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-600" />
                <span>TANGGAL (DD/MM/YYYY) *</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-mono"
              />
              <div className="text-[10px] text-slate-600 font-mono mt-0.5 text-center font-bold">
                {formatDateToDDMMYYYY(date)}
              </div>
            </div>

            {/* PERIODE PEMBAYARAN (DROPDOWN: JANUARI S/D DESEMBER) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                PERIODE PEMBAYARAN *
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden bg-white font-medium"
              >
                {BULAN_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* TAHUN : 2026 DAN SETERUSNYA */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                TAHUN (≥ 2026) *
              </label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden bg-white font-mono font-bold"
              >
                {['2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033', '2034', '2035'].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 5. SUMBER PENERIMAAN (DROPDOWN: IURAN ANGGOTA, KAS AWAL, SUBSIDI DANA RS, DONASI, LAINNYA) */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
              <Tag className="w-3 h-3 text-slate-600" />
              <span>SUMBER PENERIMAAN *</span>
            </label>
            <select
              value={sumberOption}
              onChange={(e) => setSumberOption(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden bg-white font-medium text-slate-900"
            >
              {SUMBER_PENERIMAAN_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === 'Lainnya' ? 'Lainnya (Free Teks)' : opt}
                </option>
              ))}
            </select>

            {/* If "Lainnya" chosen, show FREE TEKS input */}
            {sumberOption === 'Lainnya' && (
              <div className="mt-2">
                <input
                  type="text"
                  required
                  placeholder="Ketik Sumber Penerimaan Lainnya (Free Teks)..."
                  value={customSumber}
                  onChange={(e) => setCustomSumber(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-emerald-400 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden bg-emerald-50/30 font-medium"
                />
              </div>
            )}
          </div>

          {/* 6 & 7. METODE PEMBAYARAN & NOMINAL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* METODE PEMBAYARAN (QRIS, TRANSFER, TUNAI) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-slate-600" />
                <span>METODE PEMBAYARAN *</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden bg-white font-medium"
              >
                <option value="QRIS">QRIS</option>
                <option value="Transfer">TRANSFER</option>
                <option value="Tunai">TUNAI</option>
              </select>
            </div>

            {/* NOMINAL (FORMAT RUPIAH) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-slate-600" />
                <span>NOMINAL (FORMAT RUPIAH) *</span>
              </label>
              <input
                type="number"
                min="1000"
                step="1000"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="250000"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden font-mono font-bold"
              />
              {typeof amount === 'number' && amount > 0 && (
                <div className="text-[11px] font-extrabold text-emerald-800 font-mono mt-0.5">
                  {formatRupiah(amount)}
                </div>
              )}
            </div>
          </div>

          {/* 8. STATUS PEMBAYARAN (LUNAS, BELUM LUNAS) */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              STATUS PEMBAYARAN *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus('Lunas')}
                className={`py-2 px-3 rounded-lg border text-center font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  status === 'Lunas'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>LUNAS</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('Belum Lunas')}
                className={`py-2 px-3 rounded-lg border text-center font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  status === 'Belum Lunas'
                    ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span>BELUM LUNAS</span>
              </button>
            </div>
          </div>

          {/* 10. KETERANGAN (FREE TEKS) */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
              <FileText className="w-3 h-3 text-slate-600" />
              <span>KETERANGAN (FREE TEKS)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Keterangan tambahan transaksi pembayaran (opsional)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          {/* 9. AKSI (TERDAPAT FUNGSI EDIT DATA & HAPUS) */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
            <div>
              {editIncome && (
                <button
                  type="button"
                  onClick={handleDeleteCurrent}
                  className="px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  title="Hapus data pembayaran ini"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Data</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{editIncome ? 'Simpan Perubahan' : 'Simpan Pembayaran'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
