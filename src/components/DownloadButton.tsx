import { motion } from 'framer-motion';
import { Download, Table2 } from 'lucide-react';

interface DownloadButtonProps {
  onDownloadFormatted: () => void;   // sesuai tabel (reordered cols)
  onDownloadRaw: () => void;         // semua kolom asli
  disabled: boolean;
  mode: string;
  rowCount?: number;
}

export function DownloadButton({
  onDownloadFormatted,
  onDownloadRaw,
  disabled,
  mode,
  rowCount,
}: DownloadButtonProps) {
  const now = new Date();
  const date = `${String(now.getDate()).padStart(2,'0')}${String(now.getMonth()+1).padStart(2,'0')}${now.getFullYear()}`;

  const baseStyle: React.CSSProperties = {
    height: 44, borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    fontSize: 13, fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s',
    flex: 1,
    border: 'none',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: 0.1 }}
      style={{ display: 'flex', gap: 10 }}
    >
      {/* Tombol 1: Filter Sesuai Tabel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <button
          onClick={onDownloadFormatted}
          disabled={disabled}
          style={{
            ...baseStyle,
            backgroundColor: disabled ? '#F9FAFB' : '#C0392B',
            color: disabled ? '#D1D5DB' : '#FFFFFF',
            border: `1px solid ${disabled ? '#E2E5EA' : '#C0392B'}`,
          }}
          onMouseEnter={e => { if (!disabled) e.currentTarget.style.backgroundColor = '#A93226'; }}
          onMouseLeave={e => { if (!disabled) e.currentTarget.style.backgroundColor = '#C0392B'; }}
        >
          <Table2 style={{ width: 16, height: 16, flexShrink: 0 }} />
          <div style={{ textAlign: 'left' }}>
            <div>Download Sesuai Tabel</div>
            {!disabled && (
              <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.8 }}>
                {rowCount?.toLocaleString()} baris · kolom terformat · {mode}_{date}.xlsx
              </div>
            )}
          </div>
        </button>
      </div>

      {/* Divider */}
      <div style={{ width: 1, backgroundColor: '#E2E5EA', alignSelf: 'stretch', borderRadius: 1 }} />

      {/* Tombol 2: Filter Tanpa Format */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <button
          onClick={onDownloadRaw}
          disabled={disabled}
          style={{
            ...baseStyle,
            backgroundColor: disabled ? '#F9FAFB' : '#FFFFFF',
            color: disabled ? '#D1D5DB' : '#374151',
            border: `1px solid ${disabled ? '#E2E5EA' : '#D1D5DB'}`,
          }}
          onMouseEnter={e => {
            if (!disabled) {
              e.currentTarget.style.backgroundColor = '#F9FAFB';
              e.currentTarget.style.borderColor = '#9CA3AF';
            }
          }}
          onMouseLeave={e => {
            if (!disabled) {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.borderColor = '#D1D5DB';
            }
          }}
        >
          <Download style={{ width: 16, height: 16, flexShrink: 0, color: disabled ? '#D1D5DB' : '#6B7280' }} />
          <div style={{ textAlign: 'left' }}>
            <div>Download Tanpa Format</div>
            {!disabled && (
              <div style={{ fontSize: 10, fontWeight: 400, color: '#9CA3AF' }}>
                {rowCount?.toLocaleString()} baris · semua kolom asli · {mode}_AllKolom_{date}.xlsx
              </div>
            )}
          </div>
        </button>
      </div>
    </motion.div>
  );
}
