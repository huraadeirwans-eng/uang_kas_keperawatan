import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Plus,
  Search,
  FileSpreadsheet,
  RotateCcw,
  Receipt,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useKas } from '../../context/KasContext';
import { Income } from '../../types';
import {
  exportToCSV,
  formatRupiah,
  formatTanggalSingkat,
} from '../../utils/formatters';
import { IncomeFormModal } from './IncomeFormModal';
import { KuitansiModal } from './KuitansiModal';
import { Pagination } from '../Pagination';
import { useAutoPageSize } from '../../hooks/useAutoPageSize';

interface PendapatanViewProps {
  initialSelectedId?: string | null;
  onClearInitialSelected?: () => void;
}

const BULAN_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

// 11 Proporsi Kolom yang tepat 100% lebar tanpa scroll kiri-kanan
export const PENDAPATAN_COLUMNS = [
  { id: 'no', label: 'No', width: '4%' },
  { id: 'name', label: 'Nama Lengkap', width: '17%' },
  { id: 'date', label: 'Tgl Bayar', width: '9%' },
  { id: 'period', label: 'Periode', width: '9%' },
  { id: 'year', label: 'Tahun', width: '5%' },
  { id: 'source', label: 'Sumber Penerimaan', width: '13%' },
  { id: 'method', label: 'Metode', width: '8%' },
  { id: 'amount', label: 'Nominal (Rp)', width: '12%' },
  { id: 'status', label: 'Status', width: '8%' },
  { id: 'action', label: 'Aksi', width: '7%' },
  { id: 'notes', label: 'Keterangan', width: '8%' },
] as const;

