import React from 'react';
import {
  Menu,
  Calendar,
  Building2,
} from 'lucide-react';
import { useKas } from '../context/KasContext';
import { formatTanggalIndo } from '../utils/formatters';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  onOpenQuickAdd?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
}) => {
  const { activeMenu, settings, syncStatus } = useKas();

  const getMenuTitle = () => {
    switch (activeMenu) {
      case 'dashboard':
        return {
          title: 'Dashboard Keuangan',
          subtitle: 'Ikhtisar saldo, arus kas masuk, pengeluaran & iuran peserta',
        };
      case 'pendapatan':
        return {
          title: 'Pendapatan Kas (Inflow)',
          subtitle: 'Pencatatan kas masuk, penerimaan iuran, donasi & cetak kuitansi',
        };
      case 'pengeluaran':
        return {
          title: 'Pengeluaran Kas (Outflow)',
          subtitle: 'Pencatatan kas keluar, biaya operasional & bukti kas keluar',
        };
      case 'peserta':
        return {
          title: 'Daftar Peserta',
          subtitle: 'Data nama lengkap, jabatan & unit kerja peserta',
        };
      case 'bukti-pengeluaran':
        return {
          title: 'Bukti Pengeluaran & Nota',
          subtitle: 'Arsip berkas kwitansi, nota kontan & dokumentasi pembelanjaan',
        };
      case 'setting':
        return {
          title: 'Setting',
          subtitle: 'Pengaturan sistem, konfigurasi logo landscape, identitas lembaga & data',
        };
      default:
        return {
          title: 'Buku Kas Struktural Nursing',
          subtitle: 'Sistem Manajemen Pembukuan Terpadu',
        };
    }
  };

  const { title } = getMenuTitle();
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-6 py-3 transition-all no-print shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-hidden cursor-pointer"
            aria-label="Buka menu navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
              <span className="hidden sm:inline-flex items-center gap-1.5 text-slate-700 font-semibold">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate max-w-[200px]">{settings.orgName}</span>
              </span>
              <span className="hidden sm:inline text-slate-300">/</span>
              <span className="text-emerald-800 font-bold">{title}</span>
            </div>
            <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 truncate">
              {title}
            </h1>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Real-time Cloud Sync Indicator */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full border transition-all ${
              syncStatus === 'synced'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : syncStatus === 'connecting'
                ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
            title="Sinkronisasi Cloud Firebase Real-time Aktif di Semua Perangkat"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                syncStatus === 'synced'
                  ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]'
                  : syncStatus === 'connecting'
                  ? 'bg-amber-400'
                  : 'bg-slate-400'
              }`}
            />
            <span>
              {syncStatus === 'synced'
                ? 'Cloud Sync'
                : syncStatus === 'connecting'
                ? 'Menghubungkan...'
                : 'Offline Cache'}
            </span>
          </div>

          {/* Kotak Tempat Logo di App Header (Background Putih Bersih & Border Elegan) */}
          {settings.landscapeLogoUrl && settings.showLogoInAppHeader && (
            <div className="hidden lg:flex items-center h-9 px-2.5 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs">
              <img
                src={settings.landscapeLogoUrl}
                alt={settings.orgName || 'Logo Kas'}
                className="h-7 max-w-[150px] object-contain"
              />
            </div>
          )}

          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 bg-slate-50 rounded-lg border border-slate-200/80 font-medium">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{formatTanggalIndo(todayStr)}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
