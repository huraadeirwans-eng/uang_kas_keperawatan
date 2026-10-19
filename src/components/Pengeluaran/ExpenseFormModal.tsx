import React, { useState, useEffect } from 'react';
import { X, Check, Upload, Image, Trash2, LogOut } from 'lucide-react';
import { Expense, PaymentMethod, ExpenseStatus } from '../../types';
import { useKas } from '../../context/KasContext';
import { formatRupiah } from '../../utils/formatters';
import { compressImageFile } from '../../utils/imageCompressor';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editExpense?: Expense | null;
}

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  onClose,
  editExpense,
}) => {
  const { settings, addExpense, updateExpense, deleteExpense } = useKas();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(settings.categoriesExpense[0] || 'Operasional & Kesekretariatan');
  const [recipient, setRecipient] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Tunai');
  const [status, setStatus] = useState<ExpenseStatus>('Selesai');
  const [receiptImage, setReceiptImage] = useState<string>('');
  const [receiptNote, setReceiptNote] = useState('');
  const [approvedBy, setApprovedBy] = useState(settings.treasurerName);

  useEffect(() => {
    if (editExpense) {
      setDate(editExpense.date);
      setCategory(editExpense.category);
      setRecipient(editExpense.recipient);
      setDescription(editExpense.description);
      setAmount(editExpense.amount);
      setPaymentMethod(editExpense.paymentMethod);
      setStatus(editExpense.status);
      setReceiptImage(editExpense.receiptImage || '');
      setReceiptNote(editExpense.receiptNote || '');
      setApprovedBy(editExpense.approvedBy || settings.treasurerName);
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setCategory(settings.categoriesExpense[0] || 'Operasional & Kesekretariatan');
      setRecipient('');
      setDescription('');
      setAmount('');
      setPaymentMethod('Tunai');
      setStatus('Selesai');
      setReceiptImage('');
      setReceiptNote('');
      setApprovedBy(settings.treasurerName);
    }
  }, [editExpense, settings, isOpen]);

  if (!isOpen) return null;

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Compress to lightweight high-fidelity dataUrl to prevent localStorage quota issues
      const compressed = await compressImageFile(file, 1200, 1200, 0.75);
      setReceiptImage(compressed);
      if (!receiptNote) {
        setReceiptNote(`Nota/Bukti ${file.name}`);
      }
    } catch (err) {
      console.error('Compression fallback:', err);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setReceiptImage(event.target.result as string);
          if (!receiptNote) {
            setReceiptNote(`Nota/Bukti ${file.name}`);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim() || !amount || Number(amount) <= 0) {
      alert('Mohon isi penerima dan nominal pengeluaran yang valid!');
      return;
    }

    if (editExpense) {
      updateExpense(editExpense.id, {
        date,
        category,
        recipient: recipient.trim(),
        description: description.trim(),
        amount: Number(amount),
        paymentMethod,
        status,
        receiptImage: receiptImage || undefined,
        receiptNote: receiptNote.trim() || undefined,
        approvedBy,
      });
    } else {
      addExpense({
        date,
        category,
        recipient: recipient.trim(),
        description: description.trim(),
        amount: Number(amount),
        paymentMethod,
        status,
        receiptImage: receiptImage || undefined,
        receiptNote: receiptNote.trim() || undefined,
        approvedBy,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 text-base">
            {editExpense ? 'Ubah Catatan Pengeluaran' : 'Catat Kas Keluar (Pengeluaran Baru)'}
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1 px-3 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-lg transition-colors cursor-pointer"
              title="Keluar / Tutup"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span>Exit</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 cursor-pointer"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Pengeluaran *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kategori Pengeluaran *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              >
                {settings.categoriesExpense.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Dibayarkan Kepada (Toko / Penyedia / Penerima) *
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Toko Alat Tulis Jaya, Catering Berkah, SPBU Pertamina"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Uraian / Keterangan Pembelanjaan
            </label>
            <textarea
              rows={2}
              placeholder="Contoh: Pembelian kertas F4 5 rim, spidol, konsumsi rapat..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nominal Biaya (Rp) *
              </label>
              <input
                type="number"
                min="500"
                step="500"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="150000"
                className="w-full text-xs px-3 py-2 font-mono tabular-nums border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
              {typeof amount === 'number' && amount > 0 && (
                <div className="mt-1 text-[11px] text-rose-600 font-medium">
                  {formatRupiah(amount)}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Metode Pembayaran
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              >
                <option value="Tunai">Tunai (Cash)</option>
                <option value="Transfer Bank">Transfer Bank</option>
                <option value="QRIS">QRIS</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
          </div>

          {/* Lampiran Bukti Nota / Kwitansi */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                Unggah Bukti Nota / Kwitansi Belanja
              </label>
              {receiptImage && (
                <button
                  type="button"
                  onClick={() => setReceiptImage('')}
                  className="text-[11px] text-rose-600 hover:underline flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Hapus Bukti</span>
                </button>
              )}
            </div>

            {receiptImage ? (
              <div className="flex items-center gap-3 bg-white p-2 border border-slate-200 rounded-md">
                <img
                  src={receiptImage}
                  alt="Pratinjau Nota"
                  className="w-14 h-14 object-cover rounded border border-slate-200"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-800 truncate">
                    Foto Bukti Telah Diunggah
                  </div>
                  <input
                    type="text"
                    placeholder="Keterangan nota (cth: Nota No. 2145)"
                    value={receiptNote}
                    onChange={(e) => setReceiptNote(e.target.value)}
                    className="mt-1 w-full text-[11px] px-2 py-1 border border-slate-200 rounded"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-lg p-3 cursor-pointer bg-white transition-colors">
                  <Upload className="w-5 h-5 text-slate-400 mb-1" />
                  <span className="text-xs text-slate-600 font-medium">
                    Klik untuk pilih foto nota / struk
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    PNG, JPG, WebP (Maks 8MB)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
            <div>
              {editExpense && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Yakin ingin menghapus catatan pengeluaran "${editExpense.recipient}"?`)) {
                      deleteExpense(editExpense.id);
                      onClose();
                    }
                  }}
                  className="px-3 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  title="Hapus data pengeluaran ini"
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
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-600" />
                <span>Exit</span>
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{editExpense ? 'Simpan Perubahan' : 'Simpan Pengeluaran'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
