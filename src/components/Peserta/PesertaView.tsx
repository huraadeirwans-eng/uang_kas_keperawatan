import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  FileSpreadsheet,
  Briefcase,
  ShieldCheck,
  UserCheck,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useKas } from '../../context/KasContext';
import {
  Participant,
  PARTICIPANT_POSITIONS,
  PARTICIPANT_WORK_UNITS,
} from '../../types';
import { exportToCSV } from '../../utils/formatters';
import { ParticipantFormModal } from './ParticipantFormModal';
import { Pagination } from '../Pagination';
import { useAutoPageSize } from '../../hooks/useAutoPageSize';

export const PESERTA_COLUMNS = [
  { id: 'no', label: 'No.', width: '5%' },
  { id: 'name', label: 'Nama Lengkap', width: '35%' },
  { id: 'position', label: 'Jabatan', width: '25%' },
  { id: 'unit', label: 'Unit Kerja', width: '25%' },
  { id: 'action', label: 'Aksi', width: '10%' },
];

export const PesertaView: React.FC = () => {
  const { participants, deleteParticipant } = useKas();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('ALL');
  const [selectedUnit, setSelectedUnit] = useState('ALL');

  // Dynamic pagination so data fits exactly 1 page before moving to page 2 (Maksimal 1 Halaman Kerja)
  const { containerRef, pageSize: itemsPerPage } = useAutoPageSize(44, 5, 80);
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);

  // Statistics by Position
  const stats = useMemo(() => {
    const total = participants.length;
    const staff = participants.filter((p) => p.position === 'Staff Pelaksana').length;
    const leader = participants.filter((p) => p.position === 'Team Leader').length;
    const head = participants.filter((p) => p.position === 'Departemen Unit Head').length;
    const uniqueUnits = new Set(participants.map((p) => p.workUnit || p.groupOrDepartment)).size;
    return { total, staff, leader, head, uniqueUnits };
  }, [participants]);

  const filteredParticipants = useMemo(() => {
    return participants.filter((p) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const pos = (p.position || '').toLowerCase();
        const unit = (p.workUnit || p.groupOrDepartment || '').toLowerCase();
        const matches =
          p.name.toLowerCase().includes(q) ||
          pos.includes(q) ||
          unit.includes(q);
        if (!matches) return false;
      }

      // Position filter
      if (selectedPosition !== 'ALL' && p.position !== selectedPosition) {
        return false;
      }

      // Unit filter
      const unitValue = p.workUnit || p.groupOrDepartment || '';
      if (selectedUnit !== 'ALL' && unitValue !== selectedUnit) {
        return false;
      }

      return true;
    });
  }, [participants, searchQuery, selectedPosition, selectedUnit]);

  // Reset page when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedPosition, selectedUnit]);

  const paginatedParticipants = filteredParticipants.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExportCSV = () => {
    const header = ['No.', 'Nama Lengkap', 'Jabatan', 'Unit Kerja'];

    const rows = filteredParticipants.map((p, idx) => [
      idx + 1,
      p.name,
      p.position || 'Staff Pelaksana',
      p.workUnit || p.groupOrDepartment || 'Emergency Unit',
    ]);

    exportToCSV(`daftar_peserta_${new Date().toISOString().split('T')[0]}.csv`, [
      header,
      ...rows,
    ]);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus peserta "${name}"?`)) {
      deleteParticipant(id);
    }
  };

  return (
    <div className="h-full flex flex-col justify-between space-y-2.5 sm:space-y-3 overflow-hidden">
      {/* 4 Stat Overview Cards - Compact for 1-screen viewport */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 shrink-0">
        <div className="bg-white border border-slate-200/90 border-t-2 border-t-blue-500 rounded-xl p-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Peserta
            </span>
            <div className="text-xl font-black font-mono tabular-nums text-slate-900 tracking-tight">
              {stats.total} Orang
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              {stats.uniqueUnits} Unit Kerja
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 border-t-2 border-t-slate-600 rounded-xl p-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Staff Pelaksana
            </span>
            <div className="text-xl font-black font-mono tabular-nums text-slate-800 tracking-tight">
              {stats.staff} Orang
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Pelaksana Operasional
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <UserCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 border-t-2 border-t-emerald-600 rounded-xl p-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Team Leader
            </span>
            <div className="text-xl font-black font-mono tabular-nums text-emerald-700 tracking-tight">
              {stats.leader} Orang
            </div>
            <div className="text-[11px] text-emerald-600 font-medium">
              Koordinator Lapangan
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Briefcase className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 border-t-2 border-t-purple-600 rounded-xl p-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Dept Unit Head
            </span>
            <div className="text-xl font-black font-mono tabular-nums text-purple-700 tracking-tight">
              {stats.head} Orang
            </div>
            <div className="text-[11px] text-purple-600 font-medium">
              Pimpinan Unit
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter & Actions Bar - Compact single row */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-2.5 sm:p-3 shadow-2xs space-y-2 shrink-0">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Search by Name */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Cari Nama Lengkap..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              />
            </div>

            {/* Filter Jabatan Dropdown */}
            <div>
              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-white"
              >
                <option value="ALL">Semua Jabatan</option>
                {PARTICIPANT_POSITIONS.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Unit Kerja Dropdown */}
            <div>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-white"
              >
                <option value="ALL">Semua Unit Kerja</option>
                {PARTICIPANT_WORK_UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingParticipant(null);
                setIsFormOpen(true);
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-xs whitespace-nowrap"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Tambah Peserta</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Unduh File CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">CSV</span>
            </button>

          </div>
        </div>
      </div>

      {/* TAMPILAN TABEL DAFTAR PESERTA: No. | Nama Lengkap | Jabatan | Unit Kerja | Aksi */}
      <div className="flex-1 min-h-0 bg-white border border-slate-300 rounded-xl shadow-xs flex flex-col justify-between overflow-hidden">
        <div ref={containerRef} className="flex-1 min-h-0 overflow-hidden w-full">
          <table className="w-full table-fixed text-left text-xs border-collapse">
            <thead>
              {/* Title Header across all 5 columns */}
              <tr className="bg-slate-900 text-white border-b border-slate-700">
                <th
                  colSpan={5}
                  className="border border-slate-700 py-2 px-3 text-center align-middle bg-slate-900 font-black text-xs sm:text-sm tracking-wide uppercase text-white truncate select-none leading-tight"
                >
                  DAFTAR PESERTA STRUKTURAL NURSING
                </th>
              </tr>
              {/* 5 COLUMNS - SEMUA JUDUL TABEL CENTER */}
              <tr className="bg-slate-800 text-slate-100 font-black border-b-2 border-slate-700 uppercase tracking-wider text-[10px] sm:text-[11px] select-none text-center">
                <th style={{ width: '5%' }} className="border border-slate-700 py-2 px-1 text-center align-middle bg-slate-800 text-slate-200 whitespace-normal break-words leading-tight">
                  No.
                </th>
                <th style={{ width: '35%' }} className="border border-slate-700 py-2 px-3 align-middle bg-slate-800 text-slate-200 text-center whitespace-normal break-words leading-tight">
                  Nama Lengkap
                </th>
                <th style={{ width: '25%' }} className="border border-slate-700 py-2 px-3 align-middle bg-slate-800 text-slate-200 text-center whitespace-normal break-words leading-tight">
                  Jabatan
                </th>
                <th style={{ width: '25%' }} className="border border-slate-700 py-2 px-3 align-middle bg-slate-800 text-slate-200 text-center whitespace-normal break-words leading-tight">
                  Unit Kerja
                </th>
                <th style={{ width: '10%' }} className="border border-slate-700 py-2 px-2 text-center align-middle bg-slate-800 text-slate-200 whitespace-normal break-words leading-tight">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {paginatedParticipants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 border border-slate-300">
                    <p className="font-semibold text-xs text-slate-600">Tidak ada data peserta ditemukan</p>
                    <p className="text-[11px] mt-0.5">Gunakan tombol "+ Tambah Peserta" untuk menambahkan data baru.</p>
                  </td>
                </tr>
              ) : (
                <>
                  {paginatedParticipants.map((p, idx) => {
                    const itemIndex = (currentPage - 1) * itemsPerPage + idx + 1;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="border border-slate-300 py-1.5 px-1 text-center font-mono text-[11px] font-semibold text-slate-600 align-middle">
                          {itemIndex}
                        </td>
                        {/* Nama Lengkap (Wrap Teks jika melebihi kotak) */}
                        <td className="border border-slate-300 py-1.5 px-3 font-bold text-slate-900 text-xs align-middle">
                          <div className="whitespace-normal break-words leading-tight" title={p.name}>
                            {p.name}
                          </div>
                        </td>
                        {/* Jabatan (Wrap Teks jika melebihi kotak) */}
                        <td className="border border-slate-300 py-1.5 px-3 align-middle">
                          <div className="whitespace-normal break-words leading-tight font-medium text-slate-800 text-[11px] px-2 py-0.5 rounded bg-slate-100 border border-slate-200 inline-block max-w-full" title={p.position || 'Staff Pelaksana'}>
                            {p.position || 'Staff Pelaksana'}
                          </div>
                        </td>
                        {/* Unit Kerja (Wrap Teks jika melebihi kotak) */}
                        <td className="border border-slate-300 py-1.5 px-3 align-middle">
                          <div className="whitespace-normal break-words leading-tight font-semibold text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[11px] inline-block max-w-full" title={p.workUnit || p.groupOrDepartment || 'Emergency Unit'}>
                            {p.workUnit || p.groupOrDepartment || 'Emergency Unit'}
                          </div>
                        </td>
                        {/* Aksi */}
                        <td className="border border-slate-300 py-1.5 px-1 text-center whitespace-nowrap align-middle">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setEditingParticipant(p);
                                setIsFormOpen(true);
                              }}
                              className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                              title="Ubah Data Peserta"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDelete(p.id, p.name)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="Hapus Peserta"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Empty filler rows to preserve the fixed 1-page worksheet look */}
                  {Array.from({ length: Math.max(0, itemsPerPage - paginatedParticipants.length) }).map((_, emptyIdx) => (
                    <tr
                      key={`empty-${emptyIdx}`}
                      className="h-[36px] bg-slate-50/20 select-none pointer-events-none"
                    >
                      <td className="border border-slate-200 py-1 px-1 text-center font-mono text-[10px] text-slate-300">
                        {(currentPage - 1) * itemsPerPage + paginatedParticipants.length + emptyIdx + 1}
                      </td>
                      <td className="border border-slate-200 py-1 px-3 text-slate-200 text-xs">-</td>
                      <td className="border border-slate-200 py-1 px-3 text-slate-200 text-xs">-</td>
                      <td className="border border-slate-200 py-1 px-3 text-slate-200 text-xs">-</td>
                      <td className="border border-slate-200 py-1 px-1 text-center text-slate-200 text-xs">-</td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Automatic Pagination Footer */}
        <Pagination
          currentPage={currentPage}
          totalItems={filteredParticipants.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          label="peserta"
        />
      </div>

      {/* Participant Form Modal (Strictly Nama Lengkap, Jabatan, Unit Kerja) */}
      <ParticipantFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingParticipant(null);
        }}
        editParticipant={editingParticipant}
      />
    </div>
  );
};
