import { motion } from 'framer-motion';
import { Loader2, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import type { OperationMode } from '@/types';
import type { SheetStatus } from '@/hooks/useAppState';

interface HeaderProps {
  mode: OperationMode;
  onModeChange: (mode: OperationMode) => void;
  sheetStatus: SheetStatus;
  sheetName?: string;
  onRetry: () => void;
  nextRefreshIn?: number;
}

const MODES: { key: OperationMode; label: string }[] = [
  { key: 'WSA', label: 'WSA' },
  { key: 'MODOROSO', label: 'MODOROSO' },
  { key: 'WAPPR', label: 'WAPPR' },
];

const S = {
  header: {
    position: 'fixed' as const,
    top: 0, left: 0, right: 0,
    height: '52px',
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid #E2E5EA',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    zIndex: 50,
  },
};

export function Header({ mode, onModeChange, sheetStatus, sheetName, onRetry, nextRefreshIn }: HeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      style={S.header}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 28, height: 28,
          backgroundColor: '#C0392B',
          borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="2" y="3"  width="10" height="1.5" rx="0.75" fill="white"/>
            <rect x="2" y="6.25" width="7"  height="1.5" rx="0.75" fill="white"/>
            <rect x="2" y="9.5" width="5"  height="1.5" rx="0.75" fill="white"/>
          </svg>
        </div>
        <div>
          <span style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: 14, color: '#111827', letterSpacing: '-0.3px' }}>
            Filter
          </span>
          <span style={{ fontFamily: 'Plus Jakarta Sans', fontWeight: 700, fontSize: 14, color: '#C0392B', letterSpacing: '-0.3px' }}>
            Sakti
          </span>
        </div>
      </div>

      {/* Mode Tabs */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 2,
        padding: '3px',
        backgroundColor: '#F4F5F7',
        borderRadius: 8,
        border: '1px solid #E2E5EA',
      }}>
        {MODES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onModeChange(key)}
            style={{
              padding: '5px 16px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              border: mode === key ? '1px solid #FECACA' : '1px solid transparent',
              backgroundColor: mode === key ? '#FEF2F2' : 'transparent',
              color: mode === key ? '#C0392B' : '#6B7280',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Sheet Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {sheetStatus === 'connecting' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 6, backgroundColor: '#F9FAFB', border: '1px solid #E2E5EA' }}>
            <Loader2 style={{ width: 12, height: 12, color: '#9CA3AF', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ fontSize: 12, color: '#9CA3AF' }}>Menghubungkan...</span>
          </div>
        )}
        {sheetStatus === 'connected' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 6, backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
              <Wifi style={{ width: 12, height: 12, color: '#15803D' }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: '#15803D' }}>{sheetName ?? 'Terhubung'}</span>
            </div>
            {nextRefreshIn !== undefined && (
              <div title="Auto-refresh data Sheets" style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '5px 10px', borderRadius: 6,
                backgroundColor: '#F9FAFB', border: '1px solid #E2E5EA',
              }}>
                <RefreshCw style={{ width: 11, height: 11, color: '#9CA3AF' }} />
                <span style={{ fontSize: 11, color: '#9CA3AF', fontVariantNumeric: 'tabular-nums' }}>
                  {nextRefreshIn}s
                </span>
              </div>
            )}
          </div>
        )}
        {sheetStatus === 'error' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 6, backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}>
              <WifiOff style={{ width: 12, height: 12, color: '#C0392B' }} />
              <span style={{ fontSize: 12, color: '#C0392B' }}>Gagal koneksi</span>
            </div>
            <button onClick={onRetry} title="Coba lagi" style={{ padding: 6, borderRadius: 6, border: '1px solid #E2E5EA', backgroundColor: 'white', cursor: 'pointer', color: '#6B7280' }}>
              <RefreshCw style={{ width: 13, height: 13 }} />
            </button>
          </div>
        )}
      </div>
    </motion.header>
  );
}
