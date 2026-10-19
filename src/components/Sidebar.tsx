import React, { useState } from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Users,
  Receipt,
  Settings,
  X,
  Printer,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { useKas } from '../context/KasContext';
import { NavigationMenu } from '../types';
import { formatRupiah } from '../utils/formatters';
import { AdminPinModal } from './Setting/AdminPinModal';

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, setMobileOpen }) => {
  const {
    activeMenu,
    setActiveMenu,
    settings,
    netBalance,
    setIsPrintReportOpen,
    isAdminUnlocked,
    lockAdmin,
  } = useKas();

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  // STRICT USER-REQUESTED ORDER:
  // 1. Dashboard Keuangan
  // 2. Pendapatan
  // 3. Pengeluaran
  // 4. Daftar Peserta
  // 5. Bukti Pengeluaran
  // 6. Setting
  const menuItems: { id: NavigationMenu; label: string; subLabel: string; icon: React.ReactNode }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard Keuangan',
      subLabel: 'Ikhtisar & arus kas',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'pendapatan',
      label: 'Pendapatan',
      subLabel: 'Kas masuk & kuitansi',
      icon: <TrendingUp className="w-4 h-4 text-emerald-400" />,
    },
    {
      id: 'pengeluaran',
      label: 'Pengeluaran',
      subLabel: 'Kas keluar & nota',
      icon: <TrendingDown className="w-4 h-4 text-rose-400" />,
    },
    {
      id: 'peserta',
      label: 'Daftar Peserta',
      subLabel: 'Jabatan & unit kerja',
      icon: <Users className="w-4 h-4 text-sky-400" />,
    },
    {
      id: 'bukti-pengeluaran',
      label: 'Bukti Pengeluaran',
      subLabel: 'Arsip nota & voucher',
      icon: <Receipt className="w-4 h-4 text-amber-400" />,
    },
    // Menu Setting HANYA terlihat jika sudah dibuka oleh Admin
    ...(isAdminUnlocked
      ? [
          {
            id: 'setting' as NavigationMenu,
            label: 'Setting',
            subLabel: 'Sistem & logo manual',
            icon: <Settings className="w-4 h-4 text-slate-400" />,
          },
        ]
      : []),
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden no-print"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#0c1322] border-r border-slate-800/80 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 no-print ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo Area with colors inspired by KAS UTAMA logo */}
        <div className="p-4 border-b border-slate-800/80 bg-gradient-to-b from-[#071322] to-[#0c192d]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {/* Kotak Icon Logo - Using Deep Navy and Gold accents */}
              <div className="w-8 h-8 rounded-lg bg-[#04223f] border border-[#cfac3d]/60 flex items-center justify-center text-[#cfac3d] shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="font-extrabold text-xs tracking-wider text-white flex items-center gap-1.5 uppercase">
                  <span>BUKU KAS STRUKTURAL NURSING</span>
                  <span className="text-[9px] font-bold tracking-widest px-1.5 py-0.5 rounded-xs bg-[#cfac3d]/20 text-[#cfac3d] border border-[#cfac3d]/50 shrink-0">
                    RESMI
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 font-medium truncate max-w-[170px]">
                  {settings.orgName}
                </div>
              </div>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 cursor-pointer"
              aria-label="Tutup menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Kotak Tempat Logo Landscape (Pure White Background matching logo image) */}
          {settings.landscapeLogoUrl && settings.showLogoInAppHeader && (
            <div className="mt-3 p-2 bg-white rounded-xl border border-slate-700/50 shadow-sm flex items-center justify-center overflow-hidden">
              <img
                src={settings.landscapeLogoUrl}
                alt={settings.orgName || 'Logo Landscape Buku Kas'}
                referrerPolicy="no-referrer"
                className="max-w-full object-contain"
                style={{ height: `${Math.min(settings.logoHeight || 44, 46)}px` }}
              />
            </div>
          )}
        </div>

        {/* Navigation list from top to bottom strictly */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Navigasi Utama
          </div>

          {menuItems.map((item) => {
            const isActive = activeMenu === item.id;
            const handleClick = () => {
              if (item.id === 'setting' && !isAdminUnlocked) {
                setIsPinModalOpen(true);
                setMobileOpen(false);
                return;
              }
              setActiveMenu(item.id);
              setMobileOpen(false);
            };

            return (
              <button
                key={item.id}
                onClick={handleClick}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-xs font-semibold transition-all duration-150 relative group cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/15 text-white border border-emerald-500/35 shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60 border border-transparent'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 bg-emerald-400 rounded-r-full" />
                )}
                <span className={`transition-colors shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}`}>
                  {item.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="truncate">
                    <span className="tracking-tight">{item.label}</span>
                  </div>
                  <div
                    className={`text-[10px] truncate font-normal ${
                      isActive ? 'text-emerald-300/80' : 'text-slate-400 group-hover:text-slate-300'
                    }`}
                  >
                    {item.subLabel}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer with Live Balance & Print Button */}
        <div className="p-3.5 border-t border-slate-800/80 bg-[#070d17] space-y-2.5">
          <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800/90 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Saldo Kas Bersih
              </span>
              <span className="text-[9px] text-emerald-400 font-semibold tracking-wide uppercase px-1.5 py-0.2 rounded-xs bg-emerald-500/10 border border-emerald-500/30">
                Terkonsolidasi
              </span>
            </div>
            <div
              className={`mt-1.5 text-base sm:text-lg font-black font-mono tabular-nums tracking-tight ${
                netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatRupiah(netBalance)}
            </div>
          </div>

          <button
            onClick={() => setIsPrintReportOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800/90 border border-slate-700/80 rounded-lg hover:bg-slate-700 hover:text-white transition-all shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>Cetak Buku Kas Lengkap</span>
          </button>

          {/* Akses Admin Status / Login Pengelola */}
          {isAdminUnlocked ? (
            <div className="pt-1 flex items-center justify-between px-1 text-[11px] text-slate-400 border-t border-slate-800/60">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mode Admin Aktif</span>
              </span>
              <button
                onClick={lockAdmin}
                className="text-slate-400 hover:text-rose-400 font-medium text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                title="Kunci Akses Admin di Perangkat Ini"
              >
                Kunci
              </button>
            </div>
          ) : (
            <div className="pt-1 border-t border-slate-800/60">
              <button
                onClick={() => setIsPinModalOpen(true)}
                className="w-full text-center text-[11px] text-slate-400 hover:text-amber-400 py-1 transition-colors flex items-center justify-center gap-1.5 cursor-pointer rounded-lg hover:bg-slate-800/40"
                title="Buka Menu Pengaturan Khusus Pengelola"
              >
                <Lock className="w-3 h-3 text-amber-500/80" />
                <span>Login Pengelola Kas</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Modal Verifikasi PIN Administrator untuk Menu Pengaturan */}
      <AdminPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
      />
    </>
  );
};
