import React, { useState } from 'react';
import { KasProvider, useKas } from './context/KasContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/Dashboard/DashboardView';
import { PendapatanView } from './components/Pendapatan/PendapatanView';
import { PengeluaranView } from './components/Pengeluaran/PengeluaranView';
import { PesertaView } from './components/Peserta/PesertaView';
import { BuktiPengeluaranView } from './components/BuktiPengeluaran/BuktiPengeluaranView';
import { Lock, KeyRound } from 'lucide-react';
import { SettingView } from './components/Setting/SettingView';
import { AdminPinModal } from './components/Setting/AdminPinModal';
import { QuickAddModal } from './components/QuickAddModal';
import { PrintReportModal } from './components/PrintReportModal';
import { IncomeFormModal } from './components/Pendapatan/IncomeFormModal';
import { ExpenseFormModal } from './components/Pengeluaran/ExpenseFormModal';

const AppContent: React.FC = () => {
  const {
    activeMenu,
    setActiveMenu,
    isPrintReportOpen,
    setIsPrintReportOpen,
    isAdminUnlocked,
  } = useKas();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDirectAdminPinOpen, setIsDirectAdminPinOpen] = useState(false);

  // Quick modals
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isDirectIncomeOpen, setIsDirectIncomeOpen] = useState(false);
  const [isDirectExpenseOpen, setIsDirectExpenseOpen] = useState(false);

  // Drill-down from Dashboard
  const [selectedIncomeId, setSelectedIncomeId] = useState<string | null>(null);
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);

  const handleSelectIncomeFromDashboard = (id: string) => {
    setSelectedIncomeId(id);
    setActiveMenu('pendapatan');
  };

  const handleSelectExpenseFromDashboard = (id: string) => {
    setSelectedExpenseId(id);
    setActiveMenu('pengeluaran');
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-slate-50 flex flex-col antialiased text-slate-800">
      {/* Sidebar with the user-specified top-to-bottom menu order */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />

      {/* Main Content Area (shifted right by sidebar width on desktop) */}
      <div className="lg:pl-72 flex flex-col flex-1 h-screen max-h-screen overflow-hidden min-w-0">
        <Header
          onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
          onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        />

        <main className="flex-1 min-h-0 overflow-hidden p-3 sm:p-4 w-full flex flex-col">
          {activeMenu === 'dashboard' && (
            <DashboardView
              onOpenAddIncome={() => setIsDirectIncomeOpen(true)}
              onOpenAddExpense={() => setIsDirectExpenseOpen(true)}
              onSelectIncome={handleSelectIncomeFromDashboard}
              onSelectExpense={handleSelectExpenseFromDashboard}
            />
          )}

          {activeMenu === 'pendapatan' && (
            <PendapatanView
              initialSelectedId={selectedIncomeId}
              onClearInitialSelected={() => setSelectedIncomeId(null)}
            />
          )}

          {activeMenu === 'pengeluaran' && (
            <PengeluaranView
              initialSelectedId={selectedExpenseId}
              onClearInitialSelected={() => setSelectedExpenseId(null)}
              onOpenReceiptGallery={() => setActiveMenu('bukti-pengeluaran')}
            />
          )}

          {activeMenu === 'peserta' && <PesertaView />}

          {activeMenu === 'bukti-pengeluaran' && <BuktiPengeluaranView />}

          {activeMenu === 'setting' && (
            isAdminUnlocked ? (
              <SettingView />
            ) : (
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-lg text-center space-y-4">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shadow-xs">
                    <Lock className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">
                      Menu Pengaturan Terkunci
                    </h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      Halaman pengaturan ini dibatasi khusus untuk Administrator / Pengelola Kas. Masukkan PIN Admin untuk membuka menu ini.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                    <button
                      onClick={() => setActiveMenu('dashboard')}
                      className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    >
                      Kembali ke Dashboard
                    </button>
                    <button
                      onClick={() => setIsDirectAdminPinOpen(true)}
                      className="w-full sm:w-auto px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                      <span>Masukkan PIN Admin</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          )}
        </main>
      </div>

      {/* Admin PIN Modal */}
      <AdminPinModal
        isOpen={isDirectAdminPinOpen}
        onClose={() => setIsDirectAdminPinOpen(false)}
      />

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
      />

      {/* Direct Add Income Modal */}
      <IncomeFormModal
        isOpen={isDirectIncomeOpen}
        onClose={() => setIsDirectIncomeOpen(false)}
      />

      {/* Direct Add Expense Modal */}
      <ExpenseFormModal
        isOpen={isDirectExpenseOpen}
        onClose={() => setIsDirectExpenseOpen(false)}
      />

      {/* Full Printable Official Report Modal */}
      <PrintReportModal
        isOpen={isPrintReportOpen}
        onClose={() => setIsPrintReportOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <KasProvider>
      <AppContent />
    </KasProvider>
  );
}
