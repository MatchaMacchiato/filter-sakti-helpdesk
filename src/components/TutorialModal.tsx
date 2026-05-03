import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, BookOpen, GripHorizontal } from 'lucide-react';

import gif1 from './gif/1.gif';
import gif2 from './gif/2.gif';
import gif3 from './gif/3.gif';

const STEPS = [
  {
    step: 1,
    title: 'Buka BIMA',
    desc: 'Pastikan Pastikan Tanggal nya awal bulan dan H+1',
    gif: gif1,
  },
  {
    step: 2,
    title: 'Klik Show All Filter',
    desc: 'Masukian STO nya ke workzone pake , misalkan KBY,JAG dan seterusnya.',
    gif: gif2,
  },
  {
    step: 3,
    title: 'Klik Show Lalu Dowload',
    desc: 'Setelah data diproses, kamu bisa download hasil dalam format terformat atau raw. nanti  data di masukan di web ini.',
    gif: gif3,
  },
];

interface TutorialModalProps {
  open: boolean;
  onClose: () => void;
}

export function TutorialModal({ open, onClose }: TutorialModalProps) {
  const [step, setStep] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const constraintsRef = useRef(null);

  // Reset ke step 1 setiap buka modal
  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  // Tutup dengan Esc
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const current = STEPS[step];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Constraint area (full viewport) */}
          <div
            ref={constraintsRef}
            style={{
              position: 'fixed', inset: 0,
              pointerEvents: 'none',
              zIndex: 200,
            }}
          />

          {/* Draggable Modal — no backdrop, starts top-left of content area */}
          <motion.div
            key="modal"
            drag
            dragMomentum={false}
            dragElastic={0}
            dragConstraints={constraintsRef}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => setIsDragging(false)}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              /* start: kiri atas area konten (setelah sidebar 256px) */
              top: 72,
              left: 272,
              zIndex: 201,
              width: 'min(600px, calc(100vw - 290px))',
              maxHeight: 'calc(100vh - 90px)',
              backgroundColor: '#FFFFFF',
              borderRadius: 14,
              boxShadow: isDragging
                ? '0 32px 72px rgba(0,0,0,0.22)'
                : '0 8px 32px rgba(0,0,0,0.14)',
              border: '1px solid #E2E5EA',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              cursor: isDragging ? 'grabbing' : 'default',
              userSelect: 'none',
              transition: 'box-shadow 0.15s',
            }}
          >
            {/* ── Drag Handle / Header ── */}
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid #F3F4F6',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: isDragging ? 'grabbing' : 'grab',
                backgroundColor: '#FAFAFA',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* grip icon */}
                <GripHorizontal style={{ width: 14, height: 14, color: '#D1D5DB', flexShrink: 0 }} />
                <div style={{
                  width: 26, height: 26, borderRadius: 7,
                  backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <BookOpen style={{ width: 12, height: 12, color: '#C0392B' }} />
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>Tutorial MODOROSO</p>
                  <p style={{ fontSize: 10, color: '#9CA3AF' }}>Cara mengambil data MO/DO</p>
                </div>
              </div>
              <button
                onClick={onClose}
                onPointerDown={e => e.stopPropagation()}
                style={{
                  padding: 5, borderRadius: 6, border: 'none',
                  backgroundColor: 'transparent', cursor: 'pointer', color: '#9CA3AF',
                  display: 'flex', alignItems: 'center',
                }}
              >
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>

            {/* ── Step tabs ── */}
            <div
              style={{ padding: '10px 16px 0', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
              onPointerDown={e => e.stopPropagation()}
            >
              {STEPS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '4px 10px', borderRadius: 20,
                    fontSize: 11, fontWeight: 600,
                    border: `1px solid ${i === step ? '#FECACA' : '#E2E5EA'}`,
                    backgroundColor: i === step ? '#FEF2F2' : '#F9FAFB',
                    color: i === step ? '#C0392B' : '#9CA3AF',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <span style={{
                    width: 15, height: 15, borderRadius: '50%',
                    backgroundColor: i === step ? '#C0392B' : '#E2E5EA',
                    color: i === step ? '#fff' : '#9CA3AF',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 8, fontWeight: 700, flexShrink: 0,
                  }}>{s.step}</span>
                  {s.title}
                </button>
              ))}
            </div>

            {/* ── GIF + Desc (scrollable) ── */}
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.16 }}
                onPointerDown={e => e.stopPropagation()}
                style={{ padding: '12px 16px', overflowY: 'auto', flex: 1 }}
              >
                {/* GIF */}
                <div style={{
                  borderRadius: 8, overflow: 'hidden',
                  border: '1px solid #E2E5EA',
                  backgroundColor: '#F9FAFB',
                  aspectRatio: '16/9',
                  position: 'relative',
                }}>
                  <img
                    src={current.gif}
                    alt={`Step ${current.step}: ${current.title}`}
                    draggable={false}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                  />
                  <div style={{
                    position: 'absolute', top: 8, left: 8,
                    padding: '2px 9px', borderRadius: 20,
                    backgroundColor: 'rgba(192,57,43,0.85)',
                    fontSize: 10, fontWeight: 700, color: '#fff',
                    backdropFilter: 'blur(4px)',
                  }}>
                    Step {current.step} / {STEPS.length}
                  </div>
                </div>

                {/* Desc */}
                <div style={{ marginTop: 10 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#111827', marginBottom: 3 }}>{current.title}</p>
                  <p style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.6 }}>{current.desc}</p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* ── Footer nav ── */}
            <div
              onPointerDown={e => e.stopPropagation()}
              style={{
                padding: '10px 16px',
                borderTop: '1px solid #F3F4F6',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexShrink: 0,
                backgroundColor: '#FAFAFA',
              }}
            >
              <button
                onClick={() => setStep(s => Math.max(0, s - 1))}
                disabled={step === 0}
                style={{
                  display: 'flex', alignItems: 'center', gap: 3,
                  padding: '6px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600,
                  border: '1px solid #E2E5EA',
                  backgroundColor: step === 0 ? '#F9FAFB' : '#FFFFFF',
                  color: step === 0 ? '#D1D5DB' : '#374151',
                  cursor: step === 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <ChevronLeft style={{ width: 13, height: 13 }} /> Sebelumnya
              </button>

              {/* Dots */}
              <div style={{ display: 'flex', gap: 5 }}>
                {STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setStep(i)}
                    style={{
                      width: i === step ? 18 : 6, height: 6, borderRadius: 3,
                      border: 'none', padding: 0,
                      backgroundColor: i === step ? '#C0392B' : '#E2E5EA',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  />
                ))}
              </div>

              {step < STEPS.length - 1 ? (
                <button
                  onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 3,
                    padding: '6px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600,
                    border: '1px solid #C0392B',
                    backgroundColor: '#C0392B', color: '#FFFFFF',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#A93226'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#C0392B'; }}
                >
                  Selanjutnya <ChevronRight style={{ width: 13, height: 13 }} />
                </button>
              ) : (
                <button
                  onClick={onClose}
                  style={{
                    padding: '6px 12px', borderRadius: 7, fontSize: 11, fontWeight: 600,
                    border: '1px solid #C0392B',
                    backgroundColor: '#C0392B', color: '#FFFFFF',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#A93226'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#C0392B'; }}
                >
                  Selesai ✓
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
