import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Participant, PaymentMethod } from '../../types';
import { useKas } from '../../context/KasContext';
import { formatRupiah } from '../../utils/formatters';

interface ParticipantPaymentModalProps {
  participant: Participant | null;
  onClose: () => void;
}

export const ParticipantPaymentModal: React.FC<ParticipantPaymentModalProps> = ({
  participant,
  onClose,
}) => {
  const { recordParticipantPayment } = useKas();

  if (!participant) return null;

  const remaining = Math.max(0, participant.targetAmount - participant.totalPaid);

  const [amount, setAmount] = useState<number | ''>(remaining > 0 ? remaining : 100000);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Transfer Bank');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState(`Pembayaran iuran kas dari ${participant.name}`);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      alert('Mohon masukkan nominal pembayaran yang valid');
      return;
    }

    recordParticipantPayment(
      participant.id,
      Number(amount),
      paymentMethod,
      date,
      notes.trim()
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-800 text-sm">
              Catat Pembayaran Iuran
            </h2>
            <p className="text-xs text-slate-500">
              {participant.name} · {participant.position} ({participant.workUnit || participant.groupOrDepartment})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg text-xs space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Target Iuran:</span>
              <span className="font-semibold text-slate-800">{formatRupiah(participant.targetAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Sudah Dibayar:</span>
              <span className="font-semibold text-emerald-700">{formatRupiah(participant.totalPaid)}</span>
            </div>
            <div className="flex justify-between text-slate-700 font-bold pt-1 border-t border-blue-200">
              <span>Sisa Tanggungan:</span>
              <span className={remaining > 0 ? 'text-amber-600' : 'text-emerald-700'}>
                {formatRupiah(remaining)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nominal yang Dibayarkan (Rp) *
            </label>
            <input
              type="number"
              min="1000"
              step="1000"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full text-xs px-3 py-2 font-mono tabular-nums border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
            {typeof amount === 'number' && amount > 0 && (
              <div className="mt-1 text-[11px] text-emerald-700 font-medium">
                {formatRupiah(amount)}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Pembayaran
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Metode Pembayaran
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value="Transfer Bank">Transfer Bank</option>
                <option value="Tunai">Tunai (Cash)</option>
                <option value="QRIS">QRIS</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan / Referensi
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Simpan & Masukkan ke Kas</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