export const PendapatanView: React.FC<PendapatanViewProps> = ({
  initialSelectedId,
  onClearInitialSelected,
}) => {
  const { incomes, deleteIncome } = useKas();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Dynamic automatic page size:
  // Garansi fix 1 lembar kerja (Maksimal 1 Halaman Kerja), tanpa skrol vertikal maupun horizontal.
  // Jika baris data melebihi 1 halaman, otomatis mengalir ke halaman 2, 3, dst.
  const { containerRef, pageSize: itemsPerPage } = useAutoPageSize(44, 5, 85);
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [receiptIncome, setReceiptIncome] = useState<Income | null>(() => {
    if (initialSelectedId) {
      return incomes.find((i) => i.id === initialSelectedId) || null;
    }
    return null;
  });

  // Helper to extract Indonesian Month Name from date
  const getBulan = (item: Income) => {
    if (item.period) return item.period;
    try {
      const parts = item.date.split('-');
      if (parts.length >= 2) {
        const idx = parseInt(parts[1], 10) - 1;
        return BULAN_NAMES[idx] || 'Oktober';
      }
    } catch (e) {
      // fallback
    }
    return 'Oktober';
  };

  // Helper to extract Year from date
  const getTahun = (item: Income) => {
    if (item.year) return item.year;
    try {
      const parts = item.date.split('-');
      return parts[0] || '2026';
    } catch (e) {
      // fallback
    }
    return '2026';
  };

  // Helper to extract Sumber Penerimaan
  const getSumberPenerimaan = (item: Income) => {
    return item.acceptanceSource || item.category || 'Iuran Anggota';
  };

  // Unique available years
  const availableYears = useMemo(() => {
    const years = new Set<string>(['2025', '2026', '2027', '2028']);
    incomes.forEach((i) => {
      const y = getTahun(i);
      if (y) years.add(y);
    });
    return Array.from(years).sort();
  }, [incomes]);

  const filteredIncomes = useMemo(() => {
    return incomes.filter((item) => {
      const p = getBulan(item);
      const y = getTahun(item);
      const src = getSumberPenerimaan(item);

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          item.source.toLowerCase().includes(q) ||
          item.date.includes(q) ||
          p.toLowerCase().includes(q) ||
          y.includes(q) ||
          src.toLowerCase().includes(q) ||
          item.paymentMethod.toLowerCase().includes(q) ||
          (item.notes && item.notes.toLowerCase().includes(q)) ||
          item.code.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Periode Filter
      if (selectedPeriod !== 'ALL' && p !== selectedPeriod) {
        return false;
      }

      // Tahun Filter
      if (selectedYear !== 'ALL' && y !== selectedYear) {
        return false;
      }

      // Status Filter (Belum Lunas includes 'Tertunda')
      if (selectedStatus !== 'ALL') {
        if (selectedStatus === 'Belum Lunas') {
          if (item.status !== 'Belum Lunas' && item.status !== 'Tertunda') {
            return false;
          }
        } else if (item.status !== selectedStatus) {
          return false;
        }
      }

      return true;
    });
  }, [incomes, searchQuery, selectedPeriod, selectedYear, selectedStatus]);

  // Reset page when filters or items per page change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedPeriod, selectedYear, selectedStatus, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(filteredIncomes.length / itemsPerPage));

  // Ensure current page does not exceed totalPages
  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedIncomes = filteredIncomes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalFiltered = filteredIncomes
    .filter((i) => i.status === 'Lunas')
    .reduce((sum, item) => sum + item.amount, 0);

  const totalPending = filteredIncomes
    .filter((i) => i.status === 'Tertunda')
    .reduce((sum, item) => sum + item.amount, 0);

  const pageSubtotal = paginatedIncomes
    .filter((i) => i.status === 'Lunas')
    .reduce((sum, item) => sum + item.amount, 0);

  const hasActiveFilters =
    searchQuery !== '' ||
    selectedPeriod !== 'ALL' ||
    selectedYear !== 'ALL' ||
    selectedStatus !== 'ALL';

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedPeriod('ALL');
    setSelectedYear('ALL');
    setSelectedStatus('ALL');
  };

  const handleExportCSV = () => {
    const header = [
      'No',
      'Nama Lengkap',
      'Tanggal Pembayaran',
      'Periode Pembayaran',
      'Tahun',
      'Sumber Penerimaan',
      'Metode Pembayaran',
      'Nominal',
      'Status Pembayaran',
      'Keterangan',
    ];

    const rows = filteredIncomes.map((item, idx) => [
      idx + 1,
      item.source,
      item.date,
      getBulan(item),
      getTahun(item),
      getSumberPenerimaan(item),
      item.paymentMethod,
      item.amount,
      item.status,
      item.notes || '-',
    ]);

    exportToCSV(
      `daftar_pendapatan_kas_${new Date().toISOString().split('T')[0]}.csv`,
      [header, ...rows]
    );
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus data pembayaran dari "${name}"?`)) {
      deleteIncome(id);
    }
  };

  return (
    <div className="h-full flex flex-col justify-between space-y-2 overflow-hidden">
      {/* Top Stat Overview & Quick Actions (shrink-0) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 shrink-0">
        <div className="bg-white border border-slate-200/90 border-t-2 border-t-emerald-600 rounded-xl px-3.5 py-2 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Iuran Lunas
            </span>
            <div className="text-base sm:text-lg font-black font-mono tabular-nums text-emerald-800 tracking-tight">
              {formatRupiah(totalFiltered)}
            </div>
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-sm">
            {filteredIncomes.filter((i) => i.status === 'Lunas').length} Diterima
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 border-t-2 border-t-amber-500 rounded-xl px-3.5 py-2 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Iuran Tertunda
            </span>
            <div className="text-base sm:text-lg font-black font-mono tabular-nums text-amber-700 tracking-tight">
              {formatRupiah(totalPending)}
            </div>
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-0.5 rounded-sm">
            {filteredIncomes.filter((i) => i.status === 'Tertunda').length} Pending
          </span>
        </div>

        <div className="bg-white border border-slate-200/90 border-t-2 border-t-slate-800 rounded-xl px-3.5 py-2 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block truncate">
              Catat Iuran Masuk
            </span>
            <span className="text-xs font-semibold text-slate-700 truncate">
              Entri Penerimaan & CSV
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                setEditingIncome(null);
                setIsFormOpen(true);
              }}
              className="p-2 text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-all shadow-xs cursor-pointer flex items-center justify-center hover:shadow-sm"
              title="Catat Iuran Masuk (Tambah Pembayaran)"
              aria-label="Catat Iuran Masuk"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={handleExportCSV}
              className="p-2 text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
              title="Unduh File CSV"
              aria-label="Unduh File CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar (shrink-0) */}
      <div className="bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 shadow-2xs shrink-0">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Search */}
            <div className="relative col-span-2 sm:col-span-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Cari nama, sumber..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-2 py-1 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            {/* Filter Periode */}
            <div>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full text-xs px-2 py-1 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden bg-white"
              >
                <option value="ALL">Semua Periode</option>
                {BULAN_NAMES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Tahun */}
            <div>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full text-xs px-2 py-1 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden bg-white"
              >
                <option value="ALL">Semua Tahun</option>
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Status */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full text-xs px-2 py-1 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden bg-white"
              >
                <option value="ALL">Semua Status</option>
                <option value="Lunas">Lunas</option>
                <option value="Belum Lunas">Belum Lunas</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 text-[11px] shrink-0">
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 font-semibold px-2 py-0.5 rounded hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
            <span className="text-slate-500 font-semibold">
              Total {filteredIncomes.length} Data
            </span>
          </div>
        </div>
      </div>

      {/* LEMBAR KERJA TABEL PENDAPATAN - FIX 1 HALAMAN KERJA, TANPA SKROL KIRI / KANAN */}
      <div className="flex-1 min-h-0 bg-white border border-slate-300 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between overflow-hidden">
        {/* Worksheet Table Container: overflow-hidden strictly guarantees NO horizontal or vertical scrollbars */}
        <div ref={containerRef} className="flex-1 min-h-0 overflow-hidden w-full">
          <table className="w-full table-fixed text-left text-xs border-collapse">
            <thead>
              {/* Title Header across all 11 columns */}
              <tr className="bg-slate-900 text-white border-b border-slate-700">
                <th
                  colSpan={11}
                  className="border border-slate-700 py-2 px-3 text-center align-middle bg-slate-900 font-black text-xs sm:text-sm tracking-wide uppercase text-white truncate select-none leading-tight"
                >
                  DAFTAR PENDAPATAN KAS STRUKTURAL NURSING
                </th>
              </tr>
              {/* 11 COLUMNS PRECISELY PROPORTIONED TO FIT 100% WIDTH - SEMUA JUDUL TABEL CENTER */}
              <tr className="bg-slate-800 text-slate-100 font-black text-[10px] sm:text-[11px] border-b-2 border-slate-700 select-none text-center">
                <th style={{ width: '4%' }} className="border border-slate-700 py-1.5 px-0.5 text-center align-middle bg-slate-800 text-slate-200 whitespace-normal break-words leading-tight">
                  No
                </th>
                <th style={{ width: '17%' }} className="border border-slate-700 py-1.5 px-2 text-center align-middle bg-slate-800 text-slate-200 whitespace-normal break-words leading-tight">
                  Nama Lengkap
                </th>
                <th style={{ width: '9%' }} className="border border-slate-700 py-1.5 px-1 text-center align-middle bg-slate-800 text-slate-200 whitespace-normal break-words leading-tight">
                  Tgl Bayar
                </th>
                <th style={{ width: '9%' }} className="border border-slate-700 py-1.5 px-1 text-center align-middle bg-slate-800 text-slate-200 whitespace-normal break-words leading-tight">
                  Periode
                </th>
                <th style={{ width: '5%' }} className="border border-slate-700 py-1.5 px-0.5 text-center align-middle bg-slate-800 text-slate-200 whitespace-normal break-words leading-tight">
                  Tahun
                </th>
                <th style={{ width: '13%' }} className="border border-slate-700 py-1.5 px-1.5 text-center align-middle bg-slate-800 text-slate-200 whitespace-normal break-words leading-tight">
                  Sumber Penerimaan
                </th>
                <th style={{ width: '8%' }} className="border border-slate-700 py-1.5 px-1 text-center align-middle bg-slate-800 text-slate-200 whitespace-normal break-words leading-tight">
                  Metode
                </th>
                <th style={{ width: '12%' }} className="border border-slate-700 py-1.5 px-2 text-center align-middle bg-slate-800 text-slate-200 whitespace-normal break-words leading-tight">
                  Nominal (Rp)
                </th>
                <th style={{ width: '8%' }} className="border border-slate-700 py-1.5 px-1 text-center align-middle bg-slate-800 text-slate-200 whitespace-normal break-words leading-tight">
                  Status
                </th>
                <th style={{ width: '7%' }} className="border border-slate-700 py-1.5 px-0.5 text-center align-middle bg-slate-800 text-slate-200 whitespace-normal break-words leading-tight">
                  Aksi
                </th>
                <th style={{ width: '8%' }} className="border border-slate-700 py-1.5 px-2 text-center align-middle bg-slate-800 text-slate-200 whitespace-normal break-words leading-tight">
                  Keterangan
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {paginatedIncomes.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-10 text-center text-slate-400 border border-slate-300">
                    <p className="font-semibold text-xs text-slate-600">
                      Tidak ada data pembayaran dalam daftar
                    </p>
                    <p className="text-[11px] mt-0.5">
                      Gunakan tombol "+ Catat Iuran Masuk" untuk menambahkan data baru.
                    </p>
                  </td>
                </tr>
              ) : (
                <>
                  {paginatedIncomes.map((item, idx) => {
                    const itemIndex = (currentPage - 1) * itemsPerPage + idx + 1;
                    const periode = getBulan(item);
                    const tahun = getTahun(item);
                    const sumberPenerimaan = getSumberPenerimaan(item);

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        {/* 1. No */}
                        <td className="border border-slate-300 py-1.5 px-0.5 text-center font-mono text-[11px] font-semibold text-slate-600 align-middle">
                          {itemIndex}
                        </td>

                        {/* 2. Nama Lengkap (Wrap Teks jika melebihi kotak) */}
                        <td className="border border-slate-300 py-1.5 px-2 font-bold text-slate-900 text-xs align-middle">
                          <div className="whitespace-normal break-words leading-tight" title={item.source}>
                            {item.source}
                          </div>
                        </td>

                        {/* 3. Tanggal Pembayaran */}
                        <td className="border border-slate-300 py-1.5 px-1 text-center text-slate-700 text-[11px] font-medium align-middle whitespace-normal break-words leading-tight">
                          {formatTanggalSingkat(item.date)}
                        </td>

                        {/* 4. Periode Pembayaran */}
                        <td className="border border-slate-300 py-1.5 px-1 text-center text-slate-800 text-[11px] font-semibold align-middle whitespace-normal break-words leading-tight">
                          {periode}
                        </td>

                        {/* 5. Tahun */}
                        <td className="border border-slate-300 py-1.5 px-0.5 text-center font-mono text-slate-800 text-[11px] align-middle">
                          {tahun}
                        </td>

                        {/* 6. Sumber Penerimaan (Wrap Teks jika melebihi kotak) */}
                        <td className="border border-slate-300 py-1.5 px-1.5 text-slate-800 text-[11px] align-middle">
                          <div className="whitespace-normal break-words leading-tight" title={sumberPenerimaan}>
                            {sumberPenerimaan}
                          </div>
                        </td>

                        {/* 7. Metode Pembayaran */}
                        <td className="border border-slate-300 py-1.5 px-1 text-center text-slate-700 text-[11px] align-middle whitespace-normal break-words leading-tight">
                          {item.paymentMethod}
                        </td>

                        {/* 8. Nominal */}
                        <td className="border border-slate-300 py-1.5 px-2 text-right font-mono tabular-nums font-bold text-emerald-800 text-xs bg-emerald-50/20 align-middle whitespace-nowrap">
                          {formatRupiah(item.amount)}
                        </td>

                        {/* 9. Status Pembayaran */}
                        <td className="border border-slate-300 py-1.5 px-1 text-center align-middle">
                          <div className="flex items-center justify-center w-full min-w-0">
                            {item.status === 'Lunas' ? (
                              <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-extrabold text-[9px] border border-emerald-300 uppercase tracking-tight">
                                Lunas
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center px-1 py-0.5 rounded bg-amber-100 text-amber-800 font-extrabold text-[9px] border border-amber-300 uppercase tracking-tight">
                                Belum Lunas
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 10. Aksi */}
                        <td className="border border-slate-300 py-1.5 px-0.5 text-center align-middle whitespace-nowrap">
                          <div className="flex items-center justify-center gap-0.5">
                            <button
                              onClick={() => setReceiptIncome(item)}
                              className="p-1 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                              title="Cetak Kuitansi"
                            >
                              <Receipt className="w-3.5 h-3.5 text-emerald-700" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingIncome(item);
                                setIsFormOpen(true);
                              }}
                              className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                              title="Ubah Data"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id, item.source)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="Hapus Data"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>

                        {/* 11. Keterangan (Wrap Teks jika melebihi kotak) */}
                        <td className="border border-slate-300 py-1.5 px-2 text-slate-600 text-[11px] align-middle">
                          <div className="whitespace-normal break-words leading-tight" title={item.notes || '-'}>
                            {item.notes || '-'}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Empty filler rows to preserve the fixed 1-page worksheet look */}
                  {Array.from({ length: Math.max(0, itemsPerPage - paginatedIncomes.length) }).map((_, emptyIdx) => (
                    <tr
                      key={`empty-${emptyIdx}`}
                      className="h-[36px] bg-slate-50/20 select-none pointer-events-none"
                    >
                      <td className="border border-slate-200 py-1 px-0.5 text-center font-mono text-[10px] text-slate-300">
                        {(currentPage - 1) * itemsPerPage + paginatedIncomes.length + emptyIdx + 1}
                      </td>
                      <td className="border border-slate-200 py-1 px-2 text-slate-300 text-[11px] italic">-</td>
                      <td className="border border-slate-200 py-1 px-1"></td>
                      <td className="border border-slate-200 py-1 px-1"></td>
                      <td className="border border-slate-200 py-1 px-0.5"></td>
                      <td className="border border-slate-200 py-1 px-1.5"></td>
                      <td className="border border-slate-200 py-1 px-1"></td>
                      <td className="border border-slate-200 py-1 px-2"></td>
                      <td className="border border-slate-200 py-1 px-1"></td>
                      <td className="border border-slate-200 py-1 px-0.5"></td>
                      <td className="border border-slate-200 py-1 px-2"></td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>

            {/* Table Footer with Subtotal & Total */}
            {paginatedIncomes.length > 0 && (
              <tfoot>
                <tr className="bg-slate-900 border-t-2 border-slate-700 text-slate-100 font-extrabold text-[10px] sm:text-[11px] h-[32px] max-h-[32px]">
                  <td colSpan={7} className="border border-slate-700 py-1 px-2 text-right uppercase tracking-wider truncate text-slate-300">
                    Total Halaman Ini: <span className="text-emerald-400 font-bold">{formatRupiah(pageSubtotal)}</span> · TOTAL KESELURUHAN LUNAS:
                  </td>
                  <td className="border border-slate-700 py-1 px-2 text-right font-mono tabular-nums text-xs font-black text-emerald-400 bg-slate-800/80 whitespace-nowrap truncate">
                    {formatRupiah(totalFiltered)}
                  </td>
                  <td colSpan={3} className="border border-slate-700 py-1 px-2 text-center text-[10px] text-slate-300 font-bold truncate">
                    {filteredIncomes.filter((i) => i.status === 'Lunas').length} Transaksi Lunas
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Clean Pagination Footer with explicit Page Badge */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredIncomes.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          label="pembayaran"
          showPageBadge={true}
          showPageSizeSelector={false}
        />
      </div>

      {/* Form Modal */}
      <IncomeFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingIncome(null);
        }}
        editIncome={editingIncome}
      />

      {/* Kuitansi Modal */}
      <KuitansiModal
        income={receiptIncome}
        onClose={() => {
          setReceiptIncome(null);
          if (onClearInitialSelected) onClearInitialSelected();
        }}
      />
    </div>
  );
};
