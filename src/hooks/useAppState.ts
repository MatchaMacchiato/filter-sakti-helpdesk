import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { OperationMode, DataRow, ProcessingMetrics, AppStatus } from '@/types';
import { processData, validateRequiredColumns } from '@/lib/dataProcessor';
import { parseFile, generateExcel } from '@/lib/fileParser';

export type { AppStatus };
export type SheetStatus = 'connecting' | 'connected' | 'error';

interface SheetInfo {
  ids: string[];
  checkColumn: string;
  sheetName: string;
  totalRows: number;
}

export function useAppState() {
  const [mode, setMode] = useState<OperationMode>('WSA');
  const [status, setStatus] = useState<AppStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [sheetStatus, setSheetStatus] = useState<SheetStatus>('connecting');
  const [sheetInfo, setSheetInfo] = useState<SheetInfo | null>(null);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [selectedMonths, setSelectedMonths] = useState<number[]>(() => {
    const now = new Date();
    const curr = now.getMonth() + 1;
    const prev = curr > 1 ? curr - 1 : 12;
    return [prev, curr];
  });
  const [mainFile, setMainFile] = useState<File | null>(null);
  const [rawData, setRawData] = useState<DataRow[] | null>(null);
  const [processedData, setProcessedData] = useState<DataRow[] | null>(null);
  const [rawProcessedData, setRawProcessedData] = useState<DataRow[] | null>(null);
  const [metrics, setMetrics] = useState<ProcessingMetrics>({
    filtered: 0,
    unique: 0,
    checkColumn: '',
  });
  const [columns, setColumns] = useState<string[]>([]);

  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [nextRefreshIn, setNextRefreshIn] = useState<number>(60);

  // Track latest fetch to avoid stale responses
  const fetchAbortRef = useRef<AbortController | null>(null);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const REFRESH_INTERVAL_MS = 60_000; // 1 minute

  // Auto-fetch Google Sheets reference data whenever mode changes
  const fetchSheetData = useCallback(async (targetMode: OperationMode, silent = false) => {
    // Abort any previous in-flight request
    if (fetchAbortRef.current) {
      fetchAbortRef.current.abort();
    }
    const controller = new AbortController();
    fetchAbortRef.current = controller;

    if (!silent) {
      setSheetStatus('connecting');
      setSheetInfo(null);
      setSheetError(null);
    }

    try {
      const res = await fetch(`/api/sheets?mode=${targetMode}`, {
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(body?.error || `HTTP ${res.status}`);
      }

      const data: SheetInfo = await res.json();
      setSheetInfo(data);
      setSheetStatus('connected');
      setLastRefreshed(new Date());
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : 'Failed to connect';
      setSheetError(msg);
      setSheetStatus('error');
    }
  }, []);

  // Initial fetch + auto-refresh every 1 minute
  useEffect(() => {
    fetchSheetData(mode);
    setNextRefreshIn(60);

    // Clear any existing intervals
    if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    // Auto-refresh every 60 seconds (silent = keep existing data visible)
    refreshIntervalRef.current = setInterval(() => {
      fetchSheetData(mode, true);
      setNextRefreshIn(60);
    }, REFRESH_INTERVAL_MS);

    // Countdown ticker every second
    countdownIntervalRef.current = setInterval(() => {
      setNextRefreshIn(prev => (prev > 1 ? prev - 1 : 60));
    }, 1000);

    return () => {
      if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [mode, fetchSheetData]);

  const handleModeChange = useCallback((newMode: OperationMode) => {
    setMode(newMode);
    setStatus('idle');
    setError(null);
    setProcessedData(null);
    setRawProcessedData(null);
    setRawData(null);
    setMainFile(null);
    setMetrics({ filtered: 0, unique: 0, checkColumn: '' });
    setColumns([]);
  }, []);

  const handleMainFileUpload = useCallback(async (file: File) => {
    setMainFile(file);
    setError(null);
    setStatus('parsing');

    try {
      const result = await parseFile(file);
      setRawData(result.data);
      setStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
      setStatus('error');
      setMainFile(null);
    }
  }, []);

  const handleProcess = useCallback(async () => {
    if (!rawData || !rawData.length) {
      setError('Please upload a data file first');
      setStatus('error');
      return;
    }

    const missingCols = validateRequiredColumns(rawData, mode);
    if (missingCols.length > 0) {
      setError(`Missing required columns: ${missingCols.join(', ')}`);
      setStatus('error');
      return;
    }

    setStatus('processing');
    setError(null);

    await new Promise(resolve => setTimeout(resolve, 80));

    try {
      // Build reference data from Google Sheets IDs
      let referenceData: DataRow[] | null = null;
      if (sheetInfo && sheetInfo.ids.length > 0) {
        const checkCol = sheetInfo.checkColumn;
        referenceData = sheetInfo.ids.map(id => ({ [checkCol]: id }));
      }

      const result = processData(rawData, mode, selectedMonths, referenceData);

      setProcessedData(result.unique);
      setRawProcessedData(result.uniqueRaw);
      setColumns(result.columns);
      setMetrics({
        filtered: result.filtered.length,
        unique: result.unique.length,
        checkColumn: result.checkColumn,
      });
      setStatus('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
      setStatus('error');
    }
  }, [rawData, mode, selectedMonths, sheetInfo]);

  const handleDownload = useCallback(() => {
    if (!processedData || !processedData.length) return;
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}${now.getFullYear()}`;
    // Pass `columns` → Excel hanya export kolom yang tampil di tabel, urutan sama
    generateExcel(processedData, `FilterSakti_${mode}_${dateStr}.xlsx`, columns);
  }, [processedData, columns, mode]);

  const handleDownloadRaw = useCallback(() => {
    if (!rawProcessedData || !rawProcessedData.length) return;
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}${now.getFullYear()}`;
    // Tidak pass columns → export semua kolom asli
    generateExcel(rawProcessedData, `FilterSakti_${mode}_AllKolom_${dateStr}.xlsx`);
  }, [rawProcessedData, mode]);

  const toggleMonth = useCallback((month: number) => {
    setSelectedMonths(prev =>
      prev.includes(month)
        ? prev.filter(m => m !== month)
        : [...prev, month]
    );
  }, []);

  const clearMainFile = useCallback(() => {
    setMainFile(null);
    setRawData(null);
    setProcessedData(null);
    setRawProcessedData(null);
    setStatus('idle');
    setError(null);
  }, []);

  const retrySheetFetch = useCallback(() => {
    fetchSheetData(mode);
    setNextRefreshIn(60);
    // Reset countdown
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => {
      setNextRefreshIn(prev => (prev > 1 ? prev - 1 : 60));
    }, 1000);
  }, [mode, fetchSheetData]);

  // Memoize to avoid re-renders on every countdown tick for consumers that don't need it
  const sheetMeta = useMemo(() => ({ lastRefreshed, nextRefreshIn }), [lastRefreshed, nextRefreshIn]);

  return {
    mode,
    status,
    error,
    sheetStatus,
    sheetInfo,
    sheetError,
    selectedMonths,
    mainFile,
    processedData,
    rawProcessedData,
    metrics,
    columns,
    lastRefreshed: sheetMeta.lastRefreshed,
    nextRefreshIn: sheetMeta.nextRefreshIn,
    handleModeChange,
    handleMainFileUpload,
    handleProcess,
    handleDownload,
    handleDownloadRaw,
    toggleMonth,
    clearMainFile,
    retrySheetFetch,
  };
}
