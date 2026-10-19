import React from 'react';
import { X, Printer, Download } from 'lucide-react';
import { useKas } from '../context/KasContext';
import {
  formatRupiah,
  formatTanggalIndo,
  formatTanggalSingkat,
} from '../utils/formatters';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    settings,
    incomes,
    expenses,
    totalIncome,
    totalExpense,
    netBalance,
  } = useKas();

  if (!isOpen) return null;

  // Build sorted chronological list with running balance
  const allTransactions = [
    ...incomes
      .filter((i) => i.status === 'Lunas')
      .map((i) => ({
        date: i.date,
        code: i.code,
        description: `Penerimaan: ${i.category} - ${i.source} ${i.notes ? `(${i.notes})` : ''}`,
        debit: i.amount,
        credit: 0,
      })),
    ...expenses
      .filter((e) => e.status === 'Selesai')
      .map((e) => ({
        date: e.date,
        code: e.code,
        description: `Pengeluaran: ${e.category} - ${e.recipient} ${e.description ? `(${e.description})` : ''}`,
        debit: 0,
        credit: e.amount,
      })),
  ].sort((a, b) => {
    const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (diff !== 0) return diff;
    return a.code.localeCompare(b.code);
  });

  let running = 0;
  const ledgerRows = allTransactions.map((tx) => {
    running = running + tx.debit - tx.credit;
    return {
      ...tx,
      balance: running,
    };
  });

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden border border-slate-200">
        {/* Top Control Bar (No Print) */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between no-print">
          <div>
            <h2 className="font-bold text-slate-800 text-sm">
              Cetak Buku Kas Umum Resmi
            </h2>
            <p className="text-xs text-slate-500">
              Format siap cetak A4 dengan Kop Surat Logo Landscape & Lembar Pengesahan
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Ledger Document */}
        <div className="p-6 sm:p-10 space-y-6 print-page bg-white text-slate-900 max-h-[85vh] overflow-y-auto">
          {/* Landscape Kop Surat Header */}
          <div
            className={`flex flex-col gap-3 pb-3 border-b-2 border-slate-900 ${
              settings.logoAlignment === 'center'
                ? 'items-center text-center'
                : 'sm:flex-row items-center justify-between text-center sm:text-right'
            }`}
          >
            {settings.landscapeLogoUrl && settings.showLogoInPrint && (
              <div className="max-w-[260px] p-1 flex items-center justify-center">
                <img
                  src={settings.landscapeLogoUrl}
                  alt={settings.orgName}
                  referrerPolicy="no-referrer"
                  className="max-w-full object-contain"
                  style={{ height: `${Math.min(settings.logoHeight || 52, 68)}px` }}
                />
              </div>
            )}
            <div className={settings.logoAlignment === 'center' ? 'text-center' : 'text-center sm:text-right'}>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-tight">
                {settings.orgName}
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                {settings.subTitle}
              </p>
              <p className="text-[11px] text-slate-500">
                {settings.address}
              </p>
              <p className="text-[11px] text-slate-500">
                Kontak: {settings.phone} · Email: {settings.email}
              </p>
            </div>
          </div>

          {/* Secondary thin divider line for formal Indonesian Kop */}
          <div className="-mt-4 border-t border-slate-400" />

          {/* Report Title */}
          <div className="text-center space-y-1 pt-2">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight uppercase underline">
              BUKU KAS UMUM (BKU)
            </h2>
            <p className="text-xs text-slate-500">
              Periode Pembukuan s/d Tanggal: {formatTanggalIndo(todayStr)}
            </p>
          </div>

          {/* Summary Box */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
            <div>
              <span className="text-slate-500 block">Total Penerimaan (Debet)</span>
              <span className="font-mono font-bold text-emerald-700 text-sm">
                {formatRupiah(totalIncome)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Total Pengeluaran (Kredit)</span>
              <span className="font-mono font-bold text-rose-600 text-sm">
                {formatRupiah(totalExpense)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Saldo Akhir Buku Kas</span>
              <span className="font-mono font-bold text-slate-900 text-sm">
                {formatRupiah(netBalance)}
              </span>
            </div>
          </div>

          {/* Ledger Table - Fixed With Content (Fit 1 Halaman Kerja), text wrap if longer than box */}
          <div className="border border-slate-300 rounded overflow-hidden">
            <table className="w-full table-fixed text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold select-none text-[11px] text-center">
                  <th style={{ width: '5%' }} className="py-2 px-1 border-r border-slate-300 text-center whitespace-normal break-words leading-tight">No</th>
                  <th style={{ width: '13%' }} className="py-2 px-2 border-r border-slate-300 text-center whitespace-normal break-words leading-tight">Tanggal</th>
                  <th style={{ width: '13%' }} className="py-2 px-2 border-r border-slate-300 font-mono text-center whitespace-normal break-words leading-tight">No. Bukti</th>
                  <th style={{ width: '31%' }} className="py-2 px-2.5 border-r border-slate-300 text-center whitespace-normal break-words leading-tight">Uraian Transaksi</th>
                  <th style={{ width: '12%' }} className="py-2 px-2 border-r border-slate-300 text-center whitespace-normal break-words leading-tight">Debet (Rp)</th>
                  <th style={{ width: '12%' }} className="py-2 px-2 border-r border-slate-300 text-center whitespace-normal break-words leading-tight">Kredit (Rp)</th>
                  <th style={{ width: '14%' }} className="py-2 px-2 text-center whitespace-normal break-words leading-tight">Saldo (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {ledgerRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                      Tidak ada catatan transaksi kas
                    </td>
                  </tr>
                ) : (
                  ledgerRows.map((row, idx) => (
                    <tr key={`${row.code}-${idx}`} className="hover:bg-slate-50">
                      <td className="py-2 px-1 border-r border-slate-200 text-center font-mono text-[11px] text-slate-500 align-middle">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-2 border-r border-slate-200 text-center text-slate-600 align-middle whitespace-normal break-words leading-tight text-[11px]">
                        {formatTanggalSingkat(row.date)}
                      </td>
                      <td className="py-2 px-2 border-r border-slate-200 font-mono text-[11px] text-slate-600 text-center align-middle whitespace-normal break-words leading-tight">
                        {row.code}
                      </td>
                      <td className="py-2 px-2.5 border-r border-slate-200 text-slate-800 align-middle">
                        <div className="whitespace-normal break-words leading-tight" title={row.description}>
                          {row.description}
                        </div>
                      </td>
                      <td className="py-2 px-2 border-r border-slate-200 text-right font-mono tabular-nums text-emerald-700 align-middle whitespace-normal break-words leading-tight text-[11px]">
                        {row.debit > 0 ? formatRupiah(row.debit) : '-'}
                      </td>
                      <td className="py-2 px-2 border-r border-slate-200 text-right font-mono tabular-nums text-rose-600 align-middle whitespace-normal break-words leading-tight text-[11px]">
                        {row.credit > 0 ? formatRupiah(row.credit) : '-'}
                      </td>
                      <td className="py-2 px-2 text-right font-mono tabular-nums font-bold text-slate-900 align-middle whitespace-normal break-words leading-tight text-[11px]">
                        {formatRupiah(row.balance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
                  <td colSpan={4} className="py-2.5 px-3 text-center border-r border-slate-300">
                    TOTAL KESELURUHAN & SALDO AKHIR
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-700 border-r border-slate-300">
                    {formatRupiah(totalIncome)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-rose-600 border-r border-slate-300">
                    {formatRupiah(totalExpense)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-900">
                    {formatRupiah(netBalance)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Signatures */}
          <div className="pt-8 grid grid-cols-2 gap-12 text-center text-xs">
            <div>
              <p className="text-slate-600">Mengetahui & Menyetujui,</p>
              <p className="font-semibold text-slate-800">{settings.leaderTitle}</p>
              <div className="h-20" />
              <p className="font-bold text-slate-900 border-t border-slate-400 pt-1 inline-block min-w-[180px]">
                {settings.leaderName}
              </p>
            </div>

            <div>
              <p className="text-slate-600">Dibuat Oleh,</p>
              <p className="font-semibold text-slate-800">{settings.treasurerTitle}</p>
              <div className="h-20" />
              <p className="font-bold text-slate-900 border-t border-slate-400 pt-1 inline-block min-w-[180px]">
                {settings.treasurerName}
              </p>
            </div>
          </div>

          {/* Footer date */}
          <div className="pt-6 border-t border-slate-200 text-center text-[10px] text-slate-400">
            Dicetak secara otomatis oleh Buku Kas Struktural Nursing pada {formatTanggalIndo(todayStr)} · Dokumen ini sah dan mengikat untuk keperluan pelaporan keuangan.
          </div>
        </div>
      </div>
    </div>
  );
};
