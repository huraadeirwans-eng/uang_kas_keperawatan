import React, { useState, useMemo, useEffect } from 'react';
import {
  Receipt,
  Upload,
  Search,
  Eye,
  Download,
  Printer,
  Plus,
  X,
  LayoutGrid,
  List,
} from 'lucide-react';
import { useKas } from '../../context/KasContext';
import { Expense } from '../../types';
import {
  formatRupiah,
  formatTanggalIndo,
  formatTanggalSingkat,
} from '../../utils/formatters';
import { BuktiKasKeluarModal } from '../Pengeluaran/BuktiKasKeluarModal';
import { ExpenseFormModal } from '../Pengeluaran/ExpenseFormModal';
import { Pagination } from '../Pagination';
import { useAutoPageSize } from '../../hooks/useAutoPageSize';
import { useResizableColumns } from '../../hooks/useResizableColumns';
import { compressImageFile } from '../../utils/imageCompressor';

const BUKTI_COLUMN_CONFIG = [
  { id: 'photo', defaultWidth: 60, minWidth: 45 },
  { id: 'date', defaultWidth: 90, minWidth: 65 },
  { id: 'code', defaultWidth: 90, minWidth: 60 },
  { id: 'recipient', defaultWidth: 160, minWidth: 75 },
  { id: 'category', defaultWidth: 200, minWidth: 80 },
  { id: 'amount', defaultWidth: 115, minWidth: 75 },
  { id: 'action', defaultWidth: 80, minWidth: 60 },
];

