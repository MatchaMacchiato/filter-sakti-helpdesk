export type OperationMode = 'WSA' | 'MODOROSO' | 'WAPPR';
export type AppStatus = 'idle' | 'parsing' | 'processing' | 'complete' | 'error';

export interface ProcessedData {
  filtered: DataRow[];
  unique: DataRow[];      // kolom reordered (sesuai tabel)
  uniqueRaw: DataRow[];   // semua kolom asli (tanpa format)
  checkColumn: string;
  columns: string[];
}

export interface DataRow {
  [key: string]: string | number | boolean | null;
}

export interface FileParseResult {
  data: DataRow[];
  columns: string[];
  rowCount: number;
}

export interface ProcessingMetrics {
  filtered: number;
  unique: number;
  checkColumn: string;
}

export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

export const WSA_COLUMNS = [
  'Date Created', 'Workorder', 'SC Order No/Track ID/CSRM No',
  'Service No.', 'CRM Order Type', 'Status', 'Address',
  'Customer Name', 'Workzone', 'Booking Date', 'Contact Number'
];

export const MODOROSO_COLUMNS = [
  'Date Created', 'Workorder', 'SC Order No/Track ID/CSRM No',
  'Service No.', 'CRM Order Type', 'Status', 'Address',
  'Customer Name', 'Workzone', 'Contact Number', 'Mitra'
];
