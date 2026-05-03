import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import {
  ShieldCheck, Users, ArrowLeft, CheckCircle, XCircle, Clock,
  Crown, User, Search, RefreshCw, Loader2, Shield
} from 'lucide-react';

interface UserRecord {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: { seconds: number } | null;
  approvedBy: string | null;
  approvedAt: { seconds: number } | null;
}

export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      const list: UserRecord[] = [];
      snapshot.forEach((d) => {
        list.push({ uid: d.id, ...d.data() } as UserRecord);
      });
      // Sort: pending first, then by date
      list.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        const aTime = a.createdAt?.seconds ?? 0;
        const bTime = b.createdAt?.seconds ?? 0;
        return bTime - aTime;
      });
      setUsers(list);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleApprove = async (uid: string, role: 'admin' | 'user') => {
    setActionLoading(uid);
    try {
      await updateDoc(doc(db, 'users', uid), {
        status: 'approved',
        role,
        approvedBy: user?.email || 'unknown',
        approvedAt: serverTimestamp(),
      });
      await fetchUsers();
    } catch (err) {
      console.error('Approve failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (uid: string) => {
    setActionLoading(uid);
    try {
      await updateDoc(doc(db, 'users', uid), {
        status: 'rejected',
        approvedBy: user?.email || 'unknown',
        approvedAt: serverTimestamp(),
      });
      await fetchUsers();
    } catch (err) {
      console.error('Reject failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangeRole = async (uid: string, newRole: 'admin' | 'user') => {
    setActionLoading(uid);
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
      await fetchUsers();
    } catch (err) {
      console.error('Role change failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchSearch = !search || u.email.toLowerCase().includes(search.toLowerCase()) || u.displayName.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || u.status === filter;
    return matchSearch && matchFilter;
  });

  const pendingCount = users.filter(u => u.status === 'pending').length;

  const formatDate = (ts: { seconds: number } | null) => {
    if (!ts) return '-';
    return new Date(ts.seconds * 1000).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, { bg: string; color: string; border: string; icon: React.ReactNode }> = {
      pending: { bg: '#FEF3C7', color: '#92400E', border: '#FDE68A', icon: <Clock style={{ width: 12, height: 12 }} /> },
      approved: { bg: '#DCFCE7', color: '#166534', border: '#BBF7D0', icon: <CheckCircle style={{ width: 12, height: 12 }} /> },
      rejected: { bg: '#FEE2E2', color: '#991B1B', border: '#FECACA', icon: <XCircle style={{ width: 12, height: 12 }} /> },
    };
    const s = styles[status] || styles.pending;
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
        backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}`,
      }}>
        {s.icon} {status === 'pending' ? 'Pending' : status === 'approved' ? 'Approved' : 'Rejected'}
      </span>
    );
  };

  const roleBadge = (role: string) => {
    const isAdmin = role === 'admin';
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
        backgroundColor: isAdmin ? '#EDE9FE' : '#F3F4F6',
        color: isAdmin ? '#6D28D9' : '#374151',
        border: `1px solid ${isAdmin ? '#DDD6FE' : '#E5E7EB'}`,
      }}>
        {isAdmin ? <Crown style={{ width: 12, height: 12 }} /> : <User style={{ width: 12, height: 12 }} />}
        {isAdmin ? 'Admin' : 'User'}
      </span>
    );
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F4F5F7' }}>
      {/* Top Bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E2E5EA',
        padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              border: '1px solid #E2E5EA', backgroundColor: '#FFFFFF',
              color: '#374151', cursor: 'pointer',
            }}
          >
            <ArrowLeft style={{ width: 14, height: 14 }} /> Kembali
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Shield style={{ width: 20, height: 20, color: '#667eea' }} />
            <span style={{ fontSize: 16, fontWeight: 700, color: '#111827', fontFamily: 'Plus Jakarta Sans' }}>Admin Panel</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {pendingCount > 0 && (
            <span style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700,
              backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A',
            }}>
              {pendingCount} pending
            </span>
          )}
          <button
            onClick={fetchUsers}
            disabled={loading}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              border: '1px solid #E2E5EA', backgroundColor: '#FFFFFF',
              color: '#374151', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <RefreshCw style={{ width: 14, height: 14 }} /> Refresh
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Total Users', value: users.length, icon: <Users style={{ width: 18, height: 18, color: '#667eea' }} />, bg: '#EEF2FF' },
            { label: 'Pending', value: pendingCount, icon: <Clock style={{ width: 18, height: 18, color: '#D97706' }} />, bg: '#FEF3C7' },
            { label: 'Approved', value: users.filter(u => u.status === 'approved').length, icon: <CheckCircle style={{ width: 18, height: 18, color: '#166534' }} />, bg: '#DCFCE7' },
            { label: 'Admin', value: users.filter(u => u.role === 'admin').length, icon: <Crown style={{ width: 18, height: 18, color: '#6D28D9' }} />, bg: '#EDE9FE' },
          ].map((stat) => (
            <div key={stat.label} style={{
              backgroundColor: '#FFFFFF', borderRadius: 12, padding: '16px 18px',
              border: '1px solid #E2E5EA', display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {stat.icon}
              </div>
              <div>
                <p style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>{stat.label}</p>
                <p style={{ fontSize: 20, fontWeight: 800, color: '#111827' }}>{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search & Filter */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search style={{ position: 'absolute', left: 12, top: 11, width: 16, height: 16, color: '#9CA3AF' }} />
            <input
              placeholder="Cari nama atau email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', height: 40, borderRadius: 8, border: '1px solid #E2E5EA',
                backgroundColor: '#FFFFFF', padding: '0 14px 0 38px', fontSize: 13,
                color: '#111827', outline: 'none',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                border: `1px solid ${filter === f ? '#667eea' : '#E2E5EA'}`,
                backgroundColor: filter === f ? '#EEF2FF' : '#FFFFFF',
                color: filter === f ? '#667eea' : '#6B7280',
                cursor: 'pointer', textTransform: 'capitalize',
              }}>
                {f === 'all' ? 'Semua' : f}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div style={{
          backgroundColor: '#FFFFFF', borderRadius: 12,
          border: '1px solid #E2E5EA', overflow: 'hidden',
        }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
              <Loader2 style={{ width: 24, height: 24, color: '#667eea' }} className="animate-spin-slow" />
              <span style={{ fontSize: 14, color: '#9CA3AF', marginLeft: 12 }}>Memuat data...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}>
              <Users style={{ width: 32, height: 32, margin: '0 auto 8px', color: '#D1D5DB' }} />
              <p style={{ fontSize: 14, fontWeight: 500 }}>Tidak ada user ditemukan</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
                <thead>
                  <tr style={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E2E5EA' }}>
                    {['Nama', 'Email', 'Role', 'Status', 'Terdaftar', 'Aksi'].map(h => (
                      <th key={h} style={{
                        padding: '12px 16px', fontSize: 11, fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                        color: '#9CA3AF', textAlign: 'left',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filteredUsers.map(u => (
                      <motion.tr
                        key={u.uid}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ borderBottom: '1px solid #F3F4F6' }}
                      >
                        <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600, color: '#111827' }}>
                          {u.displayName}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 13, color: '#6B7280' }}>
                          {u.email}
                        </td>
                        <td style={{ padding: '14px 16px' }}>{roleBadge(u.role)}</td>
                        <td style={{ padding: '14px 16px' }}>{statusBadge(u.status)}</td>
                        <td style={{ padding: '14px 16px', fontSize: 12, color: '#9CA3AF' }}>
                          {formatDate(u.createdAt)}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {actionLoading === u.uid ? (
                            <Loader2 style={{ width: 16, height: 16, color: '#667eea' }} className="animate-spin-slow" />
                          ) : u.uid === user?.uid ? (
                            <span style={{ fontSize: 11, color: '#9CA3AF' }}>Anda</span>
                          ) : u.status === 'pending' ? (
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              <button onClick={() => handleApprove(u.uid, 'user')} style={{
                                padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                                border: '1px solid #BBF7D0', backgroundColor: '#F0FDF4',
                                color: '#166534', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
                              }}>
                                <User style={{ width: 11, height: 11 }} /> User
                              </button>
                              <button onClick={() => handleApprove(u.uid, 'admin')} style={{
                                padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                                border: '1px solid #DDD6FE', backgroundColor: '#EDE9FE',
                                color: '#6D28D9', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
                              }}>
                                <Crown style={{ width: 11, height: 11 }} /> Admin
                              </button>
                              <button onClick={() => handleReject(u.uid)} style={{
                                padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                                border: '1px solid #FECACA', backgroundColor: '#FEF2F2',
                                color: '#991B1B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
                              }}>
                                <XCircle style={{ width: 11, height: 11 }} /> Tolak
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {u.status === 'approved' && (
                                <button
                                  onClick={() => handleChangeRole(u.uid, u.role === 'admin' ? 'user' : 'admin')}
                                  style={{
                                    padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                                    border: '1px solid #E2E5EA', backgroundColor: '#F9FAFB',
                                    color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
                                  }}
                                >
                                  {u.role === 'admin' ? <><User style={{ width: 11, height: 11 }} /> → User</> : <><Crown style={{ width: 11, height: 11 }} /> → Admin</>}
                                </button>
                              )}
                              {u.status === 'rejected' && (
                                <button onClick={() => handleApprove(u.uid, 'user')} style={{
                                  padding: '5px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                                  border: '1px solid #BBF7D0', backgroundColor: '#F0FDF4',
                                  color: '#166534', cursor: 'pointer',
                                }}>
                                  Approve
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
