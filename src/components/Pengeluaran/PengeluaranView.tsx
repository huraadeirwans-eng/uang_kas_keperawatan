import React, { useState, useMemo } from 'react';
import {
  TrendingDown,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  Edit2,
  Trash2,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';
import { useKas } from '../../context/KasContext';
import { Expense } from '../../types';
import {
  exportToCSV,
  formatRupiah,
  formatTanggalSingkat,
} from '../../utils/formatters';
import { ExpenseFormModal } from './ExpenseFormModal';
import { BuktiKasKeluarModal } from './BuktiKasKeluarModal';
import { Pagination } from '../Pagination';
import { useAutoPageSize } from '../../hooks/useAutoPageSize';

interface PengeluaranViewProps {
  initialSelectedId?: string | null;
  onClearInitialSelected?: () => void;
  onOpenReceiptGallery?: () => void;
}

export const PENGELUARAN_COLUMNS = [
  { id: 'no', label: 'No', width: '4%' },
  { id: 'date', label: 'TANGGAL', width: '11%' },
  { id: 'recipient', label: 'PENERIMA', width: '19%' },
  { id: 'category', label: 'KATEGORI BELANJA', width: '15%' },
  { id: 'receipt_status', label: 'STATUS BUKTI', width: '12%' },
  { id: 'amount', label: 'NOMINAL (Rp)', width: '13%' },
  { id: 'description', label: 'KEPERLUAN', width: '18%' },
  { id: 'action', label: 'AKSI', width: '8%' },
];

export const PengeluaranView: React.FC<PengeluaranViewProps> = ({
  initialSelectedId,
  onClearInitialSelected,
  onOpenReceiptGallery,
}) => {
  const { expenses, deleteExpense, settings } = useKas();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedMethod, setSelectedMethod] = useState('ALL');
  const [hasReceiptFilter, setHasReceiptFilter] = useState<'ALL' | 'YES' | 'NO'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Dynamic pagination so data fits exactly 1 page before moving to page 2 (Maksimal 1 Halaman Kerja)
  const { containerRef, pageSize: itemsPerPage } = useAutoPageSize(44, 5, 85);
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [bkkExpense, setBkkExpense] = useState<Expense | null>(() => {
    if (initialSelectedId) {
      return expenses.find((e) => e.id === initialSelectedId) || null;
    }
    return null;
  });

  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          item.code.toLowerCase().includes(q) ||
          item.recipient.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q)) ||
          (item.receiptNote && item.receiptNote.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // Category
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }

      // Method
      if (selectedMethod !== 'ALL') {
        if (selectedMethod === 'Transfer Bank') {
          if (item.paymentMethod !== 'Transfer Bank' && item.paymentMethod !== 'Transfer') {
            return false;
          }
        } else if (item.paymentMethod !== selectedMethod) {
          return false;
        }
      }

      // Receipt Filter
      if (hasReceiptFilter === 'YES' && !item.receiptImage) return false;
      if (hasReceiptFilter === 'NO' && item.receiptImage) return false;

      // Dates
      if (startDate && item.date < startDate) return false;
      if (endDate && item.date > endDate) return false;

      return true;
    });
  }, [expenses, searchQuery, selectedCategory, selectedMethod, hasReceiptFilter, startDate, endDate]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedMethod, hasReceiptFilter, startDate, endDate]);

  const paginatedExpenses = filteredExpenses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalFiltered = filteredExpenses
    .filter((e) => e.status === 'Selesai')
    .reduce((sum, item) => sum + item.amount, 0);

  const handleExportCSV = () => {
    const header = [
      'No',
      'TANGGAL',
      'PENERIMA',
      'KATEGORI BELANJA',
      'STATUS BUKTI',
      'NOMINAL (Rp)',
      'KEPERLUAN',
    ];

    const rows = filteredExpenses.map((item, idx) => [
      idx + 1,
      item.date,
      item.recipient,
      item.category,
      item.receiptImage ? 'Ada Bukti' : 'Tanpa Bukti',
      item.amount,
      item.description || '-',
    ]);

    exportToCSV(`daftar_pengeluaran_struktur_nursing_${new Date().toISOString().split('T')[0]}.csv`, [
      header,
      ...rows,
    ]);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus catatan pengeluaran "${name}"?`)) {
      deleteExpense(id);
    }
  };

  return (
    <div className="h-full flex flex-col justify-between space-y-2.5 sm:space-y-3 overflow-hidden">
      {/* Top action bar & stats (shrink-0) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 shrink-0">
        <div className="bg-white border border-slate-200/90 border-t-2 border-t-rose-500 rounded-xl p-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Pengeluaran Kas
            </span>
            <div className="text-xl font-black font-mono tabular-nums text-rose-600 tracking-tight">
              {formatRupiah(totalFiltered)}
            </div>
          </div>
          <span className="text-xs font-bold bg-rose-50 border border-rose-200/80 text-rose-800 px-2.5 py-1 rounded-sm">
            {filteredExpenses.length} Transaksi
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 border-t-2 border-t-amber-500 rounded-xl p-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Lampiran Bukti Nota
            </span>
            <div className="text-xl font-black font-mono tabular-nums text-slate-900 tracking-tight">
              {expenses.filter((e) => !!e.receiptImage).length} Nota
            </div>
          </div>
          <span className="text-xs font-bold bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-sm">
            Berkas SPJ
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 border-t-2 border-t-slate-800 rounded-xl p-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
              Catat Kas Keluar
            </span>
            <span className="text-xs font-semibold text-slate-700 truncate">
              Entri Pengeluaran & CSV
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                setEditingExpense(null);
                setIsFormOpen(true);
              }}
              className="p-2 text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-all shadow-xs cursor-pointer flex items-center justify-center hover:shadow-sm"
              title="Catat Kas Keluar (Tambah Pengeluaran)"
              aria-label="Catat Kas Keluar"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={handleExportCSV}
              className="p-2 text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
              title="Unduh File CSV"
              aria-label="Unduh File CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-rose-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar (shrink-0) */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs space-y-2 shrink-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Cari penerima, uraian..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden bg-white"
            >
              <option value="ALL">Semua Kategori</option>
              {settings.categoriesExpense.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden bg-white"
            >
              <option value="ALL">Semua Metode</option>
              <option value="Tunai">Tunai</option>
              <option value="Transfer Bank">Transfer Bank</option>
              <option value="QRIS">QRIS</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>

          <div>
            <select
              value={hasReceiptFilter}
              onChange={(e) => setHasReceiptFilter(e.target.value as any)}
              className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden bg-white"
            >
              <option value="ALL">Semua Status Nota</option>
              <option value="YES">Ada Lampiran Foto</option>
              <option value="NO">Tanpa Foto</option>
            </select>
          </div>
        </div>
      </div>

      {/* Worksheet Table Container with Header "DAFTAR PENGELUARAN STRUKTURAL NURSING" */}
      <div className="flex-1 min-h-0 bg-white border border-slate-300 rounded-xl shadow-xs flex flex-col justify-between overflow-hidden">
        <div ref={containerRef} className="flex-1 min-h-0 overflow-hidden w-full">
          <table className="w-full table-fixed text-left text-xs border-collapse">
            <thead>
              {/* Title Header with full colspan */}
              <tr className="bg-slate-900 text-white border-b border-slate-700">
                <th
                  colSpan={8}
                  className="border border-slate-700 py-2 px-3 text-center align-middle bg-slate-900 font-black text-xs sm:text-sm tracking-wide uppercase text-white truncate select-none leading-tight"
                >
                  DAFTAR PENGELUARAN STRUKTURAL NURSING
                </th>
              </tr>
              {/* 8 COLUMNS PRECISELY PROPORTIONED TO FIT 100% WIDTH - SEMUA JUDUL TABEL CENTER */}
              <tr className="bg-slate-800 text-slate-100 font-black text-[10px] sm:text-[11px] border-b-2 border-slate-700 select-none text-center">
                <th style={{ width: '4%' }} className="border border-slate-700 py-1.5 px-0.5 text-center align-middle bg-slate-800 text-slate-200 whitespace-normal break-words leading-tight">
                  No
                </th>
                <th style={{ width: '11%' }} className="border border-slate-700 py-1.5 px-1.5 text-center align-middle bg-slate-800 text-slate-200 uppercase whitespace-normal break-words leading-tight">
                  TANGGAL
                </th>
                <th style={{ width: '19%' }} className="border border-slate-700 py-1.5 px-2 text-center align-middle bg-slate-800 text-slate-200 uppercase whitespace-normal break-words leading-tight">
                  PENERIMA
                </th>
                <th style={{ width: '15%' }} className="border border-slate-700 py-1.5 px-1.5 text-center align-middle bg-slate-800 text-slate-200 uppercase whitespace-normal break-words leading-tight">
                  KATEGORI BELANJA
                </th>
                <th style={{ width: '12%' }} className="border border-slate-700 py-1.5 px-1.5 text-center align-middle bg-slate-800 text-slate-200 uppercase whitespace-normal break-words leading-tight">
                  STATUS BUKTI
                </th>
                <th style={{ width: '13%' }} className="border border-slate-700 py-1.5 px-2 text-center align-middle bg-slate-800 text-slate-200 uppercase whitespace-normal break-words leading-tight">
                  NOMINAL (Rp)
                </th>
                <th style={{ width: '18%' }} className="border border-slate-700 py-1.5 px-2 text-center align-middle bg-slate-800 text-slate-200 uppercase whitespace-normal break-words leading-tight">
                  KEPERLUAN
                </th>
                <th style={{ width: '8%' }} className="border border-slate-700 py-1.5 px-1 text-center align-middle bg-slate-800 text-slate-200 uppercase whitespace-normal break-words leading-tight">
                  AKSI
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {paginatedExpenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 border border-slate-300">
                    <p className="font-semibold text-xs text-slate-600">Tidak ada data pengeluaran</p>
                    <p className="text-[11px] mt-0.5">Sesuaikan filter atau catat kas keluar baru.</p>
                  </td>
                </tr>
              ) : (
                <>
                  {paginatedExpenses.map((item, idx) => {
                    const itemIndex = (currentPage - 1) * itemsPerPage + idx + 1;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        {/* 1. No */}
                        <td className="border border-slate-300 py-1.5 px-0.5 text-center font-mono text-[11px] font-semibold text-slate-600 align-middle">
                          {itemIndex}
                        </td>

                        {/* 2. TANGGAL */}
                        <td className="border border-slate-300 py-1.5 px-1.5 text-center text-slate-700 text-[11px] font-medium align-middle whitespace-normal break-words leading-tight">
                          {formatTanggalSingkat(item.date)}
                        </td>

                        {/* 3. PENERIMA (Wrap Teks jika melebihi kotak) */}
                        <td className="border border-slate-300 py-1.5 px-2 font-bold text-slate-900 text-xs align-middle">
                          <div className="whitespace-normal break-words leading-tight" title={item.recipient}>
                            {item.recipient}
                          </div>
                        </td>

                        {/* 4. KATEGORI BELANJA (Wrap Teks jika melebihi kotak) */}
                        <td className="border border-slate-300 py-1.5 px-2 text-center align-middle">
                          <div className="whitespace-normal break-words leading-tight font-semibold text-slate-800 text-[11px]" title={item.category}>
                            {item.category}
                          </div>
                        </td>

                        {/* 5. STATUS BUKTI */}
                        <td className="border border-slate-300 py-1.5 px-1.5 text-center align-middle whitespace-nowrap">
                          {item.receiptImage ? (
                            <div
                              onClick={() => setBkkExpense(item)}
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-[10px] cursor-pointer hover:bg-emerald-100 transition-colors"
                              title="Klik untuk melihat bukti belanja"
                            >
                              <img
                                src={item.receiptImage}
                                alt="Bukti"
                                className="w-3.5 h-3.5 object-cover rounded border border-emerald-300 shrink-0"
                              />
                              <span>Ada Bukti</span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-500 font-semibold text-[10px]">
                              Tanpa Bukti
                            </span>
                          )}
                        </td>

                        {/* 6. NOMINAL (Rp) */}
                        <td className="border border-slate-300 py-1.5 px-2 text-right font-mono tabular-nums font-bold text-rose-600 text-xs bg-rose-50/20 align-middle whitespace-nowrap">
                          {formatRupiah(item.amount)}
                        </td>

                        {/* 7. KEPERLUAN (Wrap Teks jika melebihi kotak) */}
                        <td className="border border-slate-300 py-1.5 px-2 text-slate-800 text-[11px] align-middle">
                          <div className="whitespace-normal break-words leading-tight" title={item.description || '-'}>
                            {item.description || '-'}
                          </div>
                        </td>

                        {/* 8. AKSI */}
                        <td className="border border-slate-300 py-1.5 px-0.5 text-center align-middle whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setBkkExpense(item)}
                              className="p-1 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="Cetak Bukti Kas Keluar (BKK)"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingExpense(item);
                                setIsFormOpen(true);
                              }}
                              className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                              title="Ubah Data"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id, item.recipient)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="Hapus Data"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Empty filler rows to preserve the fixed 1-page worksheet look */}
                  {Array.from({ length: Math.max(0, itemsPerPage - paginatedExpenses.length) }).map((_, emptyIdx) => (
                    <tr
                      key={`empty-${emptyIdx}`}
                      className="h-[36px] bg-slate-50/20 select-none pointer-events-none"
                    >
                      <td className="border border-slate-200 py-1 px-0.5 text-center font-mono text-[10px] text-slate-300">
                        {(currentPage - 1) * itemsPerPage + paginatedExpenses.length + emptyIdx + 1}
                      </td>
                      <td className="border border-slate-200 py-1 px-1.5 text-center text-slate-200 text-xs">-</td>
                      <td className="border border-slate-200 py-1 px-2 text-slate-200 text-xs">-</td>
                      <td className="border border-slate-200 py-1 px-2 text-center text-slate-200 text-xs">-</td>
                      <td className="border border-slate-200 py-1 px-1.5 text-center text-slate-200 text-xs">-</td>
                      <td className="border border-slate-200 py-1 px-2 text-right text-slate-200 text-xs">-</td>
                      <td className="border border-slate-200 py-1 px-2 text-slate-200 text-xs">-</td>
                      <td className="border border-slate-200 py-1 px-0.5 text-center text-slate-200 text-xs">-</td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>

            {/* Table Footer with Summary */}
            {paginatedExpenses.length > 0 && (
              <tfoot>
                <tr className="bg-slate-900 border-t-2 border-slate-700 text-slate-100 font-extrabold text-[10px] sm:text-[11px] h-[32px]">
                  <td colSpan={5} className="border border-slate-700 py-1.5 px-2 text-right uppercase tracking-wider font-bold truncate text-slate-300">
                    TOTAL KESELURUHAN PENGELUARAN:
                  </td>
                  <td className="border border-slate-700 py-1.5 px-2 text-right font-mono tabular-nums text-xs font-black text-rose-400 bg-slate-800/80 whitespace-nowrap">
                    {formatRupiah(totalFiltered)}
                  </td>
                  <td colSpan={2} className="border border-slate-700 py-1.5 px-2 text-center text-[10px] text-slate-300 font-bold truncate">
                    {filteredExpenses.length} Transaksi
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Automatic Pagination Footer */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredExpenses.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          label="pengeluaran"
        />
      </div>

      {/* Form Modal */}
      <ExpenseFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingExpense(null);
        }}
        editExpense={editingExpense}
      />

      {/* Bukti Kas Keluar Modal */}
      <BuktiKasKeluarModal
        expense={bkkExpense}
        onClose={() => {
          setBkkExpense(null);
          if (onClearInitialSelected) onClearInitialSelected();
        }}
      />
    </div>
  );
};
