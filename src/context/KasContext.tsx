import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import {
  db,
  handleFirestoreError,
  OperationType,
  testFirestoreConnection,
} from '../firebase';
import {
  DEFAULT_SETTINGS,
  INITIAL_EXPENSES,
  INITIAL_INCOMES,
  INITIAL_PARTICIPANTS,
} from '../data/initialData';
import {
  AppSettings,
  Expense,
  Income,
  NavigationMenu,
  Participant,
  PaymentMethod,
} from '../types';

export type SyncStatus = 'connecting' | 'synced' | 'offline';

interface KasContextType {
  activeMenu: NavigationMenu;
  setActiveMenu: (menu: NavigationMenu) => void;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  resetSettings: () => void;

  incomes: Income[];
  addIncome: (data: Omit<Income, 'id' | 'code' | 'createdAt'>) => string;
  updateIncome: (id: string, data: Partial<Income>) => void;
  deleteIncome: (id: string) => void;

  expenses: Expense[];
  addExpense: (data: Omit<Expense, 'id' | 'code' | 'createdAt'>) => string;
  updateExpense: (id: string, data: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  participants: Participant[];
  addParticipant: (data: Omit<Participant, 'id'>) => string;
  updateParticipant: (id: string, data: Partial<Participant>) => void;
  deleteParticipant: (id: string) => void;
  recordParticipantPayment: (
    participantId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    date: string,
    notes?: string
  ) => void;

  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  participantStats: {
    total: number;
    fullyPaid: number;
    partialPaid: number;
    unpaid: number;
    totalCollected: number;
    totalTarget: number;
    percentage: number;
  };

  exportFullDataJSON: () => void;
  importFullDataJSON: (jsonString: string) => boolean;
  resetToSampleData: () => void;
  clearAllData: () => void;

  isPrintReportOpen: boolean;
  setIsPrintReportOpen: (open: boolean) => void;

  // Cloud Sync Status
  syncStatus: SyncStatus;
  isCloudSyncActive: boolean;

  // Admin Security (Menu Pengaturan)
  isAdminUnlocked: boolean;
  setIsAdminUnlocked: (unlocked: boolean) => void;
  verifyAdminPin: (pin: string) => boolean;
  lockAdmin: () => void;
  changeAdminPin: (newPin: string) => void;
}

const KasContext = createContext<KasContextType | undefined>(undefined);

export const STORAGE_KEYS = {
  SETTINGS: 'kas_pro_settings_v1',
  INCOMES: 'kas_pro_incomes_v1',
  EXPENSES: 'kas_pro_expenses_v1',
  PARTICIPANTS: 'kas_pro_participants_v1',
};

// Safe storage writing with quota handling
const safeSaveStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err: any) {
    console.error(`[LocalStorage] Error writing key "${key}":`, err);
    if (err && (err.name === 'QuotaExceededError' || err.code === 22)) {
      if (key === STORAGE_KEYS.EXPENSES && Array.isArray(data)) {
        try {
          const lightweightExpenses = data.map((exp: Expense, idx: number) => {
            if (idx >= 10 && exp.receiptImage && exp.receiptImage.startsWith('data:')) {
              return { ...exp, receiptImage: undefined };
            }
            return exp;
          });
          localStorage.setItem(key, JSON.stringify(lightweightExpenses));
        } catch (inner) {
          console.error('[LocalStorage] Secondary mitigation failed', inner);
        }
      }
    }
  }
};

