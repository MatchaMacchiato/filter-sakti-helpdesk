import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Mail, Lock, User, Eye, EyeOff, Loader2, CheckCircle, AlertCircle, LogIn, UserPlus, KeyRound, ArrowLeft } from 'lucide-react';

type TabMode = 'login' | 'register' | 'forgot';

export default function LoginPage() {
  const { login, register, user } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<TabMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

    if (!displayName.trim()) {
      setError('Nama wajib diisi.');
      return;
    }
    if (password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok.');
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
        setConfirmPassword('');
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email.trim()) {
      setError('Masukkan email Anda terlebih dahulu.');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMsg('Link reset password telah dikirim ke email Anda. Silakan cek inbox atau spam folder.');
      setTimeout(() => {
        setTab('login');
      }, 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengirim reset email';
      if (msg.includes('auth/user-not-found')) {
        setError('Email tidak terdaftar.');
      } else if (msg.includes('auth/invalid-email')) {
        setError('Format email tidak valid.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: 48,
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: '0 14px 0 44px',
    fontSize: 14,
    color: '#FFFFFF',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s, background-color 0.2s',
    fontFamily: 'Inter, sans-serif',
  };

  const inputFocusStyle = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'rgba(139,92,246,0.6)';
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.15)';
    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)';
  };

  const inputBlurStyle = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
    e.currentTarget.style.boxShadow = 'none';
    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated gradient orbs */}
      <div style={{
        position: 'fixed', top: '-20%', right: '-10%',
        width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'pulse 8s ease-in-out infinite',
      }} />
      <div style={{
        position: 'fixed', bottom: '-15%', left: '-5%',
        width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'pulse 10s ease-in-out infinite reverse',
      }} />
      <div style={{
        position: 'fixed', top: '40%', left: '60%',
        width: '300px', height: '300px',
        background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'pulse 12s ease-in-out infinite',
      }} />

      {/* Background pattern */}
      <div style={{
        position: 'fixed', inset: 0, opacity: 0.03,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      {/* CSS Animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        input::placeholder { color: rgba(255,255,255,0.35) !important; }
      `}</style>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{
          width: '100%', maxWidth: 440,
          backgroundColor: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          borderRadius: 24,
          boxShadow: '0 24px 80px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.1)',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Header */}
        <div style={{
          padding: '36px 36px 28px',
          textAlign: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <motion.div
            key={tab}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            style={{
              width: 56, height: 56, borderRadius: 16,
              background: 'linear-gradient(135deg, #8B5CF6, #6366F1, #3B82F6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 18px',
              boxShadow: '0 8px 24px rgba(139,92,246,0.35)',
            }}
          >
            {tab === 'login'
              ? <LogIn style={{ width: 26, height: 26, color: '#FFFFFF' }} />
              : tab === 'register'
              ? <UserPlus style={{ width: 26, height: 26, color: '#FFFFFF' }} />
              : <KeyRound style={{ width: 26, height: 26, color: '#FFFFFF' }} />
            }
          </motion.div>
          <h1 style={{
            fontSize: 24, fontWeight: 800, color: '#FFFFFF',
            fontFamily: 'Plus Jakarta Sans, Inter, sans-serif',
            letterSpacing: '-0.02em',
          }}>
            {tab === 'login' ? 'Selamat Datang' : tab === 'register' ? 'Buat Akun Baru' : 'Reset Password'}
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>
            {tab === 'login' ? 'Masuk untuk mengakses Helpdesk Tracker'
              : tab === 'register' ? 'Daftar akun baru untuk mulai menggunakan aplikasi'
              : 'Masukkan email untuk menerima link reset password'}
          </p>
        </div>

        {/* Tab Switcher (login/register only) */}
        {tab !== 'forgot' && (
          <div style={{ display: 'flex', padding: '16px 36px 0', gap: 6 }}>
            {(['login', 'register'] as TabMode[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); setSuccessMsg(''); }}
                style={{
                  flex: 1, padding: '11px 0', fontSize: 13, fontWeight: 600,
                  borderRadius: 10, border: 'none', cursor: 'pointer',
                  backgroundColor: tab === t ? 'rgba(139,92,246,0.3)' : 'transparent',
                  color: tab === t ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
                  transition: 'all 0.25s',
                  backdropFilter: tab === t ? 'blur(10px)' : 'none',
                  letterSpacing: '0.02em',
                }}
              >
                {t === 'login' ? '🔑 Masuk' : '📝 Daftar'}
              </button>
            ))}
          </div>
        )}

        {/* Back button for forgot */}
        {tab === 'forgot' && (
          <div style={{ padding: '16px 36px 0' }}>
            <button
              onClick={() => { setTab('login'); setError(''); setSuccessMsg(''); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 500,
                padding: '6px 0',
              }}
            >
              <ArrowLeft style={{ width: 14, height: 14 }} />
              Kembali ke Login
            </button>
          </div>
        )}

        {/* Form */}
        <div style={{ padding: '20px 36px 36px' }}>
          {/* Messages */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '12px 16px', borderRadius: 12,
                  backgroundColor: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)',
                  marginBottom: 16,
                }}
              >
                <AlertCircle style={{ width: 16, height: 16, color: '#F87171', flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 13, color: '#FCA5A5', lineHeight: 1.5 }}>{error}</p>
              </motion.div>
            )}
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '12px 16px', borderRadius: 12,
                  backgroundColor: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)',
                  marginBottom: 16,
                }}
              >
                <CheckCircle style={{ width: 16, height: 16, color: '#4ADE80', flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 13, color: '#86EFAC', lineHeight: 1.5 }}>{successMsg}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={tab === 'login' ? handleLogin : tab === 'register' ? handleRegister : handleForgotPassword}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Name (register only) */}
              {tab === 'register' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ position: 'relative' }}>
                  <User style={{ position: 'absolute', left: 14, top: 16, width: 16, height: 16, color: 'rgba(255,255,255,0.35)', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    placeholder="Nama Lengkap"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    required
                    style={inputStyle}
                    onFocus={inputFocusStyle}
                    onBlur={inputBlurStyle}
                  />
                </motion.div>
              )}

              {/* Email */}
              <div style={{ position: 'relative' }}>
                <Mail style={{ position: 'absolute', left: 14, top: 16, width: 16, height: 16, color: 'rgba(255,255,255,0.35)', pointerEvents: 'none' }} />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={inputStyle}
                  onFocus={inputFocusStyle}
                  onBlur={inputBlurStyle}
                />
              </div>

              {/* Password (not for forgot) */}
              {tab !== 'forgot' && (
                <div style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: 14, top: 16, width: 16, height: 16, color: 'rgba(255,255,255,0.35)', pointerEvents: 'none' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    style={{ ...inputStyle, paddingRight: 44 }}
                    onFocus={inputFocusStyle}
                    onBlur={inputBlurStyle}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: 12, top: 14,
                      border: 'none', background: 'none', cursor: 'pointer', padding: 2,
                    }}
                  >
                    {showPassword
                      ? <EyeOff style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.35)' }} />
                      : <Eye style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.35)' }} />}
                  </button>
                </div>
              )}

              {/* Confirm Password (register only) */}
              {tab === 'register' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: 14, top: 16, width: 16, height: 16, color: 'rgba(255,255,255,0.35)', pointerEvents: 'none' }} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Ulangi Password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    style={{ ...inputStyle, paddingRight: 44 }}
                    onFocus={inputFocusStyle}
                    onBlur={inputBlurStyle}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute', right: 12, top: 14,
                      border: 'none', background: 'none', cursor: 'pointer', padding: 2,
                    }}
                  >
                    {showConfirmPassword
                      ? <EyeOff style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.35)' }} />
                      : <Eye style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.35)' }} />}
                  </button>
                  {confirmPassword && password !== confirmPassword && (
                    <p style={{ fontSize: 11, color: '#F87171', marginTop: 4, marginLeft: 2 }}>
                      Password tidak cocok
                    </p>
                  )}
                </motion.div>
              )}
            </div>

            {/* Forgot Password Link (login only) */}
            {tab === 'login' && (
              <div style={{ textAlign: 'right', marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => { setTab('forgot'); setError(''); setSuccessMsg(''); }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(139,92,246,0.8)', fontSize: 12, fontWeight: 500,
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#A78BFA'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(139,92,246,0.8)'; }}
                >
                  Lupa Password?
                </button>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', height: 48, marginTop: 20,
                borderRadius: 12, border: 'none',
                background: loading
                  ? 'rgba(139,92,246,0.3)'
                  : 'linear-gradient(135deg, #8B5CF6, #6366F1, #3B82F6)',
                color: '#FFFFFF', fontSize: 14, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.25s',
                boxShadow: loading ? 'none' : '0 8px 24px rgba(139,92,246,0.3)',
                fontFamily: 'Plus Jakarta Sans, Inter, sans-serif',
                letterSpacing: '0.02em',
              }}
            >
              {loading ? (
                <><Loader2 style={{ width: 16, height: 16 }} className="animate-spin-slow" />Memproses...</>
              ) : tab === 'login' ? (
                <><LogIn style={{ width: 16, height: 16 }} />Masuk</>
              ) : tab === 'register' ? (
                <><UserPlus style={{ width: 16, height: 16 }} />Daftar</>
              ) : (
                <><KeyRound style={{ width: 16, height: 16 }} />Kirim Link Reset</>
              )}
            </button>
          </form>

          {/* Footer note */}
          {tab === 'register' && (
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
              Setelah mendaftar, akun Anda akan menunggu persetujuan admin sebelum dapat mengakses aplikasi.
            </p>
          )}
          {tab === 'forgot' && (
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
              Link reset akan dikirim ke email terdaftar. Password baru akan langsung aktif tanpa perlu approval ulang.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
