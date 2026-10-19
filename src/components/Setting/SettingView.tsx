import React, { useState } from 'react';
import {
  Settings,
  Upload,
  Image,
  Check,
  RefreshCw,
  Download,
  FileJson,
  Plus,
  Trash2,
  Building,
  UserCheck,
  Eye,
  Sliders,
  Printer,
  Shield,
  Layers,
  Database,
  Tag,
  HardDrive,
  AlertTriangle,
  Lock,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { useKas } from '../../context/KasContext';
import { DEFAULT_SETTINGS } from '../../data/initialData';
import { formatRupiah } from '../../utils/formatters';
import { compressImageFile } from '../../utils/imageCompressor';

export const SettingView: React.FC = () => {
  const {
    settings,
    updateSettings,
    resetSettings,
    incomes,
    expenses,
    participants,
    exportFullDataJSON,
    importFullDataJSON,
    resetToSampleData,
    clearAllData,
    setIsPrintReportOpen,
    lockAdmin,
    changeAdminPin,
  } = useKas();

  // Active tab in Settings
  const [activeTab, setActiveTab] = useState<'logo' | 'identitas' | 'pejabat' | 'kategori' | 'backup' | 'keamanan'>('logo');
  const [newAdminPin, setNewAdminPin] = useState('');
  const [confirmAdminPin, setConfirmAdminPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccessNotice, setPinSuccessNotice] = useState(false);

  // Local state for organization & signatories
  const [orgName, setOrgName] = useState(settings.orgName);
  const [subTitle, setSubTitle] = useState(settings.subTitle);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [email, setEmail] = useState(settings.email);

  const [leaderName, setLeaderName] = useState(settings.leaderName);
  const [leaderTitle, setLeaderTitle] = useState(settings.leaderTitle);
  const [treasurerName, setTreasurerName] = useState(settings.treasurerName);
  const [treasurerTitle, setTreasurerTitle] = useState(settings.treasurerTitle);

  const [defaultDues, setDefaultDues] = useState<number | ''>(settings.defaultDuesAmount);

  // Logo settings
  const [logoHeight, setLogoHeight] = useState<number>(settings.logoHeight || 56);
  const [logoAlignment, setLogoAlignment] = useState<'left' | 'center'>(settings.logoAlignment || 'left');
  const [showInAppHeader, setShowInAppHeader] = useState(settings.showLogoInAppHeader ?? true);
  const [showInPrint, setShowInPrint] = useState(settings.showLogoInPrint ?? true);
  const [showInReceipts, setShowInReceipts] = useState(settings.showLogoInReceipts ?? true);

  // Custom logo input URL & Preview mode
  const [customLogoUrl, setCustomLogoUrl] = useState('');
  const [logoPreviewTab, setLogoPreviewTab] = useState<'kwitansi' | 'bku'>('kwitansi');

  // Category management
  const [newIncomeCat, setNewIncomeCat] = useState('');
  const [newExpenseCat, setNewExpenseCat] = useState('');

  // Notification badge
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync state whenever settings change (e.g. on reset or import)
  React.useEffect(() => {
    setOrgName(settings.orgName);
    setSubTitle(settings.subTitle);
    setAddress(settings.address);
    setPhone(settings.phone);
    setEmail(settings.email);
    setLeaderName(settings.leaderName);
    setLeaderTitle(settings.leaderTitle);
    setTreasurerName(settings.treasurerName);
    setTreasurerTitle(settings.treasurerTitle);
    setDefaultDues(settings.defaultDuesAmount);
    setLogoHeight(settings.logoHeight || 56);
    setLogoAlignment(settings.logoAlignment || 'left');
    setShowInAppHeader(settings.showLogoInAppHeader ?? true);
    setShowInPrint(settings.showLogoInPrint ?? true);
    setShowInReceipts(settings.showLogoInReceipts ?? true);
  }, [settings]);

  // Handle Logo Upload manually
  const handleLogoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64Data = await compressImageFile(file, 800, 300, 0.85);
      updateSettings({ landscapeLogoUrl: base64Data });
      triggerSuccessNotice();
    } catch (err) {
      console.error('Logo compression failed', err);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          updateSettings({ landscapeLogoUrl: event.target.result as string });
          triggerSuccessNotice();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyLogoUrl = () => {
    if (!customLogoUrl.trim()) return;
    updateSettings({ landscapeLogoUrl: customLogoUrl.trim() });
    setCustomLogoUrl('');
    triggerSuccessNotice();
  };

  const handleResetToDefaultLogo = () => {
    updateSettings({ landscapeLogoUrl: DEFAULT_SETTINGS.landscapeLogoUrl });
    triggerSuccessNotice();
  };

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      orgName: orgName.trim(),
      subTitle: subTitle.trim(),
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim(),
      leaderName: leaderName.trim(),
      leaderTitle: leaderTitle.trim(),
      treasurerName: treasurerName.trim(),
      treasurerTitle: treasurerTitle.trim(),
      defaultDuesAmount: Number(defaultDues) || 250000,
      logoHeight,
      logoAlignment,
      showLogoInAppHeader: showInAppHeader,
      showLogoInPrint: showInPrint,
      showLogoInReceipts: showInReceipts,
    });
    triggerSuccessNotice();
  };

  const triggerSuccessNotice = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleAddIncomeCategory = () => {
    if (!newIncomeCat.trim()) return;
    if (settings.categoriesIncome.includes(newIncomeCat.trim())) {
      alert('Kategori sudah ada!');
      return;
    }
    updateSettings({
      categoriesIncome: [...settings.categoriesIncome, newIncomeCat.trim()],
    });
    setNewIncomeCat('');
    triggerSuccessNotice();
  };

  const handleDeleteIncomeCategory = (cat: string) => {
    if (settings.categoriesIncome.length <= 1) {
      alert('Minimal harus ada 1 kategori');
      return;
    }
    updateSettings({
      categoriesIncome: settings.categoriesIncome.filter((c) => c !== cat),
    });
    triggerSuccessNotice();
  };

  const handleAddExpenseCategory = () => {
    if (!newExpenseCat.trim()) return;
    if (settings.categoriesExpense.includes(newExpenseCat.trim())) {
      alert('Kategori sudah ada!');
      return;
    }
    updateSettings({
      categoriesExpense: [...settings.categoriesExpense, newExpenseCat.trim()],
    });
    setNewExpenseCat('');
    triggerSuccessNotice();
  };

  const handleDeleteExpenseCategory = (cat: string) => {
    if (settings.categoriesExpense.length <= 1) {
      alert('Minimal harus ada 1 kategori');
      return;
    }
    updateSettings({
      categoriesExpense: settings.categoriesExpense.filter((c) => c !== cat),
    });
    triggerSuccessNotice();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importFullDataJSON(content);
        if (success) {
          alert('Data buku kas berhasil dipulihkan dari file backup!');
        } else {
          alert('Format file cadangan tidak valid atau rusak');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden space-y-2.5 sm:space-y-3 w-full">
      {/* Toast Notice */}
      {saveSuccess && (
        <div className="fixed top-16 right-6 z-50 bg-emerald-700 text-white text-xs px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 transition-all">
          <Check className="w-4 h-4" />
          <span>Pengaturan dan Logo berhasil disimpan!</span>
        </div>
      )}

      {/* Elegant Header & Segmented Tab Navigation */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3 sm:p-3.5 shadow-2xs space-y-2.5 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-700" />
              <span>Pengaturan Sistem Buku Kas (Setting)</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Konfigurasi logo landscape manual, profil organisasi, penandatangan, kategori, dan cadangan data.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => {
                if (confirm('Kunci menu Pengaturan sekarang? Anda perlu memasukkan PIN Admin lagi untuk membukanya.')) {
                  lockAdmin();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors shadow-2xs cursor-pointer"
              title="Kunci Akses Pengaturan pada Perangkat Ini"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Kunci Pengaturan</span>
            </button>
            <button
              onClick={() => setIsPrintReportOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Pratinjau Cetak Laporan</span>
            </button>
          </div>
        </div>

        {/* Segmented Tab Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 border-t border-slate-100 pt-2 text-xs">
          <button
            onClick={() => setActiveTab('logo')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'logo'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Image className="w-3.5 h-3.5" />
            <span>Logo Landscape & Kop Surat</span>
          </button>

          <button
            onClick={() => setActiveTab('identitas')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'identitas'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Identitas Lembaga</span>
          </button>

          <button
            onClick={() => setActiveTab('pejabat')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'pejabat'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Pejabat Penandatangan</span>
          </button>

          <button
            onClick={() => setActiveTab('kategori')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'kategori'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Kategori & Iuran</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'backup'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Cadangan & Data</span>
          </button>

          <button
            onClick={() => setActiveTab('keamanan')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === 'keamanan'
                ? 'bg-amber-600 text-white shadow-xs font-bold'
                : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 font-bold'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            <span>Keamanan & PIN</span>
          </button>
        </div>
      </div>

      {/* Scrollable Tab Panel Container (Fits 1 Screen, No Outer Scroll) */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-0.5">
        {/* TAB 1: SETTING LOGO SECARA MANUAL (LANDSCAPE) */}
        {activeTab === 'logo' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Pengaturan Logo Secara Manual (Format Landscape)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Unggah berkas atau masukkan URL logo landscape manual. Logo ini otomatis langsung diterapkan pada Kop Surat Laporan Resmi dan formulir <span className="font-bold text-slate-800">KWITANSI PENERIMAAN UANG</span>.
              </p>
            </div>
            <button
              onClick={handleResetToDefaultLogo}
              className="text-xs px-3 py-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 self-start sm:self-auto font-medium"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Kembalikan Logo Bawaan</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left: Upload and Slider controls */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  1. Unggah Logo Landscape dari Perangkat
                </label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-slate-800 rounded-xl p-5 cursor-pointer bg-slate-50 hover:bg-slate-100/70 transition-colors">
                  <Upload className="w-6 h-6 text-slate-400 mb-1.5" />
                  <span className="text-xs font-bold text-slate-800">
                    Pilih Berkas Logo Landscape
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5">
                    Format PNG (transparan disarankan), JPG, SVG, WebP (Maks 5MB)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Kotak Tempat Logo Aktif (Warna Putih Bersih sesuai Gambar) */}
              {settings.landscapeLogoUrl && (
                <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center justify-between">
                    <span>Kotak Tempat Logo Aktif:</span>
                    <button
                      type="button"
                      onClick={() => {
                        updateSettings({ landscapeLogoUrl: '' });
                        triggerSuccessNotice();
                      }}
                      className="text-rose-700 hover:text-rose-800 font-bold text-[10px] bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-sm border border-rose-200 cursor-pointer"
                    >
                      Hapus Logo
                    </button>
                  </div>
                  <div className="p-2.5 bg-white border border-slate-200/90 rounded-lg flex items-center justify-center shadow-2xs">
                    <img
                      src={settings.landscapeLogoUrl}
                      alt="Logo Aktif"
                      className="max-h-12 object-contain"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Atau Masukkan Tautan URL Logo Manual
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://instansi.org/logo-landscape.png"
                    value={customLogoUrl}
                    onChange={(e) => setCustomLogoUrl(e.target.value)}
                    className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleApplyLogoUrl}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
                  >
                    Terapkan
                  </button>
                </div>
              </div>

              {/* Logo Height Slider */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">Ukuran Tinggi Logo di Kop Surat:</span>
                  <span className="font-mono tabular-nums font-extrabold text-slate-900">
                    {logoHeight} px
                  </span>
                </div>
                <input
                  type="range"
                  min="32"
                  max="90"
                  step="2"
                  value={logoHeight}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setLogoHeight(val);
                    updateSettings({ logoHeight: val });
                  }}
                  className="w-full accent-slate-900 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>Kecil (32px)</span>
                  <span>Standar (56px)</span>
                  <span>Besar (90px)</span>
                </div>
              </div>

              {/* Logo Alignment */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
                <span className="block font-bold text-slate-800 text-xs">
                  Posisi Perataan Logo di Kop Surat:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLogoAlignment('left');
                      updateSettings({ logoAlignment: 'left' });
                    }}
                    className={`py-1.5 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      logoAlignment === 'left'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Rata Kiri
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLogoAlignment('center');
                      updateSettings({ logoAlignment: 'center' });
                    }}
                    className={`py-1.5 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      logoAlignment === 'center'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    Rata Tengah
                  </button>
                </div>
              </div>

              {/* Visibility Options */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={showInAppHeader}
                    onChange={(e) => {
                      setShowInAppHeader(e.target.checked);
                      updateSettings({ showLogoInAppHeader: e.target.checked });
                    }}
                    className="rounded text-slate-900 focus:ring-slate-900"
                  />
                  <span>Tampilkan logo di bilah menu samping (Sidebar)</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={showInPrint}
                    onChange={(e) => {
                      setShowInPrint(e.target.checked);
                      updateSettings({ showLogoInPrint: e.target.checked });
                    }}
                    className="rounded text-slate-900 focus:ring-slate-900"
                  />
                  <span>Tampilkan logo di Kop Surat Laporan Cetak Buku Kas Resmi</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={showInReceipts}
                    onChange={(e) => {
                      setShowInReceipts(e.target.checked);
                      updateSettings({ showLogoInReceipts: e.target.checked });
                    }}
                    className="rounded text-slate-900 focus:ring-slate-900"
                  />
                  <span>Tampilkan logo di Kuitansi Penerimaan & Formulir Kas Keluar</span>
                </label>
              </div>
            </div>

            {/* Right: Live Authentic Kop Surat Letterhead Sheet */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-emerald-700" />
                  <span>Pratinjau Pengaruh Logo:</span>
                </span>
                <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setLogoPreviewTab('kwitansi')}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                      logoPreviewTab === 'kwitansi'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Kwitansi Penerimaan
                  </button>
                  <button
                    type="button"
                    onClick={() => setLogoPreviewTab('bku')}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                      logoPreviewTab === 'bku'
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Laporan Cetak BKU
                  </button>
                </div>
              </div>

              {/* Simulated Sheet Paper */}
              <div className="p-6 bg-white border border-slate-300 rounded-xl shadow-xs space-y-4">
                {logoPreviewTab === 'kwitansi' ? (
                  /* Live Preview Kwitansi Penerimaan Uang Kop */
                  <div className="space-y-3">
                    <div className="relative flex items-center justify-center pb-3 border-b-2 border-slate-900 min-h-[64px]">
                      {settings.landscapeLogoUrl ? (
                        <div className="absolute left-0 top-0 bottom-0 flex items-center">
                          <img
                            src={settings.landscapeLogoUrl}
                            alt="Logo Landscape"
                            referrerPolicy="no-referrer"
                            className="max-w-[140px] sm:max-w-[180px] object-contain"
                            style={{ height: `${Math.min(Math.max(logoHeight, 32), 70)}px` }}
                          />
                        </div>
                      ) : (
                        <div className="absolute left-0 top-0 bottom-0 flex items-center">
                          <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs">
                            <div className="w-8 h-8 rounded-full border-2 border-emerald-700 flex items-center justify-center font-black text-sm">
                              +
                            </div>
                            <div className="leading-tight text-[11px]">
                              <div className="font-black text-emerald-900">STRUKTURAL</div>
                              <div className="font-extrabold text-slate-800">NURSING</div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="text-center px-10">
                        <h4 className="text-xs sm:text-sm font-black tracking-wider text-slate-900 uppercase font-sans">
                          {orgName || 'STRUKTURAL NURSING'}
                        </h4>
                        <p className="text-[11px] font-semibold text-slate-700 mt-0.5">
                          {subTitle || 'Unit Pelayanan Keperawatan • Tanda Bukti Pengeluaran Kas'}
                        </p>
                      </div>
                    </div>

                    <div className="text-center pt-1">
                      <div className="text-xs font-black text-slate-950 uppercase tracking-wide underline underline-offset-4">
                        KWITANSI PENERIMAAN UANG
                      </div>
                      <p className="text-[10px] text-emerald-700 font-semibold mt-2 bg-emerald-50 py-1 px-2.5 rounded-md border border-emerald-200 inline-block">
                        ✓ Logo ini otomatis aktif dan tampil pada formulir Kwitansi Pengeluaran Kas
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Live Preview Laporan Cetak BKU Kop */
                  <div>
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-3 border-b-2 border-slate-900">
                      {settings.landscapeLogoUrl ? (
                        <div className="max-w-[220px] flex items-center justify-center p-1">
                          <img
                            src={settings.landscapeLogoUrl}
                            alt="Logo Landscape"
                            referrerPolicy="no-referrer"
                            className="max-w-full object-contain"
                            style={{ height: `${logoHeight}px` }}
                          />
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-100 rounded text-slate-400 text-xs italic">
                          Logo belum diatur
                        </div>
                      )}

                      <div className="text-center sm:text-right">
                        <h3 className="font-extrabold text-xs sm:text-sm uppercase tracking-tight text-slate-900">
                          {orgName || 'NAMA ORGANISASI'}
                        </h3>
                        <p className="text-[11px] text-slate-600 font-medium">
                          {subTitle || 'Manajemen Kas Terpadu'}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {address || 'Alamat Kantor'}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {phone} · {email}
                        </p>
                      </div>
                    </div>

                    <div className="-mt-3.5 border-t border-slate-400" />

                    <div className="text-center text-xs text-slate-400 italic py-3">
                      [ Laporan Cetak Buku Kas Umum Resmi Ditampilkan Di Bawah Kop Ini ]
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: IDENTITAS LEMBAGA */}
      {activeTab === 'identitas' && (
        <form onSubmit={handleSaveGeneral} className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">
              Identitas Organisasi, Lembaga & Panitia
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Data ini ditampilkan pada tajuk laporan keuangan dan kuitansi pembayaran.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Organisasi / Lembaga / Kepanitiaan *
              </label>
              <input
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Contoh: KAS PANITIA UTAMA"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sub-Judul / Keterangan Lembaga
              </label>
              <input
                type="text"
                value={subTitle}
                onChange={(e) => setSubTitle(e.target.value)}
                placeholder="Contoh: Pembukuan Kas Transparan & Akuntabel"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800 focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alamat Sekretariat / Kantor Lengkap
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Jl. Jenderal Sudirman Kav. 52-53, Jakarta"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor Telepon / WhatsApp
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0812-xxxx-xxxx"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alamat Email Resmi
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="keuangan@panitia.org"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-800 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Identitas Lembaga</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: PEJABAT PENANDATANGAN */}
      {activeTab === 'pejabat' && (
        <form onSubmit={handleSaveGeneral} className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">
              Pejabat Penandatangan Laporan & Pengesahan
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pejabat yang namanya tercantum pada lembar tanda tangan laporan Buku Kas Umum dan kuitansi.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-900" />
                Ketua / Pimpinan / Penanggung Jawab
              </h4>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nama Lengkap & Gelar
                </label>
                <input
                  type="text"
                  value={leaderName}
                  onChange={(e) => setLeaderName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Sebutan Jabatan
                </label>
                <input
                  type="text"
                  value={leaderTitle}
                  onChange={(e) => setLeaderTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden"
                />
              </div>
            </div>

            <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                Bendahara / Pemegang Kas
              </h4>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nama Lengkap & Gelar
                </label>
                <input
                  type="text"
                  value={treasurerName}
                  onChange={(e) => setTreasurerName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Sebutan Jabatan
                </label>
                <input
                  type="text"
                  value={treasurerTitle}
                  onChange={(e) => setTreasurerTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Pejabat Penandatangan</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: KATEGORI & IURAN */}
      {activeTab === 'kategori' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveGeneral} className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Nilai Standar Iuran Wajib Peserta
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Nilai target awal otomatis ketika menambahkan anggota / peserta baru ke dalam sistem.
              </p>
            </div>
            <div className="max-w-xs flex gap-2 items-center">
              <input
                type="number"
                min="0"
                step="5000"
                value={defaultDues}
                onChange={(e) => setDefaultDues(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full text-xs px-3 py-2 font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-hidden"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg whitespace-nowrap shadow-xs"
              >
                Simpan
              </button>
            </div>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Income Categories */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Kategori Kas Masuk (Pendapatan)
                </h4>
                <p className="text-xs text-slate-500">Kelola jenis-jenis penerimaan kas</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Kategori pendapatan baru..."
                  value={newIncomeCat}
                  onChange={(e) => setNewIncomeCat(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleAddIncomeCategory}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pt-1">
                {settings.categoriesIncome.map((cat) => (
                  <div
                    key={cat}
                    className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg text-xs"
                  >
                    <span className="text-slate-800 font-medium">{cat}</span>
                    <button
                      onClick={() => handleDeleteIncomeCategory(cat)}
                      className="text-slate-400 hover:text-rose-600 p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Expense Categories */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Kategori Kas Keluar (Pengeluaran)
                </h4>
                <p className="text-xs text-slate-500">Kelola pos anggaran pengeluaran kas</p>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Kategori pengeluaran baru..."
                  value={newExpenseCat}
                  onChange={(e) => setNewExpenseCat(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleAddExpenseCategory}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pt-1">
                {settings.categoriesExpense.map((cat) => (
                  <div
                    key={cat}
                    className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg text-xs"
                  >
                    <span className="text-slate-800 font-medium">{cat}</span>
                    <button
                      onClick={() => handleDeleteExpenseCategory(cat)}
                      className="text-slate-400 hover:text-rose-600 p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CADANGAN & DATA */}
      {activeTab === 'backup' && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-emerald-700" />
                <span>Penyimpanan Data Lokal & Cadangan (Local Host Storage)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pencatatan data Anda tersimpan permanen di penyimpanan peramban lokal (Local Storage) dan aman dari refresh.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-emerald-900 text-xs font-semibold self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Status: Tersimpan Permanen</span>
            </div>
          </div>

          {/* Storage Status & Statistics Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-slate-600" />
                <span>Ringkasan Data Tersimpan di Localhost:</span>
              </h4>
              <p className="text-[11px] text-slate-600 leading-relaxed max-w-xl">
                Semua data transaksi yang diinput tetap tersimpan permanen di perangkat ini dan tidak akan terhapus saat berpindah halaman atau browser ditutup, kecuali Anda memilih untuk menghapus transaksi secara mandiri.
              </p>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs shrink-0 flex-wrap">
              <div className="bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-center shadow-2xs">
                <span className="block text-[10px] text-slate-400 font-sans font-medium">Kas Masuk</span>
                <span className="font-extrabold text-emerald-700">{incomes.length} data</span>
              </div>
              <div className="bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-center shadow-2xs">
                <span className="block text-[10px] text-slate-400 font-sans font-medium">Kas Keluar</span>
                <span className="font-extrabold text-rose-600">{expenses.length} data</span>
              </div>
              <div className="bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg text-center shadow-2xs">
                <span className="block text-[10px] text-slate-400 font-sans font-medium">Peserta</span>
                <span className="font-extrabold text-blue-700">{participants.length} data</span>
              </div>
            </div>
          </div>

          {/* 4 Action Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Ekspor Backup */}
            <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-xl space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-slate-700" />
                  <span>Ekspor Backup JSON</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Unduh salinan cadangan lengkap berkas JSON seluruh transaksi, peserta, foto nota, dan logo.
                </p>
              </div>
              <button
                onClick={exportFullDataJSON}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer"
              >
                <span>Unduh File Cadangan</span>
              </button>
            </div>

            {/* Card 2: Pulihkan Data (Restore) */}
            <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-xl space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-slate-700" />
                  <span>Pulihkan Data (Restore)</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  Kembalikan catatan pembukuan dari file backup JSON yang pernah Anda simpan sebelumnya.
                </p>
              </div>
              <label className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shadow-2xs">
                <span>Pilih File Backup JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
              </label>
            </div>

            {/* Card 3: Kosongkan Seluruh Data (Mulai Baru) */}
            <div className="p-4 bg-amber-50/60 border border-amber-200/90 rounded-xl space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Trash2 className="w-4 h-4 text-amber-700" />
                  <span>Mulai Buku Baru (Kosongkan)</span>
                </h4>
                <p className="text-[11px] text-amber-800 mt-1">
                  Hapus seluruh transaksi contoh agar buku kas bersih dan siap diisi pembukuan asli dari nol.
                </p>
              </div>
              <button
                onClick={() => {
                  if (confirm('PERINGATAN: Apakah Anda yakin ingin mengosongkan seluruh data transaksi dan peserta untuk memulai buku kas baru yang bersih?')) {
                    clearAllData();
                    alert('Seluruh data transaksi telah dikosongkan. Buku kas kini bersih dan siap digunakan.');
                  }
                }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-amber-800 bg-white border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors shadow-2xs cursor-pointer"
              >
                <span>Kosongkan Data (Buku Baru)</span>
              </button>
            </div>

            {/* Card 4: Reset Data Contoh */}
            <div className="p-4 bg-rose-50/50 border border-rose-200/90 rounded-xl space-y-3 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4 text-rose-700" />
                  <span>Reset Data Contoh Bawaan</span>
                </h4>
                <p className="text-[11px] text-rose-700 mt-1">
                  Kembalikan ke data pembukuan contoh bawaan jika Anda ingin melihat simulasi atau data demo.
                </p>
              </div>
              <button
                onClick={() => {
                  if (confirm('Yakin ingin mereset seluruh data kembali ke data contoh bawaan?')) {
                    resetToSampleData();
                    alert('Data contoh bawaan telah dimuat kembali.');
                  }
                }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-700 bg-white border border-rose-300 rounded-lg hover:bg-rose-100 transition-colors shadow-2xs cursor-pointer"
              >
                <span>Reset Data Bawaan</span>
              </button>
            </div>
          </div>
        </div>
      )}

        {/* TAB 6: KEAMANAN & PROTEKSI MENU PENGATURAN */}
        {activeTab === 'keamanan' && (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-amber-600" />
                  <span>Keamanan Akses Menu Pengaturan (Hanya Anda yang Bisa Buka)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Menu Pengaturan kini terproteksi dengan PIN. Siapa pun yang mengakses website ini di perangkat lain tidak akan bisa membuka menu ini tanpa izin PIN dari Anda.
                </p>
              </div>
              <button
                onClick={() => {
                  if (confirm('Kunci menu Pengaturan sekarang?')) {
                    lockAdmin();
                  }
                }}
                className="text-xs px-3.5 py-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5 font-bold cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Kunci Pengaturan Sekarang</span>
              </button>
            </div>

            {pinSuccessNotice && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">
                  PIN Administrator berhasil diperbarui dan disinkronkan ke Cloud Firebase!
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Card Status Proteksi */}
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span>Status Proteksi Menu: AKTIF</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mt-2">
                    Orang lain yang membuka website Buku Kas ini melalui link Vercel publik <strong>hanya dapat melihat data kas/peserta</strong> dan <strong>TIDAK BISA membuka menu Pengaturan</strong> tanpa PIN rahasia Anda.
                  </p>
                  <div className="mt-3 p-3 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-600 space-y-1">
                    <p>• PIN Default Awal: <span className="font-mono font-bold text-slate-800">1234</span></p>
                    <p>• Status di Perangkat ini: <span className="font-semibold text-emerald-700">Terverifikasi (Admin)</span></p>
                    <p>• Sinkronisasi: <span className="text-slate-500">Tersimpan di Cloud Database Firebase</span></p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      lockAdmin();
                    }}
                    className="w-full text-xs px-3.5 py-2 font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Kunci / Logout dari Mode Admin di Perangkat Ini</span>
                  </button>
                </div>
              </div>

              {/* Form Ganti PIN */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newAdminPin.trim() || newAdminPin.trim().length < 4) {
                    setPinError('PIN minimal harus 4 karakter (angka/huruf)');
                    return;
                  }
                  if (newAdminPin.trim() !== confirmAdminPin.trim()) {
                    setPinError('Konfirmasi PIN tidak cocok dengan PIN baru');
                    return;
                  }
                  changeAdminPin(newAdminPin.trim());
                  setPinError('');
                  setNewAdminPin('');
                  setConfirmAdminPin('');
                  setPinSuccessNotice(true);
                  setTimeout(() => setPinSuccessNotice(false), 4000);
                }}
                className="p-5 rounded-xl border border-amber-200/80 bg-amber-50/30 space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <KeyRound className="w-4 h-4 text-amber-600" />
                    <span>Ubah PIN Administrator</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Ganti PIN bawaan agar hanya Anda sendiri yang mengetahui kuncinya.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      PIN Baru (Minimal 4 Karakter)
                    </label>
                    <input
                      type="password"
                      placeholder="Contoh: 8899 atau kata sandi Anda"
                      value={newAdminPin}
                      onChange={(e) => {
                        setNewAdminPin(e.target.value);
                        if (pinError) setPinError('');
                      }}
                      className="w-full text-xs px-3.5 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-mono tracking-widest"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Konfirmasi PIN Baru
                    </label>
                    <input
                      type="password"
                      placeholder="Masukkan ulang PIN baru Anda"
                      value={confirmAdminPin}
                      onChange={(e) => {
                        setConfirmAdminPin(e.target.value);
                        if (pinError) setPinError('');
                      }}
                      className="w-full text-xs px-3.5 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-mono tracking-widest"
                    />
                  </div>

                  {pinError && (
                    <p className="text-[11px] text-rose-600 font-bold bg-rose-50 border border-rose-200 p-2 rounded-lg">
                      {pinError}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 text-amber-400" />
                  <span>Simpan & Terapkan PIN Baru</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
