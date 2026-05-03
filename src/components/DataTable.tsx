import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Copy, Check } from 'lucide-react';
import type { DataRow } from '@/types';

interface DataTableProps {
  data: DataRow[];
  columns: string[];
  visible: boolean;
}

const ROWS_PER_PAGE = 50;

export function DataTable({ data, columns, visible }: DataTableProps) {
  const [page, setPage] = useState(1);
  const [copied, setCopied] = useState(false);

  // Copy WITHOUT header row — hanya data
  const handleCopy = useCallback(() => {
    const text = data
      .map(row =>
        columns.map(col => {
          const v = row[col];
          if (v === null || v === undefined) return '';
          return String(v);
        }).join('\t')
      )
      .join('\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [data, columns]);

  if (!visible) return null;

  const total = Math.ceil(data.length / ROWS_PER_PAGE);
  const start = (page - 1) * ROWS_PER_PAGE;
  const pageData = data.slice(start, start + ROWS_PER_PAGE);
  const fmt = (v: unknown) => (v === null || v === undefined) ? '' : String(v);

  const btnStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 28, height: 28, borderRadius: 6,
    border: '1px solid #E2E5EA', backgroundColor: '#FFFFFF',
    cursor: 'pointer', color: '#6B7280',
    transition: 'all 0.15s',
  } as React.CSSProperties;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#111827', fontFamily: 'Plus Jakarta Sans' }}>
            Data Unik
          </span>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
            backgroundColor: '#FEF2F2', color: '#C0392B', border: '1px solid #FECACA'
          }}>
            {data.length.toLocaleString()} baris
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Copy button — NO header */}
          <button
            onClick={handleCopy}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500,
              border: `1px solid ${copied ? '#BBF7D0' : '#E2E5EA'}`,
              backgroundColor: copied ? '#F0FDF4' : '#FFFFFF',
              color: copied ? '#166534' : '#6B7280',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {copied
              ? <><Check style={{ width: 13, height: 13 }} />Tersalin!</>
              : <><Copy style={{ width: 13, height: 13 }} />Salin Data</>
            }
          </button>

          {/* Pagination */}
          {total > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button style={btnStyle} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft style={{ width: 14, height: 14 }} />
              </button>
              <span style={{ fontSize: 12, color: '#6B7280', minWidth: 50, textAlign: 'center' }}>
                {page} / {total}
              </span>
              <button style={btnStyle} onClick={() => setPage(p => Math.min(total, p + 1))} disabled={page === total}>
                <ChevronRight style={{ width: 14, height: 14 }} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ borderRadius: 10, border: '1px solid #E2E5EA', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
        <div style={{ overflowX: 'auto', maxHeight: 460 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#F9FAFB' }}>
              <tr>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9CA3AF', borderBottom: '1px solid #E2E5EA', width: 36, userSelect: 'none' }}>
                  #
                </th>
                {columns.map(col => (
                  <th key={col} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#9CA3AF', borderBottom: '1px solid #E2E5EA', whiteSpace: 'nowrap' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageData.map((row, i) => (
                <tr
                  key={i}
                  style={{ borderBottom: '1px solid #F3F4F6', backgroundColor: '#FFFFFF', cursor: 'default' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#FEF9F9')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
                >
                  <td style={{ padding: '8px 12px', fontSize: 11, color: '#D1D5DB', fontFamily: 'JetBrains Mono, monospace', userSelect: 'none' }}>
                    {start + i + 1}
                  </td>
                  {columns.map(col => (
                    <td key={col}
                      style={{ padding: '8px 12px', fontSize: 12, color: '#374151', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis' }}
                      title={fmt(row[col])}
                    >
                      {fmt(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer info */}
      <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>
        Baris {start + 1}–{Math.min(start + ROWS_PER_PAGE, data.length)} dari {data.length.toLocaleString()}
        {total > 1 && ` · Halaman ${page}/${total}`}
      </p>
    </motion.div>
  );
}
