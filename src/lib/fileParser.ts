import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import type { DataRow, FileParseResult } from '@/types';

export async function parseFile(file: File): Promise<FileParseResult> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'csv') {
    return parseCSV(file);
  } else if (ext === 'xlsx' || ext === 'xls') {
    return parseExcel(file);
  }

  throw new Error('Unsupported file format. Please upload .xlsx, .xls, or .csv');
}

function parseCSV(file: File): Promise<FileParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as DataRow[];
        const columns = results.meta.fields || [];
        resolve({ data, columns, rowCount: data.length });
      },
      error: (err) => reject(new Error(`CSV parsing error: ${err.message}`)),
    });
  });
}

function parseExcel(file: File): Promise<FileParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error('Failed to read file');

        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<DataRow>(firstSheet, { defval: '' });

        const columns = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];

        // Convert all values to strings/numbers for consistency
        const normalized = jsonData.map(row => {
          const normalizedRow: DataRow = {};
          for (const [key, val] of Object.entries(row)) {
            if (val === null || val === undefined) {
              normalizedRow[key] = '';
            } else if (typeof val === 'number') {
              normalizedRow[key] = val;
            } else {
              normalizedRow[key] = String(val);
            }
          }
          return normalizedRow;
        });

        resolve({ data: normalized, columns, rowCount: normalized.length });
      } catch (err) {
        reject(new Error(`Excel parsing error: ${err instanceof Error ? err.message : 'Unknown error'}`));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

export function generateExcel(data: DataRow[], filename: string, columnsOrder?: string[]): void {
  // Determine which columns to export and in what order
  const allKeys = data.length > 0 ? Object.keys(data[0]) : [];
  const exportCols = columnsOrder
    ? columnsOrder.filter(c => allKeys.includes(c))  // only cols in target order
    : allKeys;                                         // all columns (tanpa format)

  // Build plain objects with only the needed keys (in order)
  const exportData = data.map(row => {
    const out: Record<string, unknown> = {};
    for (const col of exportCols) {
      out[col] = row[col] ?? '';
    }
    return out;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData, { header: exportCols });

  // Auto column widths
  worksheet['!cols'] = exportCols.map(col => ({
    wch: Math.min(
      Math.max(col.length, ...data.map(r => String(r[col] ?? '').length)) + 2,
      50
    ),
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

