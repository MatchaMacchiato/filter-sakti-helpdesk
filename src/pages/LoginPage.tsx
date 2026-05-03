import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Lock, User, Eye, EyeOff, Loader2, CheckCircle, AlertCircle, LogIn, UserPlus } from 'lucide-react';

type TabMode = 'login' | 'register';

export default function LoginPage() {
  const { login, register, user } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<TabMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // If already logged in & approved, redirect
  if (user && user.status === 'approved') {
    navigate('/', { replace: true });
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login gagal';
      if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password') || msg.includes('auth/user-not-found')) {
        setError('Email atau password salah.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }
    if (!displayName.trim()) {
      setError('Nama wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      const result = await register(email, password, displayName.trim());
      if (result === 'approved') {
        navigate('/', { replace: true });
      } else {
        setSuccessMsg('Akun berhasil didaftarkan! Menunggu persetujuan admin untuk dapat mengakses aplikasi.');
        setTab('login');
        setEmail('');
        setPassword('');
        setDisplayName('');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registrasi gagal';
      if (msg.includes('auth/email-already-in-use')) {
        setError('Email sudah terdaftar. Silakan login.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    height: 44,
    borderRadius: 10,
    border: '1px solid #E2E5EA',
    backgroundColor: '#F9FAFB',
    padding: '0 14px 0 42px',
    fontSize: 14,
    color: '#111827',
    outline: 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    fontFamily: 'Inter, sans-serif',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      {/* Background pattern */}
      <div style={{
        position: 'fixed', inset: 0, opacity: 0.06,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          width: '100%', maxWidth: 420,
          backgroundColor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: 20,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.2)',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Header */}
        <div style={{
          padding: '32px 32px 24px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%)',
          borderBottom: '1px solid #E8EAF0',
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 4px 12px rgba(102,126,234,0.3)',
          }}>
            {tab === 'login'
              ? <LogIn style={{ width: 24, height: 24, color: '#FFFFFF' }} />
              : <UserPlus style={{ width: 24, height: 24, color: '#FFFFFF' }} />
            }
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {tab === 'login' ? 'Selamat Datang' : 'Buat Akun'}
          </h1>
          <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>
            {tab === 'login' ? 'Masuk untuk mengakses aplikasi' : 'Daftar untuk mulai menggunakan aplikasi'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', padding: '16px 32px 0', gap: 4 }}>
          {(['login', 'register'] as TabMode[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); setSuccessMsg(''); }}
              style={{
                flex: 1, padding: '10px 0', fontSize: 13, fontWeight: 600,
                borderRadius: 8, border: 'none', cursor: 'pointer',
                backgroundColor: tab === t ? '#667eea' : 'transparent',
                color: tab === t ? '#FFFFFF' : '#9CA3AF',
                transition: 'all 0.2s',
              }}
            >
              {t === 'login' ? 'Masuk' : 'Daftar'}
            </button>
          ))}
        </div>

        {/* Form */}
        <div style={{ padding: '20px 32px 32px' }}>
          {/* Messages */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  padding: '10px 14px', borderRadius: 10,
                  backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
                  marginBottom: 16,
                }}
              >
                <AlertCircle style={{ width: 16, height: 16, color: '#C0392B', flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 13, color: '#C0392B', lineHeight: 1.4 }}>{error}</p>
              </motion.div>
            )}
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  padding: '10px 14px', borderRadius: 10,
                  backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0',
                  marginBottom: 16,
                }}
              >
                <CheckCircle style={{ width: 16, height: 16, color: '#166534', flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 13, color: '#166534', lineHeight: 1.4 }}>{successMsg}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={tab === 'login' ? handleLogin : handleRegister}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Name (register only) */}
              {tab === 'register' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ position: 'relative' }}>
                  <User style={{ position: 'absolute', left: 14, top: 14, width: 16, height: 16, color: '#9CA3AF', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    placeholder="Nama Lengkap"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    required
                    style={inputStyle}
                    onFocus={e => { e.currentTarget.style.borderColor = '#667eea'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102,126,234,0.12)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#E2E5EA'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </motion.div>
              )}

              {/* Email */}
              <div style={{ position: 'relative' }}>
                <Mail style={{ position: 'absolute', left: 14, top: 14, width: 16, height: 16, color: '#9CA3AF', pointerEvents: 'none' }} />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = '#667eea'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102,126,234,0.12)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#E2E5EA'; e.currentTarget.style.boxShadow = 'none'; }}
                />
              </div>

              {/* Password */}
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: 14, top: 14, width: 16, height: 16, color: '#9CA3AF', pointerEvents: 'none' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ ...inputStyle, paddingRight: 42 }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#667eea'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(102,126,234,0.12)'; }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#E2E5EA'; e.currentTarget.style.boxShadow = 'none'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 12, top: 12,
                    border: 'none', background: 'none', cursor: 'pointer', padding: 2,
                  }}
                >
                  {showPassword
                    ? <EyeOff style={{ width: 16, height: 16, color: '#9CA3AF' }} />
                    : <Eye style={{ width: 16, height: 16, color: '#9CA3AF' }} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', height: 44, marginTop: 20,
                borderRadius: 10, border: 'none',
                background: loading ? '#A5B4FC' : 'linear-gradient(135deg, #667eea, #764ba2)',
                color: '#FFFFFF', fontSize: 14, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(102,126,234,0.3)',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
              }}
            >
              {loading ? (
                <><Loader2 style={{ width: 16, height: 16 }} className="animate-spin-slow" />Memproses...</>
              ) : tab === 'login' ? (
                <><LogIn style={{ width: 16, height: 16 }} />Masuk</>
              ) : (
                <><UserPlus style={{ width: 16, height: 16 }} />Daftar</>
              )}
            </button>
          </form>

          {/* Footer note */}
          {tab === 'register' && (
            <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
              Setelah mendaftar, akun Anda akan menunggu persetujuan admin sebelum dapat mengakses aplikasi.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
