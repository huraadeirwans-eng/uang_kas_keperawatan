import React, { useState, useEffect } from 'react';
import { X, Check, User, Briefcase, Building2 } from 'lucide-react';
import {
  Participant,
  ParticipantPosition,
  ParticipantWorkUnit,
  PARTICIPANT_POSITIONS,
  PARTICIPANT_WORK_UNITS,
} from '../../types';
import { useKas } from '../../context/KasContext';

interface ParticipantFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editParticipant?: Participant | null;
}

export const ParticipantFormModal: React.FC<ParticipantFormModalProps> = ({
  isOpen,
  onClose,
  editParticipant,
}) => {
  const { addParticipant, updateParticipant } = useKas();

  const [name, setName] = useState('');
  const [position, setPosition] = useState<ParticipantPosition>('Staff Pelaksana');
  const [workUnit, setWorkUnit] = useState<ParticipantWorkUnit>('Emergency Unit');

  useEffect(() => {
    if (editParticipant) {
      setName(editParticipant.name || '');
      setPosition((editParticipant.position as ParticipantPosition) || 'Staff Pelaksana');
      setWorkUnit((editParticipant.workUnit as ParticipantWorkUnit) || (editParticipant.groupOrDepartment as ParticipantWorkUnit) || 'Emergency Unit');
    } else {
      setName('');
      setPosition('Staff Pelaksana');
      setWorkUnit('Emergency Unit');
    }
  }, [editParticipant, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Mohon masukkan Nama Lengkap!');
      return;
    }

    if (editParticipant) {
      updateParticipant(editParticipant.id, {
        name: name.trim(),
        position,
        workUnit,
        groupOrDepartment: workUnit,
      });
    } else {
      addParticipant({
        name: name.trim(),
        position,
        workUnit,
        groupOrDepartment: workUnit,
        targetAmount: 250000,
        totalPaid: 0,
        joinedDate: new Date().toISOString().split('T')[0],
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-sm">
                {editParticipant ? 'Ubah Data Peserta' : 'Tambah Peserta Baru'}
              </h2>
              <p className="text-[11px] text-slate-500">
                Input Nama Lengkap, Jabatan & Unit Kerja
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Field 1: Nama Lengkap */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span>Nama Lengkap *</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Contoh: dr. Budi Santoso, Sp.A / Ns. Siti Rahmawati, S.Kep"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
            />
          </div>

          {/* Field 2: Jabatan (Dropdown) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-blue-600" />
              <span>Jabatan *</span>
            </label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value as ParticipantPosition)}
              className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-white"
            >
              {PARTICIPANT_POSITIONS.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          </div>

          {/* Field 3: Unit Kerja (Dropdown) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Unit Kerja *</span>
            </label>
            <select
              value={workUnit}
              onChange={(e) => setWorkUnit(e.target.value as ParticipantWorkUnit)}
              className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-hidden bg-white"
            >
              {PARTICIPANT_WORK_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{editParticipant ? 'Simpan Perubahan' : 'Tambah Peserta'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
