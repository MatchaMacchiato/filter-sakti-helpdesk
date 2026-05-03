import type { DataRow, OperationMode, ProcessedData } from '@/types';
import { WSA_COLUMNS, MODOROSO_COLUMNS } from '@/types';

const SC_COL = 'SC Order No/Track ID/CSRM No';

function toStr(val: unknown): string {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

function cleanWorkorder(val: unknown): string {
  return toStr(val).replace(/\.0$/, '').trim();
}

function cleanBookingDate(val: unknown): string {
  return toStr(val).split('.')[0];
}

function parseDateCreated(val: unknown): Date | null {
  const cleaned = toStr(val).replace(/\.0$/, '');
  const d = new Date(cleaned);
  return isNaN(d.getTime()) ? null : d;
}

function fillContactNumbers(data: DataRow[]): DataRow[] {
  const contactMap = new Map<string, string>();

  for (const row of data) {
    const name = toStr(row['Customer Name']);
    const contact = toStr(row['Contact Number']);
    if (name && contact && contact.toLowerCase() !== 'nan') {
      contactMap.set(name, contact);
    }
  }

  return data.map(row => {
    const name = toStr(row['Customer Name']);
    const contact = toStr(row['Contact Number']);
    if (!contact || contact.toLowerCase() === 'nan' || contact === '') {
      const filled = contactMap.get(name);
      if (filled) {
        return { ...row, 'Contact Number': filled };
      }
    }
    return row;
  });
}

function cleanCommonData(data: DataRow[]): DataRow[] {
  return data.map(row => {
    const cleaned: DataRow = { ...row };
    if ('Workorder' in cleaned) {
      cleaned['Workorder'] = cleanWorkorder(cleaned['Workorder']);
    }
    if ('Booking Date' in cleaned) {
      cleaned['Booking Date'] = cleanBookingDate(cleaned['Booking Date']);
    }
    return cleaned;
  });
}

function processWSA(data: DataRow[]): { filtered: DataRow[]; checkCol: string } {
  let df = data.filter(row => {
    const sc = toStr(row[SC_COL]);
    return /AO|PDA|WSA/i.test(sc);
  });

  if (df.some(r => 'CRM Order Type' in r)) {
    df = df.filter(row => {
      const type = toStr(row['CRM Order Type']).toUpperCase();
      return type === 'CREATE' || type === 'MIGRATE';
    });
  }

  if (df.some(r => 'Contact Number' in r) && df.some(r => 'Customer Name' in r)) {
    df = fillContactNumbers(df);
  }

  return { filtered: df, checkCol: SC_COL };
}

function processMODOROSO(data: DataRow[]): { filtered: DataRow[]; checkCol: string } {
  let df = data.filter(row => {
    const sc = toStr(row[SC_COL]);
    return /-MO|-DO/i.test(sc);
  });

  df = df.map(row => {
    const sc = toStr(row[SC_COL]).toUpperCase();
    let orderType = 'MO';
    if (sc.includes('-DO')) orderType = 'DO';
    else if (sc.includes('-MO')) orderType = 'MO';
    return { ...row, 'CRM Order Type': orderType, 'Mitra': 'TSEL' };
  });

  return { filtered: df, checkCol: 'Workorder' };
}

function processWAPPR(data: DataRow[]): { filtered: DataRow[]; checkCol: string } {
  let df = data.filter(row => {
    const sc = toStr(row[SC_COL]);
    return /AO|PDA/i.test(sc);
  });

  if (df.some(r => 'Status' in r)) {
    df = df.filter(row => {
      const status = toStr(row['Status']).trim().toUpperCase();
      return status === 'WAPPR';
    });
  }

  return { filtered: df, checkCol: 'Workorder' };
}

function applyMonthFilter(data: DataRow[], selectedMonths: number[]): DataRow[] {
  if (!selectedMonths.length) return data;

  return data.filter(row => {
    const dateVal = row['Date Created'];
    const dt = parseDateCreated(dateVal);
    if (!dt) return false;
    const month = dt.getMonth() + 1;
    return selectedMonths.includes(month);
  }).map(row => {
    const dt = parseDateCreated(row['Date Created']);
    if (dt) {
      const formatted = `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
      return { ...row, 'Date Created': formatted };
    }
    return row;
  });
}

function removeDuplicates(data: DataRow[], refData: DataRow[] | null, checkCol: string): DataRow[] {
  if (!refData || !refData.length || !checkCol) return data;

  const existingIds = new Set(
    refData.map(row => toStr(row[checkCol]).replace(/\.0$/, '').trim())
  );

  return data.filter(row => {
    const val = toStr(row[checkCol]).replace(/\.0$/, '').trim();
    return !existingIds.has(val);
  });
}

function stripSuffix(data: DataRow[]): DataRow[] {
  return data.map(row => {
    if (SC_COL in row) {
      const val = toStr(row[SC_COL]);
      return { ...row, [SC_COL]: val.split('_')[0] };
    }
    return row;
  });
}

function sortData(data: DataRow[], mode: OperationMode): DataRow[] {
  const df = [...data];

  if (mode === 'MODOROSO') {
    if (df.some(r => 'Status' in r)) {
      df.sort((a, b) => {
        const aIsCompwork = toStr(a['Status']).trim().toUpperCase() === 'COMPWORK';
        const bIsCompwork = toStr(b['Status']).trim().toUpperCase() === 'COMPWORK';
        if (aIsCompwork && !bIsCompwork) return -1;
        if (!aIsCompwork && bIsCompwork) return 1;
        if ('Workzone' in a && 'Workzone' in b) {
          return toStr(a['Workzone']).localeCompare(toStr(b['Workzone']));
        }
        return 0;
      });
    } else if (df.some(r => 'Workzone' in r)) {
      df.sort((a, b) => toStr(a['Workzone']).localeCompare(toStr(b['Workzone'])));
    }
  } else {
    if (df.some(r => 'Workzone' in r)) {
      df.sort((a, b) => toStr(a['Workzone']).localeCompare(toStr(b['Workzone'])));
    }
  }

  return df;
}

function reorderColumns(data: DataRow[], mode: OperationMode): { data: DataRow[]; columns: string[] } {
  const targetOrder = mode === 'MODOROSO' ? MODOROSO_COLUMNS : WSA_COLUMNS;
  const availableCols = targetOrder.filter(col => data.some(row => col in row));

  const reordered = data.map(row => {
    const newRow: DataRow = {};
    for (const col of availableCols) {
      newRow[col] = row[col] ?? '';
    }
    // Include any extra columns not in target order
    for (const key of Object.keys(row)) {
      if (!newRow.hasOwnProperty(key)) {
        newRow[key] = row[key];
      }
    }
    return newRow;
  });

  return { data: reordered, columns: availableCols };
}

export function processData(
  rawData: DataRow[],
  mode: OperationMode,
  selectedMonths: number[],
  referenceData: DataRow[] | null
): ProcessedData {
  // Step 1: Common cleaning
  let df = cleanCommonData(rawData);

  // Step 2: Mode-specific filtering
  let result: { filtered: DataRow[]; checkCol: string };
  switch (mode) {
    case 'WSA':
      result = processWSA(df);
      break;
    case 'MODOROSO':
      result = processMODOROSO(df);
      break;
    case 'WAPPR':
      result = processWAPPR(df);
      break;
  }

  df = result.filtered;
  const checkCol = result.checkCol;

  // Step 3: Month filter
  df = applyMonthFilter(df, selectedMonths);

  // Step 4: Strip suffix from SC Order No
  df = stripSuffix(df);

  // Step 5: Remove duplicates
  const unique = removeDuplicates(df, referenceData, checkCol);

  // Step 6: Sort
  const sortedUnique = sortData(unique, mode);

  // Step 7: Reorder columns
  const { data: finalData, columns } = reorderColumns(sortedUnique, mode);

  return {
    filtered: df,
    unique: finalData,
    uniqueRaw: sortedUnique,  // semua kolom, sebelum reorder
    checkColumn: checkCol,
    columns,
  };
}

export function validateRequiredColumns(data: DataRow[], mode: OperationMode): string[] {
  const missing: string[] = [];
  const cols = Object.keys(data[0] || {});

  if (!cols.includes(SC_COL)) {
    missing.push(SC_COL);
  }

  if (mode === 'WAPPR' && !cols.includes('Status')) {
    missing.push('Status');
  }

  return missing;
}
