import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Printer,
  ChevronRight,
  ChevronLeft,
  BarChart3,
  PieChart,
  Search,
  Filter,
  Plus,
  FileSpreadsheet,
  Check,
  RotateCcw,
} from 'lucide-react';
import { useKas } from '../../context/KasContext';
import {
  formatRupiah,
  formatRupiahPlain,
  formatTanggalIndo,
  formatTanggalSingkat,
  exportToCSV,
} from '../../utils/formatters';
import { useAutoPageSize } from '../../hooks/useAutoPageSize';
import { useResizableColumns } from '../../hooks/useResizableColumns';

interface DashboardViewProps {
  onOpenAddIncome?: () => void;
  onOpenAddExpense?: () => void;
  onSelectIncome: (id: string) => void;
  onSelectExpense: (id: string) => void;
}

const CHECKLIST_MONTHS = [
  'JANUARI',
  'FEBRUARI',
  'MARET',
  'APRIL',
  'MEI',
  'JUNI',
  'JULI',
  'AGUSTUS',
  'SEPTEMBER',
  'OKTOBER',
  'NOVEMBER',
  'DESEMBER',
];

const CHECKLIST_COLUMN_CONFIG = [
  { id: 'no', defaultWidth: 42, minWidth: 32 },
  { id: 'name', defaultWidth: 175, minWidth: 90 },
  { id: 'unit', defaultWidth: 140, minWidth: 70 },
  ...CHECKLIST_MONTHS.map((m) => ({ id: m, defaultWidth: 54, minWidth: 32 })),
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenAddIncome,
  onOpenAddExpense,
  onSelectIncome,
  onSelectExpense,
}) => {
  const {
    participants,
    incomes,
    expenses,
    totalIncome,
    totalExpense,
    netBalance,
    participantStats,
    setActiveMenu,
    settings,
  } = useKas();

  // DASHBOARD PAGE SYSTEM:
  // Halaman 1: Ringkasan Keuangan (4 Stat Cards + Full-height Arus Kas Chart & Pos Pengeluaran Terbesar)
  // Halaman 2: CHECKLIST LUNAS PEMBAYARAN IURAN STRUKTURAL NURSING
  const [dashboardPage, setDashboardPage] = useState<number>(1);

  // Checklist Matrix State on Page 2
  const [checklistYear, setChecklistYear] = useState<string>('2026');
  const [checklistSearch, setChecklistSearch] = useState<string>('');
  const [checklistUnitFilter, setChecklistUnitFilter] = useState<string>('ALL');
  const [checklistPage, setChecklistPage] = useState<number>(1);
  const { containerRef: checklistContainerRef, pageSize: checklistPerPage } = useAutoPageSize(36, 6, 75);

  // Resizable columns for Checklist Lunas table (persisted to localStorage)
  const {
    widths: checklistWidths,
    ResizeHandle: ChecklistResizeHandle,
    resetAllWidths: resetChecklistWidths,
    hasCustomWidths: hasCustomChecklistWidths,
    totalTableWidth: checklistTotalWidth,
  } = useResizableColumns('dashboard_checklist', CHECKLIST_COLUMN_CONFIG);

  // Selected hover month for chart details on Page 1
  const [activeChartMonth, setActiveChartMonth] = useState<string | null>(null);

  // Unique units for checklist filter
  const uniqueUnits = useMemo(() => {
    const units = new Set<string>();
    participants.forEach((p) => {
      const u = p.workUnit || p.groupOrDepartment;
      if (u) units.add(u);
    });
    return Array.from(units).sort();
  }, [participants]);

  // Check if a participant has paid for a specific month in the selected year
  const isParticipantPaid = (p: typeof participants[0], monthIndex: number, year: string) => {
    const mName = CHECKLIST_MONTHS[monthIndex];
    return incomes.some((inc) => {
      const isMatched =
        inc.participantId === p.id ||
        inc.source.trim().toLowerCase() === p.name.trim().toLowerCase();
      if (!isMatched) return false;
      if (inc.status !== 'Lunas') return false;

      const incYear = inc.year || inc.date.split('-')[0];
      if (incYear !== year) return false;

      if (inc.period) {
        return inc.period.toUpperCase() === mName;
      }

      const parts = inc.date.split('-');
      if (parts.length >= 2) {
        const idx = parseInt(parts[1], 10) - 1;
        if (idx === monthIndex) return true;
      }
      return false;
    });
  };

  // Filter participants for checklist
  const filteredChecklistParticipants = useMemo(() => {
    return participants.filter((p) => {
      const u = p.workUnit || p.groupOrDepartment || '';
      if (checklistUnitFilter !== 'ALL' && u !== checklistUnitFilter) return false;
      if (checklistSearch.trim()) {
        const q = checklistSearch.toLowerCase();
        const matches =
          p.name.toLowerCase().includes(q) ||
          u.toLowerCase().includes(q) ||
          (p.position || '').toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [participants, checklistUnitFilter, checklistSearch]);

  useEffect(() => {
    setChecklistPage(1);
  }, [checklistUnitFilter, checklistSearch, checklistYear]);

  const totalChecklistPages = Math.max(
    1,
    Math.ceil(filteredChecklistParticipants.length / checklistPerPage)
  );

  const paginatedChecklistParticipants = filteredChecklistParticipants.slice(
    (checklistPage - 1) * checklistPerPage,
    checklistPage * checklistPerPage
  );

  // Count total paid per month across filtered participants
  const monthlyPaidCounts = useMemo(() => {
    return CHECKLIST_MONTHS.map((_, mIdx) => {
      return filteredChecklistParticipants.filter((p) =>
        isParticipantPaid(p, mIdx, checklistYear)
      ).length;
    });
  }, [filteredChecklistParticipants, checklistYear, incomes]);

  const handleExportChecklistCSV = () => {
    const header = ['No', 'Nama Lengkap', 'UNIT KERJA', ...CHECKLIST_MONTHS];

    const rows = filteredChecklistParticipants.map((p, idx) => {
      const row: (string | number)[] = [
        idx + 1,
        p.name,
        p.workUnit || p.groupOrDepartment || 'Emergency Unit',
      ];
      CHECKLIST_MONTHS.forEach((_, mIdx) => {
        row.push(isParticipantPaid(p, mIdx, checklistYear) ? 'LUNAS' : '-');
      });
      return row;
    });

    exportToCSV(`checklist_lunas_iuran_struktural_nursing_${checklistYear}.csv`, [
      header,
      ...rows,
    ]);
  };

  // Group expenses by category
  const expensesByCategory = settings.categoriesExpense
    .map((cat) => {
      const total = expenses
        .filter((e) => e.category === cat && e.status === 'Selesai')
        .reduce((sum, e) => sum + e.amount, 0);
      return { category: cat, total };
    })
    .filter((c) => c.total > 0)
    .sort((a, b) => b.total - a.total);

  // Calculate monthly inflow vs outflow for current year
  const currentYear = new Date().getFullYear();
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des',
  ];
  const fullMonthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  const monthlyData = months.map((m, idx) => {
    const monthNumber = String(idx + 1).padStart(2, '0');
    const monthPrefix = `${currentYear}-${monthNumber}`;

    const incTotal = incomes
      .filter((i) => i.date.startsWith(monthPrefix) && i.status === 'Lunas')
      .reduce((s, i) => s + i.amount, 0);

    const expTotal = expenses
      .filter((e) => e.date.startsWith(monthPrefix) && e.status === 'Selesai')
      .reduce((s, e) => s + e.amount, 0);

    return {
      month: m,
      fullMonth: fullMonthNames[idx],
      monthPrefix,
      income: incTotal,
      expense: expTotal,
      net: incTotal - expTotal,
    };
  });

  const activeHoveredData = useMemo(() => {
    if (!activeChartMonth) return null;
    return monthlyData.find((d) => d.month === activeChartMonth) || null;
  }, [monthlyData, activeChartMonth]);

  const maxMonthValue = Math.max(
    ...monthlyData.map((d) => Math.max(d.income, d.expense)),
    1000000
  );

  // Helper format ringkas angka untuk ditampilkan saat diarahkan pada batang grafik
  const formatChartLabel = (val: number): string => {
    if (!val || val === 0) return '0';
    if (val >= 1_000_000_000) {
      const num = (val / 1_000_000_000).toFixed(1).replace('.0', '').replace('.', ',');
      return `${num}M`;
    }
    if (val >= 1_000_000) {
      const num = (val / 1_000_000).toFixed(1).replace('.0', '').replace('.', ',');
      return `${num}jt`;
    }
    if (val >= 1_000) {
      const num = (val / 1_000).toFixed(0);
      return `${num}rb`;
    }
    return String(val);
  };

  // Dashboard Pages: 1 (Ringkasan & Grafik) and 2 (Checklist Lunas Pembayaran)
  const pageNumbers: number[] = [1, 2];

  return (
    <div className="h-full flex flex-col justify-between overflow-hidden gap-2.5 sm:gap-3">
      {/* ========================================================
          HALAMAN 1: FULL DATA YANG DIGAMBAR (RINGKASAN & GRAFIK)
          ======================================================== */}
      {dashboardPage === 1 && (
        <div className="h-full flex flex-col justify-between overflow-hidden gap-2.5 sm:gap-3.5">
          {/* 4 Stat Cards - Executive Luxury Styling */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
            {/* Card 1: Saldo Akhir */}
            <div className="bg-white border border-slate-200/90 border-t-2 border-t-emerald-600 rounded-xl p-3.5 sm:p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  SALDO AKHIR KAS
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/60 text-emerald-700 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <div
                  className={`text-2xl sm:text-3xl font-black font-mono tabular-nums tracking-tight ${
                    netBalance >= 0 ? 'text-slate-900' : 'text-rose-600'
                  }`}
                >
                  {formatRupiah(netBalance)}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs pt-1.5 border-t border-slate-100">
                  <span className="text-slate-500 font-medium">Status Likuiditas</span>
                  <span className="font-bold text-emerald-800">Sehat & Terverifikasi</span>
                </div>
              </div>
            </div>

            {/* Card 2: Total Pendapatan */}
            <div className="bg-white border border-slate-200/90 border-t-2 border-t-emerald-500 rounded-xl p-3.5 sm:p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  TOTAL PENDAPATAN
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/60 text-emerald-700 flex items-center justify-center">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-emerald-700 tracking-tight">
                  {formatRupiah(totalIncome)}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs pt-1.5 border-t border-slate-100">
                  <span className="text-slate-500 font-medium">{incomes.length} Transaksi Diterima</span>
                  <button
                    onClick={() => setActiveMenu('pendapatan')}
                    className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer"
                  >
                    Rincian →
                  </button>
                </div>
              </div>
            </div>

            {/* Card 3: Total Pengeluaran */}
            <div className="bg-white border border-slate-200/90 border-t-2 border-t-rose-500 rounded-xl p-3.5 sm:p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  TOTAL PENGELUARAN
                </span>
                <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200/60 text-rose-600 flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-rose-600 tracking-tight">
                  {formatRupiah(totalExpense)}
                </div>
                <div className="mt-2 flex items-center justify-between text-xs pt-1.5 border-t border-slate-100">
                  <span className="text-slate-500 font-medium">{expenses.length} Transaksi Selesai</span>
                  <button
                    onClick={() => setActiveMenu('pengeluaran')}
                    className="text-rose-600 hover:text-rose-700 font-bold hover:underline cursor-pointer"
                  >
                    Rincian →
                  </button>
                </div>
              </div>
            </div>

            {/* Card 4: Total Peserta */}
            <div className="bg-white border border-slate-200/90 border-t-2 border-t-blue-500 rounded-xl p-3.5 sm:p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  TOTAL PESERTA
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200/60 text-blue-700 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <div className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-slate-900 tracking-tight">
                  {participantStats.total} Orang
                </div>
                <div className="mt-2 flex items-center justify-between text-xs pt-1.5 border-t border-slate-100">
                  <span className="text-slate-500 font-medium">Anggota Terdaftar</span>
                  <button
                    onClick={() => setActiveMenu('peserta')}
                    className="text-blue-600 hover:text-blue-700 font-bold hover:underline cursor-pointer"
                  >
                    Peserta →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Row: Arus Kas Chart & Pos Pengeluaran Terbesar (FULL TINGGI HALAMAN KERJA PERTAMA) */}
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-3.5 overflow-hidden">
            {/* Left 2 Cols: Monthly Bar Chart (Full Height) */}
            <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between overflow-hidden">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-sm tracking-tight">
                    Arus Kas Masuk vs Keluar ({currentYear})
                  </h3>
                </div>
                <div className="flex items-center gap-3.5 text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <span className="w-3 h-3 rounded-xs bg-emerald-500" />
                    Masuk
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <span className="w-3 h-3 rounded-xs bg-rose-500" />
                    Keluar
                  </span>
                </div>
              </div>

              {/* Bar chart visualization - Numbers appear smoothly upon hovering (saat kursor diarahkan) */}
              <div className="flex-1 min-h-0 flex flex-col justify-between pt-3">
                {/* Chart Grid with subtle guide lines */}
                <div className="relative flex-1 min-h-0 flex flex-col justify-end">
                  {/* Subtle horizontal dashed guide lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
                    <div className="border-b border-dashed border-slate-200 w-full" />
                    <div className="border-b border-dashed border-slate-200 w-full" />
                    <div className="border-b border-dashed border-slate-200 w-full" />
                    <div className="border-b border-slate-200 w-full" />
                  </div>

                  <div className="relative z-10 grid grid-cols-12 gap-1 sm:gap-2 h-full items-end pb-1">
                    {monthlyData.map((d, mIdx) => {
                      const incHeight = maxMonthValue > 0 ? (d.income / maxMonthValue) * 85 : 0;
                      const expHeight = maxMonthValue > 0 ? (d.expense / maxMonthValue) * 85 : 0;
                      const isHovered = activeChartMonth === d.month;

                      return (
                        <div
                          key={d.month}
                          onMouseEnter={() => setActiveChartMonth(d.month)}
                          onMouseLeave={() => setActiveChartMonth(null)}
                          className={`flex flex-col items-center h-full justify-end group relative cursor-pointer rounded-lg transition-colors py-1 ${
                            isHovered ? 'bg-slate-100/70 ring-1 ring-slate-200/80 shadow-2xs' : 'hover:bg-slate-50/50'
                          }`}
                        >
                          {/* Floating Tooltip Card with exact numbers when hovered */}
                          {isHovered && (
                            <div
                              className={`absolute -top-24 z-30 pointer-events-none bg-slate-900/95 text-white rounded-lg p-2 shadow-xl border border-slate-700/80 text-[10px] whitespace-nowrap backdrop-blur-xs min-w-[135px] ${
                                mIdx <= 2
                                  ? 'left-0'
                                  : mIdx >= 9
                                  ? 'right-0'
                                  : 'left-1/2 -translate-x-1/2'
                              }`}
                            >
                              <div className="font-extrabold text-slate-100 border-b border-slate-700 pb-1 mb-1 flex items-center justify-between">
                                <span>{d.fullMonth} {currentYear}</span>
                                <span className={`px-1 py-0.2 rounded text-[8px] font-bold ${d.net >= 0 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                                  {d.net >= 0 ? 'Surplus' : 'Defisit'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-2 text-emerald-400 font-mono">
                                <span>Masuk:</span>
                                <span className="font-bold">{formatRupiah(d.income)}</span>
                              </div>
                              <div className="flex items-center justify-between gap-2 text-rose-400 font-mono">
                                <span>Keluar:</span>
                                <span className="font-bold">{formatRupiah(d.expense)}</span>
                              </div>
                              <div className="flex items-center justify-between gap-2 text-slate-200 font-mono border-t border-slate-800 pt-0.5 mt-0.5 font-bold">
                                <span>Selisih:</span>
                                <span>{formatRupiah(d.net)}</span>
                              </div>
                            </div>
                          )}

                          {/* Side-by-side bars */}
                          <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1.5 h-full px-0.5">
                            {/* Masuk Bar Column */}
                            <div className="w-1/2 h-full flex flex-col justify-end items-center relative min-w-0">
                              {/* Hover Badge with compact number */}
                              {isHovered && d.income > 0 && (
                                <span className="absolute -top-5 left-1/2 -translate-x-1/2 z-20 px-1 py-0.2 rounded bg-emerald-800 text-white font-mono font-bold text-[8px] sm:text-[9px] shadow-xs pointer-events-none whitespace-nowrap">
                                  {formatChartLabel(d.income)}
                                </span>
                              )}
                              <div
                                className={`w-full rounded-t-md transition-all duration-300 ${
                                  d.income > 0
                                    ? isHovered
                                      ? 'bg-emerald-600 shadow-xs ring-2 ring-emerald-300/60'
                                      : 'bg-emerald-500 hover:bg-emerald-600'
                                    : 'bg-slate-100'
                                }`}
                                style={{
                                  height: d.income > 0 ? `${Math.max(incHeight, 6)}%` : '3px',
                                }}
                              />
                            </div>

                            {/* Keluar Bar Column */}
                            <div className="w-1/2 h-full flex flex-col justify-end items-center relative min-w-0">
                              {/* Hover Badge with compact number */}
                              {isHovered && d.expense > 0 && (
                                <span className="absolute -top-5 left-1/2 -translate-x-1/2 z-20 px-1 py-0.2 rounded bg-rose-800 text-white font-mono font-bold text-[8px] sm:text-[9px] shadow-xs pointer-events-none whitespace-nowrap">
                                  {formatChartLabel(d.expense)}
                                </span>
                              )}
                              <div
                                className={`w-full rounded-t-md transition-all duration-300 ${
                                  d.expense > 0
                                    ? isHovered
                                      ? 'bg-rose-600 shadow-xs ring-2 ring-rose-300/60'
                                      : 'bg-rose-500 hover:bg-rose-600'
                                    : 'bg-slate-100'
                                }`}
                                style={{
                                  height: d.expense > 0 ? `${Math.max(expHeight, 6)}%` : '3px',
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Month labels - Clean, stable height */}
                <div className="grid grid-cols-12 gap-1 sm:gap-2 text-center pt-2 border-t border-slate-200/80">
                  {monthlyData.map((d) => {
                    const isHovered = activeChartMonth === d.month;
                    return (
                      <div
                        key={d.month}
                        onMouseEnter={() => setActiveChartMonth(d.month)}
                        onMouseLeave={() => setActiveChartMonth(null)}
                        className="flex flex-col items-center min-w-0 cursor-pointer py-0.5"
                      >
                        <span
                          className={`text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded-md transition-all ${
                            isHovered
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {d.month}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom footer for chart - Dynamically displays exact numbers on hover */}
              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 min-h-[30px]">
                {activeHoveredData ? (
                  <div className="flex items-center gap-2 sm:gap-3 w-full justify-between font-mono text-[11px] sm:text-xs">
                    <div className="flex items-center gap-1.5 font-sans font-bold text-slate-900 shrink-0">
                      <span className="w-2 h-2 rounded-full bg-slate-900" />
                      <span>{activeHoveredData.fullMonth} {currentYear}:</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 font-semibold flex-wrap justify-end">
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Masuk: {formatRupiah(activeHoveredData.income)}
                      </span>
                      <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        Keluar: {formatRupiah(activeHoveredData.expense)}
                      </span>
                      <span className={`px-2 py-0.5 rounded border ${
                        activeHoveredData.net >= 0
                          ? 'text-emerald-800 bg-emerald-100/60 border-emerald-300'
                          : 'text-rose-800 bg-rose-100/60 border-rose-300'
                      }`}>
                        Selisih: {formatRupiah(activeHoveredData.net)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5 font-medium text-slate-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Arahkan kursor ke grafik batang untuk menampilkan angka nominal ({currentYear})</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-semibold">
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        Hijau: Masuk
                      </span>
                      <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                        Merah: Keluar
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right 1 Col: Pos Pengeluaran Terbesar (Full Height) */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-2xs flex flex-col justify-between overflow-hidden">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-rose-600" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    Pos Pengeluaran Terbesar
                  </h3>
                </div>
                <button
                  onClick={() => setActiveMenu('pengeluaran')}
                  className="text-xs text-rose-600 hover:underline font-bold"
                >
                  Semua →
                </button>
              </div>

              <div className="space-y-3.5 py-2 flex-1 overflow-y-auto pr-1">
                {expensesByCategory.slice(0, 5).map((item) => {
                  const pct = totalExpense > 0 ? Math.round((item.total / totalExpense) * 100) : 0;
                  return (
                    <div key={item.category} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 truncate max-w-[150px]">
                          {item.category}
                        </span>
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="text-slate-400 text-[11px]">({pct}%)</span>
                          <span className="tabular-nums text-slate-900 font-extrabold">
                            {formatRupiah(item.total)}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-rose-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(pct, 4)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                <span className="font-medium">Rata-rata Biaya</span>
                <span className="font-mono tabular-nums font-bold text-slate-900 text-sm">
                  {formatRupiah(expenses.length > 0 ? totalExpense / expenses.length : 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Pagination Bar: Transisi ke Halaman 2 (Checklist Lunas Pembayaran) */}
          <div className="bg-white border border-slate-200/90 rounded-xl px-4 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
            <div className="flex items-center gap-2 text-slate-600 font-medium">
              <span className="font-bold text-slate-900">Halaman 1 dari 2:</span>
              <span>Ringkasan Keuangan & Grafik Arus Kas</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setDashboardPage(1)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold bg-slate-900 text-white shadow-2xs cursor-pointer"
                >
                  1
                </button>
                <button
                  onClick={() => setDashboardPage(2)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  2
                </button>
              </div>

              <button
                onClick={() => setDashboardPage(2)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-all shadow-xs cursor-pointer"
              >
                <span>Halaman 2: Checklist Lunas Pembayaran Iuran</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          HALAMAN 2: CHECKLIST LUNAS PEMBAYARAN IURAN STRUKTURAL NURSING
          ======================================================== */}
      {dashboardPage >= 2 && (
        <div className="h-full flex flex-col justify-between overflow-hidden gap-2 shrink-0">
          {/* Top Filter and Actions Toolbar */}
          <div className="bg-white border border-slate-300 rounded-xl p-2.5 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 min-w-0 flex-wrap sm:flex-nowrap">
              <button
                onClick={() => setDashboardPage(1)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors shrink-0 cursor-pointer"
                title="Kembali ke Halaman 1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>← Hal 1: Grafik</span>
              </button>

              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari peserta / unit kerja..."
                  value={checklistSearch}
                  onChange={(e) => {
                    setChecklistSearch(e.target.value);
                    setChecklistPage(1);
                  }}
                  className="text-xs pl-8 pr-2.5 py-1 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden w-40 sm:w-56"
                />
              </div>

              {/* Filter Unit Kerja */}
              <select
                value={checklistUnitFilter}
                onChange={(e) => {
                  setChecklistUnitFilter(e.target.value);
                  setChecklistPage(1);
                }}
                className="text-xs px-2.5 py-1 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-hidden bg-white text-slate-800"
              >
                <option value="ALL">Semua Unit Kerja</option>
                {uniqueUnits.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>

              {(checklistSearch || checklistUnitFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setChecklistSearch('');
                    setChecklistUnitFilter('ALL');
                    setChecklistPage(1);
                  }}
                  className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-0.5 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 justify-end">
              {hasCustomChecklistWidths && (
                <button
                  onClick={resetChecklistWidths}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer shrink-0"
                  title="Kembalikan ukuran kolom ke standar"
                >
                  Reset Kolom
                </button>
              )}

              {/* TAHUN Selector */}
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-300 px-2.5 py-1 rounded-lg">
                <span>TAHUN :</span>
                <select
                  value={checklistYear}
                  onChange={(e) => setChecklistYear(e.target.value)}
                  className="font-mono font-black text-emerald-800 bg-transparent focus:outline-hidden cursor-pointer"
                >
                  {['2026', '2025', '2027', '2028'].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              {/* Export CSV button */}
              <button
                onClick={handleExportChecklistCSV}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors cursor-pointer"
                title="Unduh Checklist CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden sm:inline">CSV</span>
              </button>
            </div>
          </div>

          {/* Worksheet Table Container (Auto fits page, horizontal scroll for custom column sizes) */}
          <div className="flex-1 min-h-0 bg-white border border-slate-400 rounded-xl shadow-2xs flex flex-col justify-between overflow-hidden">
            {/* Checklist Table - 15 Columns with Resizable Headers & Text Wrap */}
            <div ref={checklistContainerRef} className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden">
              <table
                className="w-full table-fixed text-left text-xs border-collapse"
                style={{ width: hasCustomChecklistWidths ? `${checklistTotalWidth}px` : '100%', minWidth: '100%' }}
              >
                <thead>
                  {/* Table Title Row with Full Column Span & Responsive Text Wrapping */}
                  <tr className="bg-slate-900 text-white border-b border-slate-700">
                    <th
                      colSpan={15}
                      className="border border-slate-700 py-2 px-3 text-center align-middle bg-slate-900 font-black text-xs sm:text-sm tracking-wide uppercase text-white whitespace-normal break-words leading-snug select-none"
                    >
                      CHECKLIST LUNAS PEMBAYARAN IURAN STRUKTURAL NURSING TAHUN {checklistYear}
                    </th>
                  </tr>
                  <tr className="bg-slate-800 text-slate-100 font-black text-[10px] sm:text-[11px] border-b-2 border-slate-700 select-none">
                    {/* 1. No */}
                    <th
                      style={{ width: `${checklistWidths['no'] || 42}px` }}
                      className="relative border border-slate-700 py-1.5 px-1 text-center align-middle bg-slate-800 text-slate-200"
                    >
                      <div className="w-full text-center whitespace-normal break-words leading-tight">
                        No
                      </div>
                      <ChecklistResizeHandle columnId="no" />
                    </th>

                    {/* 2. Nama Lengkap */}
                    <th
                      style={{ width: `${checklistWidths['name'] || 175}px` }}
                      className="relative border border-slate-700 py-1.5 px-2 text-center align-middle bg-slate-800 text-slate-200"
                    >
                      <div className="w-full text-center whitespace-normal break-words leading-tight">
                        Nama Lengkap
                      </div>
                      <ChecklistResizeHandle columnId="name" />
                    </th>

                    {/* 3. UNIT KERJA */}
                    <th
                      style={{ width: `${checklistWidths['unit'] || 140}px` }}
                      className="relative border border-slate-700 py-1.5 px-2 text-center align-middle bg-slate-800 text-slate-200 uppercase"
                    >
                      <div className="w-full text-center whitespace-normal break-words leading-tight uppercase">
                        UNIT KERJA
                      </div>
                      <ChecklistResizeHandle columnId="unit" />
                    </th>

                    {/* 4 to 15. JANUARI to DESEMBER */}
                    {CHECKLIST_MONTHS.map((m) => (
                      <th
                        key={m}
                        style={{ width: `${checklistWidths[m] || 54}px` }}
                        className="relative border border-slate-700 py-1.5 px-0.5 text-center align-middle bg-slate-800 text-slate-200 font-black uppercase text-[9px] sm:text-[10px]"
                      >
                        <div className="w-full text-center whitespace-normal break-words leading-tight tracking-tight uppercase hyphens-auto overflow-hidden">
                          {m}
                        </div>
                        <ChecklistResizeHandle columnId={m} />
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {paginatedChecklistParticipants.length === 0 ? (
                    <tr>
                      <td colSpan={15} className="py-10 text-center text-slate-400 border border-slate-300">
                        <p className="font-semibold text-xs text-slate-600">
                          Tidak ada data peserta ditemukan
                        </p>
                        <p className="text-[11px] mt-0.5">
                          Periksa kata kunci pencarian atau filter unit kerja.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedChecklistParticipants.map((p, idx) => {
                      const itemIndex = (checklistPage - 1) * checklistPerPage + idx + 1;
                      const unit = p.workUnit || p.groupOrDepartment || 'Emergency Unit';

                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-slate-50 transition-colors h-[34px]"
                        >
                          {/* 1. No */}
                          <td className="border border-slate-300 py-1 px-1 text-center font-mono text-[11px] font-semibold text-slate-600">
                            {itemIndex}
                          </td>

                          {/* 2. Nama Lengkap (Wraps text when column resized) */}
                          <td className="border border-slate-300 py-1 px-2 font-bold text-slate-900 text-xs min-w-0">
                            <div className="whitespace-normal break-words leading-tight" title={p.name}>
                              {p.name}
                            </div>
                          </td>

                          {/* 3. UNIT KERJA (Wraps text when column resized) */}
                          <td className="border border-slate-300 py-1 px-2 text-slate-800 text-[11px] min-w-0">
                            <div className="whitespace-normal break-words leading-tight uppercase font-medium" title={unit}>
                              {unit}
                            </div>
                          </td>

                          {/* 4 to 15. 12 Bulan Checklist */}
                          {CHECKLIST_MONTHS.map((m, mIdx) => {
                            const isPaid = isParticipantPaid(p, mIdx, checklistYear);
                            return (
                              <td
                                key={m}
                                className={`border border-slate-300 py-1 px-0.5 text-center align-middle ${
                                  isPaid ? 'bg-emerald-50/50' : ''
                                }`}
                                title={`${p.name} - ${m} ${checklistYear}: ${
                                  isPaid ? 'LUNAS' : 'Belum Bayar'
                                }`}
                              >
                                {isPaid ? (
                                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs shadow-2xs">
                                    ✓
                                  </span>
                                ) : (
                                  <span className="text-slate-300 font-mono text-xs font-semibold">
                                    -
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>

                {/* Table Footer: Total Lunas Per Bulan */}
                {paginatedChecklistParticipants.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-100 border-t-2 border-slate-800 text-slate-900 font-extrabold text-[10px] h-[30px]">
                      <td
                        colSpan={3}
                        className="border border-slate-800 py-1 px-2 text-right uppercase tracking-wider font-bold truncate"
                      >
                        TOTAL LUNAS PER BULAN ({checklistYear}):
                      </td>
                      {CHECKLIST_MONTHS.map((m, mIdx) => {
                        const count = monthlyPaidCounts[mIdx];
                        return (
                          <td
                            key={m}
                            className="border border-slate-800 py-1 px-0.5 text-center font-mono font-black text-xs text-emerald-800 bg-emerald-50/50"
                            title={`Total Lunas ${m}: ${count} peserta`}
                          >
                            {count}
                          </td>
                        );
                      })}
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Bottom Pagination Bar */}
            <div className="bg-slate-50 border-t border-slate-300 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
              <div className="flex items-center gap-2 text-slate-600 font-medium">
                <button
                  onClick={() => setDashboardPage(1)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Hal 1: Ringkasan & Grafik</span>
                </button>
                <span className="text-slate-400 hidden sm:inline">|</span>
                <span className="text-slate-500 text-[11px] font-semibold">
                  Checklist Halaman {checklistPage} dari {totalChecklistPages} ({filteredChecklistParticipants.length} Peserta)
                </span>
              </div>

              {/* Page buttons */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalChecklistPages }).map((_, pIdx) => {
                  const pNum = pIdx + 1;
                  return (
                    <button
                      key={pNum}
                      onClick={() => setChecklistPage(pNum)}
                      className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        pNum === checklistPage
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
