import React from 'react';
import { X, Printer, Download, CheckCircle2 } from 'lucide-react';
import { Income } from '../../types';
import { useKas } from '../../context/KasContext';
import {
  angkaKeTerbilang,
  formatRupiah,
  formatTanggalIndo,
} from '../../utils/formatters';

interface KuitansiModalProps {
  income: Income | null;
  onClose: () => void;
}

export const KuitansiModal: React.FC<KuitansiModalProps> = ({ income, onClose }) => {
  const { settings } = useKas();

  if (!income) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full overflow-hidden border border-slate-200">
        {/* Modal Controls (No Print) */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 text-sm">
              Kuitansi Penerimaan Kas
            </span>
            <span className="text-xs text-slate-500 font-mono">
              #{income.receiptNumber || income.code}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Kuitansi</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Kuitansi Document with Executive Double Border Frame */}
        <div className="p-4 sm:p-6 print-page bg-white text-slate-900">
          <div className="border-2 border-slate-900 p-1.5 rounded-sm">
            <div className="border border-slate-400 p-5 sm:p-7 space-y-5 rounded-xs relative">
              {/* Letterhead Kop Surat with Landscape Logo */}
              <div
                className={`flex flex-col gap-3 pb-4 border-b-2 border-slate-900 ${
                  settings.logoAlignment === 'center'
                    ? 'items-center text-center'
                    : 'sm:flex-row items-center justify-between text-center sm:text-right'
                }`}
              >
                {settings.landscapeLogoUrl && settings.showLogoInReceipts && (
                  <div className="max-w-[240px] flex items-center justify-center">
                    <img
                      src={settings.landscapeLogoUrl}
                      alt={settings.orgName}
                      referrerPolicy="no-referrer"
                      className="max-w-full object-contain"
                      style={{ height: `${Math.min(settings.logoHeight || 48, 64)}px` }}
                    />
                  </div>
                )}
                <div className={settings.logoAlignment === 'center' ? 'text-center' : 'text-center sm:text-right'}>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wider font-sans">
                    {settings.orgName}
                  </h2>
                  <p className="text-[11px] text-slate-600 font-medium">{settings.address}</p>
                  <p className="text-[11px] text-slate-600">Telp: {settings.phone} | {settings.email}</p>
                </div>
              </div>

              {/* Title & Receipt Meta */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-dashed border-slate-300 pb-3">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block">
                    TANDA BUKTI PEMBAYARAN KAS RESMI
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                    KUITANSI PEMBAYARAN
                  </h1>
                </div>
                <div className="text-left sm:text-right text-xs">
                  <div className="font-mono font-black text-slate-900 text-sm">
                    NO: {income.receiptNumber || income.code}
                  </div>
                  <div className="text-slate-600 font-medium">
                    Tanggal: {formatTanggalIndo(income.date)}
                  </div>
                </div>
              </div>

              {/* Receipt Body Table */}
              <div className="space-y-3 text-xs sm:text-sm">
                <div className="grid grid-cols-12 gap-2 py-1.5 border-b border-slate-100 items-baseline">
                  <span className="col-span-4 sm:col-span-3 text-slate-600 font-medium">Telah Diterima Dari</span>
                  <span className="col-span-8 sm:col-span-9 font-bold text-slate-950 text-sm">
                    : {income.source}
                  </span>
                </div>

                <div className="grid grid-cols-12 gap-2 py-1.5 border-b border-slate-100 items-baseline">
                  <span className="col-span-4 sm:col-span-3 text-slate-600 font-medium">Uang Sejumlah</span>
                  <span className="col-span-8 sm:col-span-9 font-mono font-black text-emerald-800 text-base sm:text-lg">
                    : {formatRupiah(income.amount)}
                  </span>
                </div>

                <div className="grid grid-cols-12 gap-2 py-2 border border-slate-200 bg-slate-50/80 p-3 rounded-md">
                  <span className="col-span-4 sm:col-span-3 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">Terbilang</span>
                  <span className="col-span-8 sm:col-span-9 font-bold italic text-slate-900 leading-snug">
                    : # {angkaKeTerbilang(income.amount)} #
                  </span>
                </div>

                <div className="grid grid-cols-12 gap-2 py-1.5 border-b border-slate-100 items-baseline">
                  <span className="col-span-4 sm:col-span-3 text-slate-600 font-medium">Untuk Keperluan</span>
                  <span className="col-span-8 sm:col-span-9 text-slate-900">
                    : <strong className="font-bold text-slate-950">{income.category}</strong>
                    {income.notes ? ` — ${income.notes}` : ''}
                  </span>
                </div>

                <div className="grid grid-cols-12 gap-2 py-1.5 border-b border-slate-100 items-baseline">
                  <span className="col-span-4 sm:col-span-3 text-slate-600 font-medium">Metode Pembayaran</span>
                  <span className="col-span-8 sm:col-span-9 text-slate-800 font-semibold">
                    : {income.paymentMethod}
                  </span>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-4 grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <p className="text-slate-600 font-medium">Penyetor / Pembayar,</p>
                  <div className="h-16 sm:h-20" />
                  <p className="font-black text-slate-900 border-t border-slate-400 pt-1 inline-block min-w-[150px]">
                    ( {income.source} )
                  </p>
                </div>

                <div>
                  <p className="text-slate-600 font-medium">
                    Diterima Oleh, {formatTanggalIndo(income.date)}
                  </p>
                  <p className="text-[11px] text-slate-500 font-semibold">{settings.treasurerTitle}</p>
                  <div className="h-14 sm:h-18 flex items-center justify-center">
                    <span className="px-3.5 py-1 bg-emerald-50 text-emerald-800 border-2 border-emerald-600 font-black rounded-xs tracking-widest text-[11px] transform -rotate-3 shadow-2xs">
                      LUNAS / DITERIMA KAS
                    </span>
                  </div>
                  <p className="font-black text-slate-900 border-t border-slate-400 pt-1 inline-block min-w-[150px]">
                    ( {settings.treasurerName} )
                  </p>
                </div>
              </div>

              {/* Footer notice */}
              <div className="text-[9.5px] text-slate-400 text-center pt-3 border-t border-slate-200">
                Dokumen Kuitansi Sah Sistem Buku Kas Struktural Nursing · Terverifikasi Otomatis
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
