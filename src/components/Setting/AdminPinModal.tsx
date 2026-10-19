import React, { useState } from 'react';
import { Lock, KeyRound, Eye, EyeOff, ShieldCheck, X } from 'lucide-react';
import { useKas } from '../../context/KasContext';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { verifyAdminPin, setIsAdminUnlocked, setActiveMenu } = useKas();
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setErrorMsg('Mohon masukkan PIN Administrator');
      return;
    }

    const isValid = verifyAdminPin(pin);
    if (isValid) {
      setIsAdminUnlocked(true);
      if (rememberDevice) {
        try {
          localStorage.setItem('kas_admin_device_authorized', 'true');
        } catch (e) {
          console.error('Failed to set localStorage', e);
        }
      }
      setErrorMsg('');
      setPin('');
      setActiveMenu('setting');
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setErrorMsg('PIN salah! Mohon masukkan PIN Administrator yang benar.');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 to-[#0c192d] text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm tracking-wide">
                Verifikasi Administrator
              </h2>
              <p className="text-[11px] text-slate-300">
                Menu Pengaturan Khusus Pemilik
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Halaman pengaturan sistem dibatasi agar tidak dapat diakses atau diubah oleh perangkat lain. Silakan masukkan PIN Administrator Anda.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
              <span>PIN Administrator</span>
            </label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                autoFocus
                placeholder="Masukkan PIN (Default: 1234)"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                className="w-full text-sm tracking-widest px-3.5 py-2.5 pr-10 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errorMsg && (
              <p className="text-[11px] text-rose-600 font-semibold mt-1.5">
                {errorMsg}
              </p>
            )}
            <p className="text-[11px] text-slate-400 mt-1">
              * PIN awal default adalah <span className="font-mono font-bold text-slate-600">1234</span> (dapat Anda ubah kapan saja).
            </p>
          </div>

          {/* Remember this device checkbox */}
          <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
              className="mt-0.5 rounded text-amber-600 focus:ring-amber-500"
            />
            <div className="text-[11px] text-slate-600">
              <span className="font-bold text-slate-800 block">
                Ingat status Admin di perangkat ini
              </span>
              <span>
                Perangkat ini tidak akan meminta PIN lagi, sedangkan perangkat orang lain tetap terkunci.
              </span>
            </div>
          </label>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Buka Pengaturan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
