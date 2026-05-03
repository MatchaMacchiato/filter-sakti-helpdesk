import { motion } from 'framer-motion';
import type { ProcessingMetrics } from '@/types';

interface MetricsCardsProps {
  metrics: ProcessingMetrics;
  visible: boolean;
  rawCount?: number;
}

export function MetricsCards({ metrics, visible }: MetricsCardsProps) {
  if (!visible) return null;
  const dupes = metrics.filtered - metrics.unique;

  const cards = [
    { label: 'Data Terfilter', value: metrics.filtered.toLocaleString(), sub: 'Lolos filter mode', red: false },
    { label: 'Data Unik',      value: metrics.unique.toLocaleString(),   sub: `${dupes.toLocaleString()} duplikat dihapus`, red: true },
    { label: 'Kolom Dedup',    value: metrics.checkColumn,               sub: 'Referensi GSheet', mono: true, red: false },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
      {cards.map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.3 }}
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E5EA',
            borderLeft: `3px solid ${c.red ? '#C0392B' : '#E2E5EA'}`,
            borderRadius: 10,
            padding: '16px 18px',
          }}
        >
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: 8 }}>
            {c.label}
          </p>
          <p style={{
            fontSize: c.mono ? 12 : 28,
            fontWeight: 700,
            color: c.red ? '#C0392B' : '#111827',
            fontFamily: c.mono ? 'JetBrains Mono, monospace' : 'Plus Jakarta Sans, sans-serif',
            lineHeight: 1,
            wordBreak: 'break-all',
          }}>
            {c.value}
          </p>
          <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>{c.sub}</p>
        </motion.div>
      ))}
    </div>
  );
}