export const BuktiPengeluaranView: React.FC = () => {
  const { expenses, updateExpense } = useKas();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'WITH_IMAGE' | 'NO_IMAGE'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Resizable columns hook (persisted to localStorage)
  const {
    widths: colWidths,
    ResizeHandle,
    resetAllWidths: resetColWidths,
    hasCustomWidths,
    totalTableWidth,
  } = useResizableColumns('bukti_pengeluaran', BUKTI_COLUMN_CONFIG);

  // Dynamic pagination so table and grid completely fill the worksheet before moving to next page
  const { containerRef: tableContainerRef, pageSize: dynamicTablePageSize } = useAutoPageSize(44, 10);
  const itemsPerPage = viewMode === 'grid' ? 12 : dynamicTablePageSize;
  const [currentPage, setCurrentPage] = useState(1);

  // Preview Lightbox
  const [lightboxExpense, setLightboxExpense] = useState<Expense | null>(null);
  const [bkkExpense, setBkkExpense] = useState<Expense | null>(null);

  // Upload modal for attaching image to an existing expense without image
  const [attachingExpense, setAttachingExpense] = useState<Expense | null>(null);
  const [uploadDataUrl, setUploadDataUrl] = useState('');
  const [uploadNote, setUploadNote] = useState('');

  // Add new expense modal
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          e.code.toLowerCase().includes(q) ||
          e.recipient.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          (e.receiptNote && e.receiptNote.toLowerCase().includes(q));
        if (!match) return false;
      }

      if (filterType === 'WITH_IMAGE' && !e.receiptImage) return false;
      if (filterType === 'NO_IMAGE' && e.receiptImage) return false;

      if (selectedCategory !== 'ALL' && e.category !== selectedCategory) return false;

      return true;
    });
  }, [expenses, searchQuery, filterType, selectedCategory]);

  // Reset page when filter or viewMode changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType, selectedCategory, viewMode]);

  const paginatedExpenses = filteredExpenses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const withImageCount = expenses.filter((e) => !!e.receiptImage).length;
  const noImageCount = expenses.filter((e) => !e.receiptImage).length;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImageFile(file, 1200, 1200, 0.75);
      setUploadDataUrl(compressed);
      setUploadNote(`Bukti ${file.name}`);
    } catch (err) {
      console.error('Compression failed', err);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadDataUrl(event.target.result as string);
          setUploadNote(`Bukti ${file.name}`);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAttachment = () => {
    if (!attachingExpense || !uploadDataUrl) return;

    updateExpense(attachingExpense.id, {
      receiptImage: uploadDataUrl,
      receiptNote: uploadNote || 'Nota Pembayaran',
    });

    setAttachingExpense(null);
    setUploadDataUrl('');
    setUploadNote('');
  };

  return (
    <div className="h-full flex flex-col justify-between space-y-2.5 sm:space-y-3 overflow-hidden">
      {/* Top Banner & Stats - Compact for 1-screen viewport */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 shrink-0">
        <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Nota Tersimpan
            </span>
            <div className="text-xl font-extrabold font-mono tabular-nums text-emerald-700 tracking-tight">
              {withImageCount} Nota
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Terverifikasi foto fisik
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Receipt className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Tanpa Foto Nota
            </span>
            <div className="text-xl font-extrabold font-mono tabular-nums text-amber-600 tracking-tight">
              {noImageCount} Transaksi
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Perlu lampiran SPJ
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Upload className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-xl p-2.5 shadow-2xs flex items-center justify-between gap-2">
          <div className="hidden sm:block">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Kas Keluar Baru
            </span>
            <div className="text-xs font-semibold text-slate-700">Lampirkan Nota</div>
          </div>
          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Catat Nota Baru</span>
          </button>
        </div>
      </div>

      {/* Filter and View Mode Toolbar - Compact single row */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-2.5 sm:p-3 shadow-2xs space-y-2 shrink-0">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Cari toko, uraian, no nota..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Segmented Filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  filterType === 'ALL'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({expenses.length})
              </button>
              <button
                onClick={() => setFilterType('WITH_IMAGE')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  filterType === 'WITH_IMAGE'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ada Foto ({withImageCount})
              </button>
              <button
                onClick={() => setFilterType('NO_IMAGE')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  filterType === 'NO_IMAGE'
                    ? 'bg-white text-amber-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tanpa Foto ({noImageCount})
              </button>
            </div>

            {/* View Mode Toggle (Grid vs Table) */}
            <div className="flex items-center gap-1.5">
              {viewMode === 'table' && hasCustomWidths && (
                <button
                  onClick={resetColWidths}
                  className="text-blue-600 hover:text-blue-800 text-[10px] font-semibold underline px-1 cursor-pointer"
                  title="Kembalikan ukuran kolom ke bawaan"
                >
                  Reset Kolom
                </button>
              )}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Tampilan Kotak Kecil (Grid)"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Tampilan Tabel Kompak"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace: 1-Screen Container with AUTOMATIC PAGINATION */}
      <div className="flex-1 min-h-0 bg-white border border-slate-200/90 rounded-xl shadow-2xs flex flex-col justify-between overflow-hidden">
        {/* COMPACT VIEW MODE 1: Small Compact Grid (Kotak Diperkecil & Fits 1-Screen) */}
        {viewMode === 'grid' && (
          <div className="flex-1 p-2.5 sm:p-3 overflow-hidden">
            {paginatedExpenses.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-10 text-center">
                <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                <h3 className="font-semibold text-slate-700 text-xs">
                  Tidak ada bukti pengeluaran yang sesuai
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Coba sesuaikan kata kunci pencarian atau filter status nota.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 h-full auto-rows-fr">
                {paginatedExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="bg-slate-50/70 border border-slate-200 rounded-lg overflow-hidden shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between group"
                  >
                    {/* Small Compact Image / Placeholder box */}
                    <div className="relative h-20 sm:h-22 bg-slate-100 flex items-center justify-center overflow-hidden border-b border-slate-100 shrink-0">
                      {exp.receiptImage ? (
                        <>
                          <img
                            src={exp.receiptImage}
                            alt={exp.receiptNote || 'Bukti Pengeluaran'}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                            onClick={() => setLightboxExpense(exp)}
                          />
                          <div
                            onClick={() => setLightboxExpense(exp)}
                            className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                          >
                            <span className="bg-slate-900/80 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded backdrop-blur-xs flex items-center gap-1 shadow-sm">
                              <Eye className="w-2.5 h-2.5" />
                              <span>Lihat</span>
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="p-2 text-center space-y-0.5">
                          <Receipt className="w-5 h-5 text-slate-300 mx-auto" />
                          <p className="text-[9px] text-slate-400 font-medium">Tanpa Foto</p>
                          <button
                            onClick={() => {
                              setAttachingExpense(exp);
                              setUploadDataUrl('');
                              setUploadNote('');
                            }}
                            className="text-[9px] px-1.5 py-0.5 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded font-semibold inline-flex items-center gap-0.5"
                          >
                            <Upload className="w-2.5 h-2.5" />
                            <span>Upload</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Compact Content */}
                    <div className="p-2 space-y-0.5 flex-1 flex flex-col justify-between min-h-0">
                      <div>
                        <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
                          <span>{exp.code}</span>
                          <span>{formatTanggalSingkat(exp.date)}</span>
                        </div>

                        <h4 className="font-bold text-slate-900 text-[11px] truncate" title={exp.recipient}>
                          {exp.recipient}
                        </h4>

                        <p className="text-[10px] text-slate-500 truncate" title={exp.description || exp.category}>
                          {exp.description || exp.category}
                        </p>
                      </div>

                      <div className="pt-1 border-t border-slate-200/60 flex items-center justify-between mt-0.5">
                        <span className="font-mono tabular-nums font-bold text-rose-600 text-xs">
                          {formatRupiah(exp.amount)}
                        </span>

                        <button
                          onClick={() => setBkkExpense(exp)}
                          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded transition-colors"
                          title="Cetak Formulir BKK"
                        >
                          <Printer className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* COMPACT VIEW MODE 2: Clean Table with Small Thumbnails & Resizable Columns */}
        {viewMode === 'table' && (
          <div ref={tableContainerRef} className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden">
            <table
              className="w-full table-fixed text-left text-xs border-collapse"
              style={{ width: hasCustomWidths ? `${totalTableWidth}px` : '100%', minWidth: '100%' }}
            >
              <thead>
                {/* Title Header across all 7 columns */}
                <tr className="bg-slate-100 text-slate-900 border-b border-slate-800">
                  <th
                    colSpan={7}
                    className="border border-slate-800 py-1.5 px-3 text-center align-middle bg-slate-100 font-black text-xs sm:text-sm tracking-wide uppercase text-slate-900 whitespace-normal break-words leading-snug select-none"
                  >
                    ARSIP BUKTI PENGELUARAN & NOTA STRUKTURAL NURSING
                  </th>
                </tr>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[10px] select-none">
                  {/* Foto */}
                  <th
                    style={{ width: `${colWidths['photo'] || 60}px` }}
                    className="relative py-2.5 px-2 text-center align-middle border-r border-slate-200/80 bg-slate-50/80"
                  >
                    <div className="w-full text-center whitespace-normal break-words leading-tight">Foto</div>
                    <ResizeHandle columnId="photo" />
                  </th>

                  {/* Tanggal */}
                  <th
                    style={{ width: `${colWidths['date'] || 90}px` }}
                    className="relative py-2.5 px-2.5 text-center align-middle border-r border-slate-200/80 bg-slate-50/80"
                  >
                    <div className="w-full text-center whitespace-normal break-words leading-tight">Tanggal</div>
                    <ResizeHandle columnId="date" />
                  </th>

                  {/* No. BKK */}
                  <th
                    style={{ width: `${colWidths['code'] || 90}px` }}
                    className="relative py-2.5 px-2.5 text-center align-middle border-r border-slate-200/80 bg-slate-50/80"
                  >
                    <div className="w-full text-center whitespace-normal break-words leading-tight font-mono">No. BKK</div>
                    <ResizeHandle columnId="code" />
                  </th>

                  {/* Penerima / Toko */}
                  <th
                    style={{ width: `${colWidths['recipient'] || 160}px` }}
                    className="relative py-2.5 px-2.5 text-center align-middle border-r border-slate-200/80 bg-slate-50/80"
                  >
                    <div className="w-full text-center whitespace-normal break-words leading-tight">Penerima / Toko</div>
                    <ResizeHandle columnId="recipient" />
                  </th>

                  {/* Kategori & Keterangan */}
                  <th
                    style={{ width: `${colWidths['category'] || 200}px` }}
                    className="relative py-2.5 px-2.5 text-center align-middle border-r border-slate-200/80 bg-slate-50/80"
                  >
                    <div className="w-full text-center whitespace-normal break-words leading-tight">Kategori & Keterangan</div>
                    <ResizeHandle columnId="category" />
                  </th>

                  {/* Nominal */}
                  <th
                    style={{ width: `${colWidths['amount'] || 115}px` }}
                    className="relative py-2.5 px-2.5 text-center align-middle border-r border-slate-200/80 bg-slate-50/80"
                  >
                    <div className="w-full text-center whitespace-normal break-words leading-tight">Nominal (Rp)</div>
                    <ResizeHandle columnId="amount" />
                  </th>

                  {/* Aksi */}
                  <th
                    style={{ width: `${colWidths['action'] || 80}px` }}
                    className="relative py-2.5 px-2 text-center align-middle bg-slate-50/80"
                  >
                    <div className="w-full text-center whitespace-normal break-words leading-tight">Aksi</div>
                    <ResizeHandle columnId="action" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                      Tidak ada catatan bukti pengeluaran
                    </td>
                  </tr>
                ) : (
                  paginatedExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2 px-3 text-center">
                        {exp.receiptImage ? (
                          <img
                            src={exp.receiptImage}
                            alt="Bukti"
                            onClick={() => setLightboxExpense(exp)}
                            className="w-8 h-8 object-cover rounded border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity mx-auto"
                          />
                        ) : (
                          <button
                            onClick={() => {
                              setAttachingExpense(exp);
                              setUploadDataUrl('');
                              setUploadNote('');
                            }}
                            className="w-8 h-8 rounded border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors mx-auto"
                            title="Unggah Foto Bukti"
                          >
                            <Upload className="w-3 h-3" />
                          </button>
                        )}
                      </td>
                      <td className="py-2.5 sm:py-3 px-3 text-slate-600 whitespace-nowrap font-medium text-[11px]">
                        {formatTanggalSingkat(exp.date)}
                      </td>
                      <td className="py-2.5 sm:py-3 px-3 font-mono font-semibold text-slate-500 text-[11px] whitespace-nowrap">
                        {exp.code}
                      </td>
                      <td className="py-2.5 sm:py-3 px-3 font-bold text-slate-900 text-xs min-w-0">
                        <div className="whitespace-normal break-words leading-tight" title={exp.recipient}>
                          {exp.recipient}
                        </div>
                      </td>
                      <td className="py-2.5 sm:py-3 px-3 text-slate-600 text-[11px] min-w-0">
                        <div className="whitespace-normal break-words leading-tight" title={exp.description || exp.category}>
                          {exp.description || exp.category}
                        </div>
                      </td>
                      <td className="py-2.5 sm:py-3 px-3 text-right font-mono tabular-nums font-bold text-rose-600 whitespace-nowrap text-xs">
                        {formatRupiah(exp.amount)}
                      </td>
                      <td className="py-2.5 sm:py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {exp.receiptImage && (
                            <button
                              onClick={() => setLightboxExpense(exp)}
                              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                              title="Lihat Foto Nota"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={() => setBkkExpense(exp)}
                            className="px-2 py-0.5 text-[10px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded flex items-center gap-1"
                            title="Cetak Form BKK"
                          >
                            <Printer className="w-3 h-3 text-slate-500" />
                            <span>BKK</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Automatic Pagination Footer */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredExpenses.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          label="bukti nota"
        />
      </div>

      {/* Lightbox Modal for Large Image Inspection */}
      {lightboxExpense && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-800">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">
                  {lightboxExpense.recipient}
                </h3>
                <p className="text-xs text-slate-400">
                  {lightboxExpense.code} · {formatTanggalIndo(lightboxExpense.date)} · {formatRupiah(lightboxExpense.amount)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={lightboxExpense.receiptImage}
                  download={`bukti_${lightboxExpense.code}.jpg`}
                  className="px-2.5 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Foto</span>
                </a>
                <button
                  onClick={() => {
                    const target = lightboxExpense;
                    setLightboxExpense(null);
                    setBkkExpense(target);
                  }}
                  className="px-2.5 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak Form BKK</span>
                </button>
                <button
                  onClick={() => setLightboxExpense(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-950 flex items-center justify-center max-h-[65vh] overflow-auto">
              <img
                src={lightboxExpense.receiptImage}
                alt="Bukti Nota Besar"
                referrerPolicy="no-referrer"
                className="max-h-[60vh] object-contain rounded-lg shadow-lg"
              />
            </div>

            <div className="p-4 bg-white border-t border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-800">Keterangan Nota: </span>
                <span>{lightboxExpense.receiptNote || 'Nota Pembayaran Sah'}</span>
              </div>
              <div className="font-mono font-extrabold text-rose-600">
                {formatRupiah(lightboxExpense.amount)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal to Upload / Attach Receipt Image */}
      {attachingExpense && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  Unggah Bukti Nota Belanja
                </h3>
                <p className="text-xs text-slate-500">
                  {attachingExpense.recipient} ({formatRupiah(attachingExpense.amount)})
                </p>
              </div>
              <button
                onClick={() => setAttachingExpense(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pilih Berkas Foto Nota / Kwitansi
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                />
              </div>

              {uploadDataUrl && (
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-slate-600">
                    Pratinjau Bukti:
                  </div>
                  <div className="max-h-44 overflow-hidden rounded-lg border border-slate-200 flex items-center justify-center bg-slate-50">
                    <img
                      src={uploadDataUrl}
                      alt="Pratinjau Nota"
                      className="max-h-44 object-contain"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Keterangan / Nomor Nota
                    </label>
                    <input
                      type="text"
                      value={uploadNote}
                      onChange={(e) => setUploadNote(e.target.value)}
                      placeholder="Contoh: Nota No. 2145 Toko ABC"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAttachingExpense(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={!uploadDataUrl}
                  onClick={handleSaveAttachment}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl shadow-xs"
                >
                  Simpan Bukti ke Pengeluaran
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bukti Kas Keluar (BKK) Printable Voucher Modal */}
      <BuktiKasKeluarModal
        expense={bkkExpense}
        onClose={() => setBkkExpense(null)}
      />

      {/* Add new expense modal */}
      <ExpenseFormModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
      />
    </div>
  );
};
