import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Loader2, ShieldAlert, Clock } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#F4F5F7',
      }}>
        <Loader2 style={{ width: 32, height: 32, color: '#C0392B' }} className="animate-spin-slow" />
        <p style={{ fontSize: 14, color: '#9CA3AF', marginTop: 16 }}>Memuat...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.status === 'pending') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#F4F5F7', padding: 24,
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            backgroundColor: '#FFFFFF', borderRadius: 16,
            padding: '48px 40px', textAlign: 'center',
            border: '1px solid #E2E5EA', maxWidth: 420,
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            backgroundColor: '#FEF3C7', border: '1px solid #FDE68A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <Clock style={{ width: 28, height: 28, color: '#D97706' }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8, fontFamily: 'Plus Jakarta Sans' }}>
            Menunggu Persetujuan
          </h2>
          <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, marginBottom: 24 }}>
            Akun Anda telah didaftarkan dan sedang menunggu persetujuan dari admin.
            Anda akan dapat mengakses aplikasi setelah admin menyetujui akun Anda.
          </p>
          <button
            onClick={() => window.location.href = '/login'}
            style={{
              padding: '10px 24px', borderRadius: 8, fontSize: 13,
              fontWeight: 600, border: '1px solid #E2E5EA',
              backgroundColor: '#FFFFFF', color: '#374151',
              cursor: 'pointer',
            }}
          >
            Kembali ke Login
          </button>
        </motion.div>
      </div>
    );
  }

  if (user.status === 'rejected') {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#F4F5F7', padding: 24,
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            backgroundColor: '#FFFFFF', borderRadius: 16,
            padding: '48px 40px', textAlign: 'center',
            border: '1px solid #E2E5EA', maxWidth: 420,
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          }}
        >
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <ShieldAlert style={{ width: 28, height: 28, color: '#C0392B' }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 8, fontFamily: 'Plus Jakarta Sans' }}>
            Akses Ditolak
          </h2>
          <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.6, marginBottom: 24 }}>
            Anda tidak memiliki izin untuk mengakses halaman ini. Halaman ini hanya untuk administrator.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              padding: '10px 24px', borderRadius: 8, fontSize: 13,
              fontWeight: 600, border: '1px solid #E2E5EA',
              backgroundColor: '#FFFFFF', color: '#374151',
              cursor: 'pointer',
            }}
          >
            Kembali ke Menu Utama
          </button>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
