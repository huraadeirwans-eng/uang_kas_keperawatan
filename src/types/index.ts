export type NavigationMenu =
  | 'dashboard'
  | 'pendapatan'
  | 'pengeluaran'
  | 'peserta'
  | 'bukti-pengeluaran'
  | 'setting';

export type PaymentMethod = 'QRIS' | 'Transfer' | 'Transfer Bank' | 'Tunai' | 'Cek / Bilyet Giro' | 'Lainnya';

export type IncomeStatus = 'Lunas' | 'Belum Lunas' | 'Tertunda';

export interface Income {
  id: string;
  code: string; // e.g. KAS-IN-2026-001
  date: string; // YYYY-MM-DD (Tanggal Pembayaran)
  period?: string; // Periode Pembayaran (e.g. Oktober)
  year?: string; // Tahun (e.g. 2026)
  category: string;
  acceptanceSource?: string; // Sumber Penerimaan (e.g. Iuran Struktural Nursing)
  source: string; // Nama Lengkap / Pembayar
  participantId?: string; // Optional linked participant
  position?: string; // Optional Jabatan (e.g. Staff Pelaksana, Team Leader)
  workUnit?: string; // Optional Unit Kerja (e.g. Emergency Unit, ICU)
  amount: number; // Nominal
  paymentMethod: PaymentMethod; // Metode Pembayaran
  status: IncomeStatus; // Status Pembaran (Lunas / Tertunda)
  notes?: string; // Keterangan
  receiptNumber?: string;
  createdAt: string;
}

export type ExpenseStatus = 'Selesai' | 'Diajukan' | 'Dibatalkan';

export interface Expense {
  id: string;
  code: string; // e.g. KAS-OUT-2026-001
  date: string; // YYYY-MM-DD
  category: string;
  recipient: string; // Toko / Penerima Dana
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: ExpenseStatus;
  receiptImage?: string; // Base64 or image URL
  receiptNote?: string;
  approvedBy?: string;
  createdAt: string;
}

export type ParticipantPosition =
  | 'Staff Pelaksana'
  | 'Team Leader'
  | 'Departemen Unit Head'
  | 'Nursing Preceptor'
  | 'IPCN'
  | 'Komite Mutu RS'
  | 'Komite Keperawatan'
  | 'MPP';

export type ParticipantWorkUnit =
  | 'Emergency Unit'
  | 'Outpatient Unit'
  | 'Inpatient Unit'
  | 'NICU'
  | 'ICU'
  | 'PICU'
  | 'Operating Theater'
  | 'Delivery Room'
  | 'Nursing Manajemen';

export const PARTICIPANT_POSITIONS: ParticipantPosition[] = [
  'Staff Pelaksana',
  'Team Leader',
  'Departemen Unit Head',
  'Nursing Preceptor',
  'IPCN',
  'Komite Mutu RS',
  'Komite Keperawatan',
  'MPP',
];

export const PARTICIPANT_WORK_UNITS: ParticipantWorkUnit[] = [
  'Emergency Unit',
  'Outpatient Unit',
  'Inpatient Unit',
  'NICU',
  'ICU',
  'PICU',
  'Operating Theater',
  'Delivery Room',
  'Nursing Manajemen',
];

export type ParticipantPaymentStatus = 'Lunas' | 'Sebagian' | 'Belum Bayar';

export interface Participant {
  id: string;
  name: string; // Nama Lengkap
  position: ParticipantPosition | string; // Jabatan
  workUnit: ParticipantWorkUnit | string; // Unit Kerja
  phone?: string;
  groupOrDepartment?: string; // fallback / alias for workUnit
  targetAmount: number;
  totalPaid: number;
  notes?: string;
  joinedDate?: string;
}

export interface AppSettings {
  orgName: string;
  subTitle: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  leaderName: string;
  leaderTitle: string;
  treasurerName: string;
  treasurerTitle: string;
  // Setting Logo Manual (Landscape)
  landscapeLogoUrl: string;
  logoHeight: number; // Height in px (e.g. 52)
  logoAlignment: 'left' | 'center';
  showLogoInAppHeader: boolean;
  showLogoInPrint: boolean;
  showLogoInReceipts: boolean;
  defaultDuesAmount: number;
  categoriesIncome: string[];
  categoriesExpense: string[];
  adminPin?: string; // PIN Pengaturan khusus Administrator
}