// Remove undefined values to comply with Firestore schema requirements
function sanitizeForFirestore<T extends Record<string, any>>(data: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

export const KasProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeMenu, setActiveMenu] = useState<NavigationMenu>('dashboard');
  const [isPrintReportOpen, setIsPrintReportOpen] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('connecting');

  // Admin Security (Menu Pengaturan Terkunci Khusus Pemilik)
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem('kas_admin_device_authorized') === 'true';
    } catch (e) {
      return false;
    }
  });

  const verifyAdminPin = (inputPin: string): boolean => {
    const currentPin = (settings.adminPin || '1234').trim();
    return inputPin.trim() === currentPin;
  };

  const lockAdmin = () => {
    setIsAdminUnlocked(false);
    try {
      localStorage.removeItem('kas_admin_device_authorized');
    } catch (e) {}
    if (activeMenu === 'setting') {
      setActiveMenu('dashboard');
    }
  };

  const changeAdminPin = (newPin: string) => {
    updateSettings({ adminPin: newPin.trim() });
  };

  // If not unlocked, never allow activeMenu to remain on setting
  useEffect(() => {
    if (!isAdminUnlocked && activeMenu === 'setting') {
      setActiveMenu('dashboard');
    }
  }, [isAdminUnlocked, activeMenu]);

  // Settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (parsed.orgName === 'KAS UTAMA') {
          parsed.orgName = 'STRUKTURAL NURSING';
        }
        if (
          parsed.landscapeLogoUrl &&
          (parsed.landscapeLogoUrl.includes('logo_kas_landscape') ||
            parsed.landscapeLogoUrl.includes('1792124138581'))
        ) {
          parsed.landscapeLogoUrl = '';
        }
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (e) {
      console.error('Failed reading settings from localStorage', e);
    }
    return DEFAULT_SETTINGS;
  });

  // Incomes
  const [incomes, setIncomes] = useState<Income[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INCOMES);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed reading incomes from localStorage', e);
    }
    return INITIAL_INCOMES;
  });

  // Expenses
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((exp: Expense) => {
            if (
              exp.receiptImage &&
              (exp.receiptImage.includes('sample_nota_belanja') ||
                exp.receiptImage.includes('1792124139795') ||
                exp.receiptImage === '/src/assets/images/sample_nota_belanja_1792124139795.jpg')
            ) {
              return { ...exp, receiptImage: undefined };
            }
            return exp;
          });
        }
      }
    } catch (e) {
      console.error('Failed reading expenses from localStorage', e);
    }
    return INITIAL_EXPENSES;
  });

  // Participants
  const [participants, setParticipants] = useState<Participant[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PARTICIPANTS);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed reading participants from localStorage', e);
    }
    return INITIAL_PARTICIPANTS;
  });

  // Save to localStorage immediately on any state change for instant offline cache
  useEffect(() => {
    safeSaveStorage(STORAGE_KEYS.SETTINGS, settings);
  }, [settings]);

  useEffect(() => {
    safeSaveStorage(STORAGE_KEYS.INCOMES, incomes);
  }, [incomes]);

  useEffect(() => {
    safeSaveStorage(STORAGE_KEYS.EXPENSES, expenses);
  }, [expenses]);

  useEffect(() => {
    safeSaveStorage(STORAGE_KEYS.PARTICIPANTS, participants);
  }, [participants]);

  // Real-time Cloud Synchronization via Firebase Firestore
  useEffect(() => {
    testFirestoreConnection();

    // 1. Listen to Settings Document
    const unsubSettings = onSnapshot(
      doc(db, 'settings', 'global'),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as AppSettings;
          setSettings((prev) => ({ ...prev, ...data }));
          setSyncStatus('synced');
        } else {
          // Initialize settings document in cloud if not existing
          setDoc(doc(db, 'settings', 'global'), sanitizeForFirestore(settings)).catch((err) =>
            handleFirestoreError(err, OperationType.WRITE, 'settings/global')
          );
        }
      },
      (error) => {
        console.warn('Settings firestore sync error:', error);
        setSyncStatus('offline');
        handleFirestoreError(error, OperationType.GET, 'settings/global');
      }
    );

    // 2. Listen to Incomes Collection
    const unsubIncomes = onSnapshot(
      collection(db, 'incomes'),
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudIncomes: Income[] = [];
          snapshot.forEach((d) => {
            cloudIncomes.push(d.data() as Income);
          });
          cloudIncomes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setIncomes(cloudIncomes);
          setSyncStatus('synced');
        } else {
          // First-time seed from current initial/local incomes to Firestore
          const initial = incomes.length > 0 ? incomes : INITIAL_INCOMES;
          initial.forEach((inc) => {
            setDoc(doc(db, 'incomes', inc.id), sanitizeForFirestore(inc)).catch((err) =>
              handleFirestoreError(err, OperationType.WRITE, `incomes/${inc.id}`)
            );
          });
        }
      },
      (error) => {
        console.warn('Incomes firestore sync error:', error);
        setSyncStatus('offline');
        handleFirestoreError(error, OperationType.GET, 'incomes');
      }
    );

    // 3. Listen to Expenses Collection
    const unsubExpenses = onSnapshot(
      collection(db, 'expenses'),
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudExpenses: Expense[] = [];
          snapshot.forEach((d) => {
            cloudExpenses.push(d.data() as Expense);
          });
          cloudExpenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setExpenses(cloudExpenses);
          setSyncStatus('synced');
        } else {
          // First-time seed from current initial/local expenses to Firestore
          const initial = expenses.length > 0 ? expenses : INITIAL_EXPENSES;
          initial.forEach((exp) => {
            setDoc(doc(db, 'expenses', exp.id), sanitizeForFirestore(exp)).catch((err) =>
              handleFirestoreError(err, OperationType.WRITE, `expenses/${exp.id}`)
            );
          });
        }
      },
      (error) => {
        console.warn('Expenses firestore sync error:', error);
        setSyncStatus('offline');
        handleFirestoreError(error, OperationType.GET, 'expenses');
      }
    );

    // 4. Listen to Participants Collection
    const unsubParticipants = onSnapshot(
      collection(db, 'participants'),
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudParticipants: Participant[] = [];
          snapshot.forEach((d) => {
            cloudParticipants.push(d.data() as Participant);
          });
          setParticipants(cloudParticipants);
          setSyncStatus('synced');
        } else {
          // First-time seed from current initial/local participants to Firestore
          const initial = participants.length > 0 ? participants : INITIAL_PARTICIPANTS;
          initial.forEach((p) => {
            setDoc(doc(db, 'participants', p.id), sanitizeForFirestore(p)).catch((err) =>
              handleFirestoreError(err, OperationType.WRITE, `participants/${p.id}`)
            );
          });
        }
      },
      (error) => {
        console.warn('Participants firestore sync error:', error);
        setSyncStatus('offline');
        handleFirestoreError(error, OperationType.GET, 'participants');
      }
    );

    return () => {
      unsubSettings();
      unsubIncomes();
      unsubExpenses();
      unsubParticipants();
    };
  }, []);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    setDoc(doc(db, 'settings', 'global'), sanitizeForFirestore(updated), { merge: true }).catch((err) =>
      handleFirestoreError(err, OperationType.WRITE, 'settings/global')
    );
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    setDoc(doc(db, 'settings', 'global'), sanitizeForFirestore(DEFAULT_SETTINGS)).catch((err) =>
      handleFirestoreError(err, OperationType.WRITE, 'settings/global')
    );
  };

  const generateIncomeCode = () => {
    const d = new Date();
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const seq = String(incomes.length + 1).padStart(3, '0');
    return `IN-${yy}${mm}-${seq}`;
  };

  const generateExpenseCode = () => {
    const d = new Date();
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const seq = String(expenses.length + 1).padStart(3, '0');
    return `OUT-${yy}${mm}-${seq}`;
  };

  const addIncome = (data: Omit<Income, 'id' | 'code' | 'createdAt'>) => {
    const id = `inc-${Date.now()}`;
    const code = generateIncomeCode();

    let position = data.position;
    let workUnit = data.workUnit;
    if (data.participantId) {
      const p = participants.find((item) => item.id === data.participantId);
      if (p) {
        position = position || (p.position as string);
        workUnit = workUnit || (p.workUnit || p.groupOrDepartment);
      }
    } else if (data.source) {
      const p = participants.find((item) => item.name.trim().toLowerCase() === data.source.trim().toLowerCase());
      if (p) {
        position = position || (p.position as string);
        workUnit = workUnit || (p.workUnit || p.groupOrDepartment);
      }
    }

    const newInc: Income = {
      ...data,
      position,
      workUnit,
      id,
      code,
      createdAt: new Date().toISOString(),
    };

    setIncomes((prev) => [newInc, ...prev]);

    // Save to Firestore
    setDoc(doc(db, 'incomes', id), sanitizeForFirestore(newInc)).catch((err) =>
      handleFirestoreError(err, OperationType.WRITE, `incomes/${id}`)
    );

    // If tied to participant and status is Lunas, update participant's totalPaid
    if (data.status === 'Lunas') {
      const targetP = data.participantId
        ? participants.find((p) => p.id === data.participantId)
        : data.source
        ? participants.find((p) => p.name.trim().toLowerCase() === data.source.trim().toLowerCase())
        : undefined;

      if (targetP) {
        const newTotalPaid = targetP.totalPaid + data.amount;
        setParticipants((prev) =>
          prev.map((p) => (p.id === targetP.id ? { ...p, totalPaid: newTotalPaid } : p))
        );
        setDoc(doc(db, 'participants', targetP.id), { totalPaid: newTotalPaid }, { merge: true }).catch((err) =>
          handleFirestoreError(err, OperationType.UPDATE, `participants/${targetP.id}`)
        );
      }
    }

    return id;
  };

  const updateIncome = (id: string, data: Partial<Income>) => {
    const existing = incomes.find((item) => item.id === id);
    if (existing) {
      const oldAmount = existing.status === 'Lunas' ? existing.amount : 0;
      const nextStatus = data.status ?? existing.status;
      const nextAmount = nextStatus === 'Lunas' ? (data.amount ?? existing.amount) : 0;
      const delta = nextAmount - oldAmount;

      const pId = data.participantId ?? existing.participantId;
      const pName = (data.source ?? existing.source).trim().toLowerCase();

      if (delta !== 0) {
        const targetP = pId
          ? participants.find((p) => p.id === pId)
          : participants.find((p) => p.name.trim().toLowerCase() === pName);

        if (targetP) {
          const newTotalPaid = Math.max(0, targetP.totalPaid + delta);
          setParticipants((prev) =>
            prev.map((p) => (p.id === targetP.id ? { ...p, totalPaid: newTotalPaid } : p))
          );
          setDoc(doc(db, 'participants', targetP.id), { totalPaid: newTotalPaid }, { merge: true }).catch((err) =>
            handleFirestoreError(err, OperationType.UPDATE, `participants/${targetP.id}`)
          );
        }
      }
    }

    setIncomes((prev) => prev.map((item) => (item.id === id ? { ...item, ...data } : item)));

    setDoc(doc(db, 'incomes', id), sanitizeForFirestore(data), { merge: true }).catch((err) =>
      handleFirestoreError(err, OperationType.UPDATE, `incomes/${id}`)
    );
  };

  const deleteIncome = (id: string) => {
    const target = incomes.find((i) => i.id === id);
    if (target && target.status === 'Lunas') {
      const partId = target.participantId;
      const partName = target.source.trim().toLowerCase();
      const targetP = partId
        ? participants.find((p) => p.id === partId)
        : participants.find((p) => p.name.trim().toLowerCase() === partName);

      if (targetP) {
        const newTotalPaid = Math.max(0, targetP.totalPaid - target.amount);
        setParticipants((prev) =>
          prev.map((p) => (p.id === targetP.id ? { ...p, totalPaid: newTotalPaid } : p))
        );
        setDoc(doc(db, 'participants', targetP.id), { totalPaid: newTotalPaid }, { merge: true }).catch((err) =>
          handleFirestoreError(err, OperationType.UPDATE, `participants/${targetP.id}`)
        );
      }
    }

    setIncomes((prev) => prev.filter((item) => item.id !== id));
    deleteDoc(doc(db, 'incomes', id)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, `incomes/${id}`)
    );
  };

  const addExpense = (data: Omit<Expense, 'id' | 'code' | 'createdAt'>) => {
    const id = `exp-${Date.now()}`;
    const code = generateExpenseCode();
    const newExp: Expense = {
      ...data,
      id,
      code,
      createdAt: new Date().toISOString(),
    };

    setExpenses((prev) => [newExp, ...prev]);

    setDoc(doc(db, 'expenses', id), sanitizeForFirestore(newExp)).catch((err) =>
      handleFirestoreError(err, OperationType.WRITE, `expenses/${id}`)
    );

    return id;
  };

  const updateExpense = (id: string, data: Partial<Expense>) => {
    setExpenses((prev) => prev.map((item) => (item.id === id ? { ...item, ...data } : item)));
    setDoc(doc(db, 'expenses', id), sanitizeForFirestore(data), { merge: true }).catch((err) =>
      handleFirestoreError(err, OperationType.UPDATE, `expenses/${id}`)
    );
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((item) => item.id !== id));
    deleteDoc(doc(db, 'expenses', id)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, `expenses/${id}`)
    );
  };

  const addParticipant = (data: Omit<Participant, 'id'>) => {
    const id = `p-${Date.now()}`;
    const newPart: Participant = { ...data, id };
    setParticipants((prev) => [...prev, newPart]);

    setDoc(doc(db, 'participants', id), sanitizeForFirestore(newPart)).catch((err) =>
      handleFirestoreError(err, OperationType.WRITE, `participants/${id}`)
    );

    return id;
  };

  const updateParticipant = (id: string, data: Partial<Participant>) => {
    setParticipants((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
    setDoc(doc(db, 'participants', id), sanitizeForFirestore(data), { merge: true }).catch((err) =>
      handleFirestoreError(err, OperationType.UPDATE, `participants/${id}`)
    );
  };

  const deleteParticipant = (id: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
    deleteDoc(doc(db, 'participants', id)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, `participants/${id}`)
    );
  };

  const recordParticipantPayment = (
    participantId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    date: string,
    notes?: string
  ) => {
    const participant = participants.find((p) => p.id === participantId);
    if (!participant) return;

    const d = new Date();
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const seq = String(incomes.length + 1).padStart(3, '0');
    const receiptSeq = String(incomes.length + 101).padStart(3, '0');

    const incId = `inc-${Date.now()}`;
    const newInc: Income = {
      id: incId,
      code: `IN-${yy}${mm}-${seq}`,
      date: date || new Date().toISOString().split('T')[0],
      category: 'Iuran Wajib Peserta',
      source: participant.name,
      participantId: participant.id,
      position: participant.position as string,
      workUnit: (participant.workUnit || participant.groupOrDepartment) as string,
      amount,
      paymentMethod,
      status: 'Lunas',
      notes: notes || `Pembayaran iuran dari ${participant.name} (${participant.groupOrDepartment || participant.workUnit})`,
      receiptNumber: `KW-${yy}${mm}-${receiptSeq}`,
      createdAt: new Date().toISOString(),
    };

    setIncomes((prev) => [newInc, ...prev]);

    setDoc(doc(db, 'incomes', incId), sanitizeForFirestore(newInc)).catch((err) =>
      handleFirestoreError(err, OperationType.WRITE, `incomes/${incId}`)
    );

    const newTotalPaid = participant.totalPaid + amount;
    setParticipants((prev) =>
      prev.map((p) => (p.id === participantId ? { ...p, totalPaid: newTotalPaid } : p))
    );

    setDoc(doc(db, 'participants', participantId), { totalPaid: newTotalPaid }, { merge: true }).catch((err) =>
      handleFirestoreError(err, OperationType.UPDATE, `participants/${participantId}`)
    );
  };

  // Calculations
  const totalIncome = incomes
    .filter((i) => i.status === 'Lunas')
    .reduce((sum, item) => sum + item.amount, 0);

  const totalExpense = expenses
    .filter((e) => e.status === 'Selesai')
    .reduce((sum, item) => sum + item.amount, 0);

  const netBalance = totalIncome - totalExpense;

  const totalTarget = participants.reduce((sum, p) => sum + (p.targetAmount || 0), 0);
  const totalCollected = participants.reduce((sum, p) => sum + (p.totalPaid || 0), 0);
  const fullyPaid = participants.filter((p) => p.totalPaid >= p.targetAmount && p.targetAmount > 0).length;
  const partialPaid = participants.filter((p) => p.totalPaid > 0 && p.totalPaid < p.targetAmount).length;
  const unpaid = participants.filter((p) => p.totalPaid === 0).length;
  const percentage = totalTarget > 0 ? Math.round((totalCollected / totalTarget) * 100) : 0;

  const participantStats = {
    total: participants.length,
    fullyPaid,
    partialPaid,
    unpaid,
    totalCollected,
    totalTarget,
    percentage,
  };

  const exportFullDataJSON = () => {
    const backupData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      settings,
      incomes,
      expenses,
      participants,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_buku_kas_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const importFullDataJSON = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.settings) {
        setSettings(parsed.settings);
        setDoc(doc(db, 'settings', 'global'), sanitizeForFirestore(parsed.settings), { merge: true });
      }
      if (Array.isArray(parsed.incomes)) {
        setIncomes(parsed.incomes);
        parsed.incomes.forEach((inc: Income) => {
          setDoc(doc(db, 'incomes', inc.id), sanitizeForFirestore(inc), { merge: true });
        });
      }
      if (Array.isArray(parsed.expenses)) {
        setExpenses(parsed.expenses);
        parsed.expenses.forEach((exp: Expense) => {
          setDoc(doc(db, 'expenses', exp.id), sanitizeForFirestore(exp), { merge: true });
        });
      }
      if (Array.isArray(parsed.participants)) {
        setParticipants(parsed.participants);
        parsed.participants.forEach((p: Participant) => {
          setDoc(doc(db, 'participants', p.id), sanitizeForFirestore(p), { merge: true });
        });
      }
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  };

  const resetToSampleData = async () => {
    setSettings(DEFAULT_SETTINGS);
    setIncomes(INITIAL_INCOMES);
    setExpenses(INITIAL_EXPENSES);
    setParticipants(INITIAL_PARTICIPANTS);

    safeSaveStorage(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    safeSaveStorage(STORAGE_KEYS.INCOMES, INITIAL_INCOMES);
    safeSaveStorage(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
    safeSaveStorage(STORAGE_KEYS.PARTICIPANTS, INITIAL_PARTICIPANTS);

    try {
      await setDoc(doc(db, 'settings', 'global'), sanitizeForFirestore(DEFAULT_SETTINGS));
      for (const inc of INITIAL_INCOMES) {
        await setDoc(doc(db, 'incomes', inc.id), sanitizeForFirestore(inc));
      }
      for (const exp of INITIAL_EXPENSES) {
        await setDoc(doc(db, 'expenses', exp.id), sanitizeForFirestore(exp));
      }
      for (const p of INITIAL_PARTICIPANTS) {
        await setDoc(doc(db, 'participants', p.id), sanitizeForFirestore(p));
      }
    } catch (e) {
      console.error('Reset to sample data in cloud failed', e);
    }
  };

  const clearAllData = async () => {
    setIncomes([]);
    setExpenses([]);
    setParticipants([]);

    safeSaveStorage(STORAGE_KEYS.INCOMES, []);
    safeSaveStorage(STORAGE_KEYS.EXPENSES, []);
    safeSaveStorage(STORAGE_KEYS.PARTICIPANTS, []);

    try {
      const incSnap = await getDocs(collection(db, 'incomes'));
      incSnap.forEach((d) => deleteDoc(d.ref));

      const expSnap = await getDocs(collection(db, 'expenses'));
      expSnap.forEach((d) => deleteDoc(d.ref));

      const partSnap = await getDocs(collection(db, 'participants'));
      partSnap.forEach((d) => deleteDoc(d.ref));
    } catch (e) {
      console.error('Clear cloud data failed', e);
    }
  };

  return (
    <KasContext.Provider
      value={{
        activeMenu,
        setActiveMenu,
        settings,
        updateSettings,
        resetSettings,
        incomes,
        addIncome,
        updateIncome,
        deleteIncome,
        expenses,
        addExpense,
        updateExpense,
        deleteExpense,
        participants,
        addParticipant,
        updateParticipant,
        deleteParticipant,
        recordParticipantPayment,
        totalIncome,
        totalExpense,
        netBalance,
        participantStats,
        exportFullDataJSON,
        importFullDataJSON,
        resetToSampleData,
        clearAllData,
        isPrintReportOpen,
        setIsPrintReportOpen,
        syncStatus,
        isCloudSyncActive: syncStatus === 'synced',
        isAdminUnlocked,
        setIsAdminUnlocked,
        verifyAdminPin,
        lockAdmin,
        changeAdminPin,
      }}
    >
      {children}
    </KasContext.Provider>
  );
};

export const useKas = () => {
  const context = useContext(KasContext);
  if (!context) {
    throw new Error('useKas must be used within a KasProvider');
  }
  return context;
};
