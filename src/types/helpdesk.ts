// Data yang diinput oleh Admin (Master Data)
export interface AdminData {
  id: string;
  inet: string;
  scOrder: string;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

// Data yang diinput oleh Siswa Helpdesk (Progress Data)
export interface HelpdeskData {
  id: string;
  adminDataId: string; // Referensi ke data admin
  inet: string; // Copy dari admin untuk kemudahan
  scOrder: string; // Copy dari admin untuk kemudahan
  namaInput: string; // Nama penginput (Agent Helpdesk)
  kendala: string;
  kategori: 'Setting' | 'Non Setting' | '';
  eskalasi: string;
  statusBima: StatusBima;
  createdAt: string;
  updatedAt: string;
}

export type StatusBima = 'COMPWORK' | 'WAPPR' | 'INSTCOMP' | 'ACTCOMP' | 'CANCLWORK' | 'WORKFAIL';

export const STATUS_BIMA_OPTIONS: StatusBima[] = [
  'COMPWORK',
  'WAPPR',
  'INSTCOMP',
  'ACTCOMP',
  'CANCLWORK',
  'WORKFAIL'
];

// Helper untuk mendapatkan label yang lebih readable
export const getStatusLabel = (status: StatusBima): string => {
  const labels: Record<StatusBima, string> = {
    'COMPWORK': 'Complete Work',
    'WAPPR': 'Waiting Approval',
    'INSTCOMP': 'Install Complete',
    'ACTCOMP': 'Activity Complete',
    'CANCLWORK': 'Cancel Work',
    'WORKFAIL': 'Work Failed'
  };
  return labels[status] || status;
};

// ---- Bulk Input / Progress Data ----

export type Segment = 'JAKTIM' | 'JAKSEL' | 'JAKPUS';

export const SEGMENT_LIST: Segment[] = ['JAKTIM', 'JAKSEL', 'JAKPUS'];

export const SEGMENT_LABELS: Record<Segment, string> = {
  JAKTIM: 'Jakarta Timur',
  JAKSEL: 'Jakarta Selatan',
  JAKPUS: 'Jakarta Pusat',
};

export const SEGMENT_COLORS: Record<Segment, { bg: string; text: string; border: string }> = {
  JAKTIM: { bg: '#EEF2FF', text: '#4338CA', border: '#C7D2FE' },
  JAKSEL: { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' },
  JAKPUS: { bg: '#DCFCE7', text: '#166534', border: '#BBF7D0' },
};

export const AREA_MAPPING: Record<Segment, string[]> = {
  JAKTIM: ['CWA', 'GAN', 'JTN', 'KLD', 'KRG', 'PDK', 'PGB', 'PGG', 'PSR', 'RMG'],
  JAKSEL: ['BIN', 'PSM', 'JAG', 'KAL', 'TBE', 'KMG', 'CPE', 'KBY'],
  JAKPUS: ['CID', 'CPP', 'GBC', 'GBI', 'KMY']
};

export const ESKALASI_OPTIONS = [
  'KENDALA PELANGGAN - BATAL',
  'CABUT INPUL',
  'ESKALASI DIT',
  'ESKALASI BIMA',
  'ESKALASI TSEL SLCS',
  'ORDER SMOOA - ORBIT',
  'ORDER SIP TRUNK/DATIN',
  'ESKALASI DAMAN',
  'ORDER WIFI.ID',
  'ORDER WIFI MESH - 2nd STB',
  'ESKALASI BES FIX',
  'ESKALASI ASO-MARS',
  'ESKALASI MARS',
  'ESKALASI TSEL ALTER AAA',
  'CABUT INPUL LOS TTI',
  'CLOSED',
  'TA FU AREA'
] as const;

export const SOLVER_LIST = [
  'HD ISH - DHEO',
  'HD ISH - AZHRYAN',
  'HD ISH - FAHRUL',
  'HD ISH - ANIS',
  'HD ISH - REIHAN',
  'HD ISH - ALYA',
  'HD ISH - IKA',
  'HD REGULER - SYAHID',
  'HD REGULER - SETYO',
  'HD REGULER - BENI',
  'HD REGULER - RIZAL',
  'HD REGULER - ETI',
  'HD REGULER - MUTIA',
  'HD REGULER - VARA',
  'HD REGULER - FINADIA',
  'HD REGULER - TETEP',
  'HD REGULER - HERMAN',
  'HD REGULER - VIKA',
  'HD REGULER - RIKI',
  'HD REGULER - MAHESA',
  'HD REGULER - DIAN',
  'HD REGULER - AYU',
  'HD REGULER - INTAN',
  'HD REGULER - DIMAS',
  'HD REGULER - WAHYU',
  'HD REGULER - FIKRI',
  'HD REGULER - AZI',
  'HD REGULER - ANDES',
  'HD REGULER - BAIHAQI',
  'HD REGULER - DAFFA',
  'HD REGULER - IQBAL',
] as const;

// Data progress yang diinput dari Filter Sakti
export interface HelpdeskProgressData {
  id: string;
  // Dari Filter Sakti
  dateCreated: string;
  workorder: string;
  scOrder: string;
  serviceNo: string;
  crmOrderType: string;
  status: string;
  address: string;
  customerName: string;
  workzone: string;
  bookingDate?: string;
  contactNumber?: string;
  mitra?: string;
  // User input
  segment: Segment;
  solver: string;
  inputBy: string;
  filterMode: string;
  batchId: string;
  createdAt: string;
}

// Task dari Filter Sakti yang perlu dikerjakan solver
export type TaskStatus = 'pending' | 'completed';

export interface HelpdeskTask {
  id: string;
  // Data dari Filter Sakti
  dateCreated: string;
  workorder: string;
  scOrder: string;
  serviceNo: string;
  crmOrderType: string;
  filterStatus: string;
  address: string;
  customerName: string;
  workzone: string;
  bookingDate: string;
  contactNumber: string;
  mitra: string;
  // Assignment
  segment: Segment;
  filterMode: string;
  batchId: string;
  importedBy: string;
  importedAt: string;
  // Solver progress
  solver: string;
  kendala: string;
  kategori: 'Setting' | 'Non Setting' | '';
  eskalasi: string;
  statusBima: StatusBima | '';
  taskStatus: TaskStatus;
  updatedBy: string;
  updatedAt: string;
}
