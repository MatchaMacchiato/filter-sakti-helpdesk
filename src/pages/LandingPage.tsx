import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FileSpreadsheet, Headset, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F4F5F7', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ textAlign: 'center', marginBottom: 48 }}
      >
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#111827', fontFamily: 'Plus Jakarta Sans, sans-serif', marginBottom: 8 }}>
          Selamat Datang
        </h1>
        <p style={{ fontSize: 14, color: '#9CA3AF', maxWidth: 400, margin: '0 auto', lineHeight: 1.6 }}>
          Pilih aplikasi yang ingin Anda gunakan
        </p>
      </motion.div>

      {/* Cards */}
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 800 }}>
        
        {/* Filter Sakti Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Link to="/filter" style={{ textDecoration: 'none' }}>
            <div
              style={{
                width: 340, padding: '32px 28px', borderRadius: 16,
                backgroundColor: '#FFFFFF', border: '1px solid #E2E5EA',
                cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', flexDirection: 'column', gap: 16,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#FECACA';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(192, 57, 43, 0.1)';
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#E2E5EA';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#FEF2F2', border: '1px solid #FECACA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileSpreadsheet style={{ width: 24, height: 24, color: '#C0392B' }} />
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', fontFamily: 'Plus Jakarta Sans, sans-serif', marginBottom: 6 }}>
                  Filter Sakti
                </h2>
                <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>
                  Validasi & filter data WSA, MODOROSO, WAPPR. Upload file Excel, proses otomatis dengan deduplikasi Google Sheets.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#C0392B', fontSize: 13, fontWeight: 600 }}>
                Buka Aplikasi <ArrowRight style={{ width: 14, height: 14 }} />
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Helpdesk Tracker Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Link to="/helpdesk" style={{ textDecoration: 'none' }}>
            <div
              style={{
                width: 340, padding: '32px 28px', borderRadius: 16,
                backgroundColor: '#FFFFFF', border: '1px solid #E2E5EA',
                cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', flexDirection: 'column', gap: 16,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#BBF7D0';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(22, 101, 52, 0.1)';
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#E2E5EA';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Headset style={{ width: 24, height: 24, color: '#166534' }} />
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', fontFamily: 'Plus Jakarta Sans, sans-serif', marginBottom: 6 }}>
                  Helpdesk Tracker
                </h2>
                <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>
                  Sistem input & tracking progress Helpdesk. Dashboard, leaderboard, progres harian, dan manajemen data master.
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#166534', fontSize: 13, fontWeight: 600 }}>
                Buka Aplikasi <ArrowRight style={{ width: 14, height: 14 }} />
              </div>
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{ fontSize: 11, color: '#D1D5DB', marginTop: 48 }}
      >
        © 2026
      </motion.p>
    </div>
  );
}
