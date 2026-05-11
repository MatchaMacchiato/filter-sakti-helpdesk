import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileSpreadsheet, Send } from 'lucide-react';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { MetricsCards } from '@/components/MetricsCards';
import { DataTable } from '@/components/DataTable';
import { DownloadButton } from '@/components/DownloadButton';
import { TutorialModal } from '@/components/TutorialModal';
import { useAppState } from '@/hooks/useAppState';

const MODE_DESC: Record<string, string> = {
  WSA: 'Validasi & filter AO/PDA/WSA — tipe CREATE & MIGRATE',
  MODOROSO: 'Proses order MO/DO dengan deteksi tipe otomatis',
  WAPPR: 'Filter status WAPPR untuk AO & PDA',
};

export default function FilterSaktiApp() {
  const {
    mode, status, error,
    sheetStatus, sheetInfo,
    selectedMonths, mainFile,
    processedData, metrics, columns,
    nextRefreshIn,
    handleModeChange, handleMainFileUpload, handleProcess,
    handleDownload, handleDownloadRaw, toggleMonth, clearMainFile, retrySheetFetch,
  } = useAppState();

  const [tutorialOpen, setTutorialOpen] = useState(false);
  const navigate = useNavigate();

  const showResults = status === 'complete' && processedData !== null;
  const showEmpty   = !mainFile && status === 'idle';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F4F5F7' }}>
      <Header mode={mode} onModeChange={handleModeChange} sheetStatus={sheetStatus} sheetName={sheetInfo?.sheetName} onRetry={retrySheetFetch} nextRefreshIn={nextRefreshIn} />

      <Sidebar
        mode={mode} status={status} error={error}
        sheetStatus={sheetStatus} sheetTotalRows={sheetInfo?.totalRows}
        selectedMonths={selectedMonths} mainFile={mainFile}
        onMainFileUpload={handleMainFileUpload} onProcess={handleProcess}
        onToggleMonth={toggleMonth} onClearMainFile={clearMainFile}
        onOpenTutorial={() => setTutorialOpen(true)}
      />

      <motion.main
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}
        style={{ marginLeft: 256, paddingTop: 52, minHeight: '100vh', backgroundColor: '#F4F5F7' }}
      >
        <div style={{ padding: 24, maxWidth: 1400, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Title */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: 10, padding: '16px 20px', border: '1px solid #E2E5EA' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#C0392B', fontFamily: 'Plus Jakarta Sans' }}>{mode}</span>
              <span style={{ fontSize: 14, color: '#D1D5DB' }}>/</span>
              <span style={{ fontSize: 14, color: '#9CA3AF' }}>Dashboard</span>
            </div>
            <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 3 }}>{MODE_DESC[mode]}</p>
          </div>

          {/* Metrics */}
          <MetricsCards metrics={metrics} visible={showResults} />

          {/* Table */}
          <DataTable data={processedData || []} columns={columns} visible={showResults} />

          {/* Download */}
          <DownloadButton
            onDownloadFormatted={handleDownload}
            onDownloadRaw={handleDownloadRaw}
            disabled={!showResults}
            mode={mode}
            rowCount={showResults ? processedData!.length : undefined}
          />

          {/* Send to Helpdesk */}
          {showResults && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.15 }}>
              <button
                onClick={() => {
                  localStorage.setItem('filterSaktiExport', JSON.stringify({ data: processedData, mode }));
                  navigate('/helpdesk/bulk-input');
                }}
                style={{
                  width: '100%', height: 44, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontSize: 13, fontWeight: 600,
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: '#FFFFFF', border: 'none',
                  cursor: 'pointer', transition: 'all 0.15s',
                  boxShadow: '0 4px 12px rgba(102,126,234,0.3)',
                }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
              >
                <Send style={{ width: 16, height: 16 }} />
                Kirim ke Helpdesk Tracker ({processedData!.length} data)
              </button>
            </motion.div>
          )}

          {/* Empty */}
          {showEmpty && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', textAlign: 'center' }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#FFFFFF', border: '1px solid #E2E5EA', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <FileSpreadsheet style={{ width: 22, height: 22, color: '#D1D5DB' }} />
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Siap memproses</p>
              <p style={{ fontSize: 12, color: '#9CA3AF', maxWidth: 300, lineHeight: 1.6 }}>
                Upload file data di sidebar. Deduplikasi berjalan otomatis menggunakan data Google Sheets.
              </p>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                {['.xlsx', '.xls', '.csv'].map(ext => (
                  <span key={ext} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, backgroundColor: '#FFFFFF', border: '1px solid #E2E5EA', color: '#9CA3AF' }}>{ext}</span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Processing */}
          {status === 'processing' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px 0' }}
            >
              <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #E2E5EA', borderTopColor: '#C0392B' }} className="animate-spin-slow" />
              <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 14 }}>Memproses data...</p>
            </motion.div>
          )}
        </div>
      </motion.main>

      <TutorialModal open={tutorialOpen} onClose={() => setTutorialOpen(false)} />
    </div>
  );
}
