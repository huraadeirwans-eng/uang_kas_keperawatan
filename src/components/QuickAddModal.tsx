import React, { useState } from 'react';
import { X, TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useKas } from '../context/KasContext';
import { IncomeFormModal } from './Pendapatan/IncomeFormModal';
import { ExpenseFormModal } from './Pengeluaran/ExpenseFormModal';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'income' | 'expense' | null>(null);

  if (!isOpen) return null;

  if (mode === 'income') {
    return (
      <IncomeFormModal
        isOpen={true}
        onClose={() => {
          setMode(null);
          onClose();
        }}
      />
    );
  }

  if (mode === 'expense') {
    return (
      <ExpenseFormModal
        isOpen={true}
        onClose={() => {
          setMode(null);
          onClose();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-sm w-full overflow-hidden border border-slate-200">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 text-sm">
            Catat Transaksi Buku Kas
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <p className="text-xs text-slate-500 mb-2">
            Pilih jenis transaksi kas yang ingin Anda catat:
          </p>

          <button
            onClick={() => setMode('income')}
            className="w-full flex items-center gap-3.5 p-3.5 border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 rounded-xl transition-colors text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-slate-900 text-sm group-hover:text-emerald-700">
                Kas Masuk (Pendapatan)
              </div>
              <div className="text-xs text-slate-500 truncate">
                Iuran peserta, donasi, sponsor, penjualan
              </div>
            </div>
          </button>

          <button
            onClick={() => setMode('expense')}
            className="w-full flex items-center gap-3.5 p-3.5 border border-rose-200 bg-rose-50/50 hover:bg-rose-50 rounded-xl transition-colors text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-slate-900 text-sm group-hover:text-rose-700">
                Kas Keluar (Pengeluaran)
              </div>
              <div className="text-xs text-slate-500 truncate">
                Operasional, konsumsi, belanja nota, honor
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
