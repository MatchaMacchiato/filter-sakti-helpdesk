import { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, Check, AlertCircle, Loader2, X, Database, BookOpen } from 'lucide-react';
import type { OperationMode, AppStatus } from '@/types';
import { MONTH_NAMES } from '@/types';
import type { SheetStatus } from '@/hooks/useAppState';

interface SidebarProps {
  mode: OperationMode;
  status: AppStatus;
  error: string | null;
  sheetStatus: SheetStatus;
  sheetTotalRows?: number;
  selectedMonths: number[];
  mainFile: File | null;
  onMainFileUpload: (file: File) => void;
  onProcess: () => void;
  onToggleMonth: (month: number) => void;
  onClearMainFile: () => void;
  onOpenTutorial?: () => void;
}

export function Sidebar({
  mode, status, error, sheetStatus, sheetTotalRows,
  selectedMonths, mainFile, onMainFileUpload,
  onProcess, onToggleMonth, onClearMainFile, onOpenTutorial,
}: SidebarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.currentTarget.classList.add('drag-over');
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.currentTarget.classList.remove('drag-over');
  }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.currentTarget.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) onMainFileUpload(file);
  }, [onMainFileUpload]);

  const isProcessing = status === 'parsing' || status === 'processing';
  const canProcess = !!mainFile && !isProcessing && sheetStatus === 'connected';

  const modeDesc: Record<OperationMode, string> = {
    WSA: 'AO / PDA / WSA · CREATE & MIGRATE',
    MODOROSO: 'Suffix -MO / -DO · Auto-detect',
    WAPPR: 'AO / PDA · Status WAPPR',
  };

  const label = (text: string) => (
    <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 6 }}>{text}</p>
  );

  return (
    <motion.aside
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        position: 'fixed', top: 52, left: 0, bottom: 0, width: 256,
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid #E2E5EA',
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* GSheet Status */}
        <div>
          {label('Google Sheets')}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 8,
            backgroundColor: sheetStatus === 'connected' ? '#F0FDF4' : sheetStatus === 'error' ? '#FEF2F2' : '#F9FAFB',
            border: `1px solid ${sheetStatus === 'connected' ? '#BBF7D0' : sheetStatus === 'error' ? '#FECACA' : '#E2E5EA'}`,
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              backgroundColor: sheetStatus === 'connected' ? '#DCFCE7' : '#F3F4F6',
            }}>
              {sheetStatus === 'connecting'
                ? <Loader2 style={{ width: 14, height: 14, color: '#9CA3AF' }} className="animate-spin-slow" />
                : <Database style={{ width: 14, height: 14, color: sheetStatus === 'connected' ? '#166534' : sheetStatus === 'error' ? '#C0392B' : '#9CA3AF' }} />
              }
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: sheetStatus === 'connected' ? '#166534' : sheetStatus === 'error' ? '#C0392B' : '#6B7280' }}>
                {sheetStatus === 'connecting' && 'Menghubungkan...'}
                {sheetStatus === 'connected' && 'Terhubung'}
                {sheetStatus === 'error' && 'Gagal terhubung'}
              </p>
              <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {sheetStatus === 'connected' && sheetTotalRows !== undefined
                  ? `${sheetTotalRows.toLocaleString()} baris di sheet`
                  : 'GDOC WSA FULFILLMENT'}
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: '#F3F4F6' }} />

        {/* Upload */}
        <div>
          {label('Upload Data')}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={error ? 'animate-shake' : ''}
            style={{
              position: 'relative',
              height: 110,
              borderRadius: 8,
              border: `2px dashed ${error ? '#FECACA' : mainFile ? '#BBF7D0' : '#D1D5DB'}`,
              backgroundColor: error ? '#FEF2F2' : mainFile ? '#F0FDF4' : '#F9FAFB',
              cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'all 0.15s',
            }}
          >
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) onMainFileUpload(f); }} />
            {mainFile ? (
              <>
                <Check style={{ width: 18, height: 18, color: '#166534' }} />
                <span style={{ fontSize: 12, fontWeight: 500, color: '#166534', padding: '0 12px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                  {mainFile.name}
                </span>
                <button
                  onClick={e => { e.stopPropagation(); onClearMainFile(); }}
                  style={{ position: 'absolute', top: 8, right: 8, padding: 4, borderRadius: 4, border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#9CA3AF' }}
                >
                  <X style={{ width: 13, height: 13 }} />
                </button>
              </>
            ) : (
              <>
                <Upload style={{ width: 18, height: 18, color: '#9CA3AF' }} />
                <span style={{ fontSize: 12, color: '#6B7280' }}>Klik atau drop file di sini</span>
                <span style={{ fontSize: 11, color: '#9CA3AF' }}>.xlsx · .xls · .csv</span>
              </>
            )}
          </div>
          {error && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginTop: 6 }}>
              <AlertCircle style={{ width: 13, height: 13, color: '#C0392B', flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: 11, color: '#C0392B', lineHeight: 1.4 }}>{error}</span>
            </div>
          )}
        </div>

        {/* Month Filter */}
        <div>
          {label('Filter Bulan')}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
            {MONTH_NAMES.map((name, idx) => {
              const m = idx + 1;
              const active = selectedMonths.includes(m);
              return (
                <button
                  key={m}
                  onClick={() => onToggleMonth(m)}
                  style={{
                    height: 30, borderRadius: 6, fontSize: 11, fontWeight: 600,
                    border: `1px solid ${active ? '#FECACA' : '#E2E5EA'}`,
                    backgroundColor: active ? '#FEF2F2' : '#FFFFFF',
                    color: active ? '#C0392B' : '#6B7280',
                    cursor: 'pointer', transition: 'all 0.1s',
                  }}
                >
                  {name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Process */}
        <button
          onClick={onProcess}
          disabled={!canProcess}
          style={{
            width: '100%', height: 40, borderRadius: 8,
            fontSize: 13, fontWeight: 600,
            border: `1px solid ${canProcess ? '#C0392B' : '#E2E5EA'}`,
            backgroundColor: canProcess ? '#C0392B' : '#F9FAFB',
            color: canProcess ? '#FFFFFF' : '#D1D5DB',
            cursor: canProcess ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
          onMouseEnter={e => { if (canProcess) e.currentTarget.style.backgroundColor = '#A93226'; }}
          onMouseLeave={e => { if (canProcess) e.currentTarget.style.backgroundColor = '#C0392B'; }}
        >
          {isProcessing
            ? <><Loader2 style={{ width: 15, height: 15 }} className="animate-spin-slow" />Memproses...</>
            : 'Proses Data'
          }
        </button>

        {/* Mode info */}
        <div style={{ borderRadius: 8, padding: '10px 12px', backgroundColor: '#F9FAFB', border: '1px solid #E2E5EA' }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 4 }}>Mode aktif</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#C0392B' }}>{mode}</p>
          <p style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{modeDesc[mode]}</p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #F3F4F6', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {mode === 'MODOROSO' && (
          <button
            onClick={onOpenTutorial}
            style={{
              width: '100%', height: 34, borderRadius: 8,
              fontSize: 12, fontWeight: 600,
              border: '1px solid #FECACA',
              backgroundColor: '#FEF2F2',
              color: '#C0392B',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FEE2E2'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#FEF2F2'; }}
          >
            <BookOpen style={{ width: 13, height: 13 }} />
            Cara Ambil Data
          </button>
        )}
        <p style={{ fontSize: 11, color: '#D1D5DB' }}>Filter Sakti · v2.1</p>
      </div>
    </motion.aside>
  );
}
