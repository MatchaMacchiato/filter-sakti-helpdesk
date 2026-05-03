import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  doc, getDoc, setDoc, serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

// --- Types ---
export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user';
  status: 'pending' | 'approved' | 'rejected';
}

interface AuthContextType {
  user: AppUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<'approved' | 'pending'>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Admin email that is auto-approved
const ADMIN_EMAIL = 'dheoodermawan@gmail.com';

// --- Provider ---
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // Fetch Firestore user profile
        const userDoc = await getDoc(doc(db, 'users', fbUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data() as Omit<AppUser, 'uid'>;
          setUser({ uid: fbUser.uid, ...data });
        } else {
          // Edge case: auth exists but no Firestore doc
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    // Fetch user profile
    const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data() as Omit<AppUser, 'uid'>;
      if (data.status === 'pending') {
        await signOut(auth);
        throw new Error('Akun Anda masih menunggu persetujuan admin.');
      }
      if (data.status === 'rejected') {
        await signOut(auth);
        throw new Error('Akun Anda ditolak oleh admin. Hubungi administrator.');
      }
      setUser({ uid: cred.user.uid, ...data });
    } else {
      await signOut(auth);
      throw new Error('Data profil tidak ditemukan.');
    }
  };

  const register = async (email: string, password: string, displayName: string): Promise<'approved' | 'pending'> => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    const isAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    const userData = {
      email: email.toLowerCase(),
      displayName,
      role: isAdmin ? 'admin' : 'user',
      status: isAdmin ? 'approved' : 'pending',
      createdAt: serverTimestamp(),
      approvedBy: isAdmin ? 'system' : null,
      approvedAt: isAdmin ? serverTimestamp() : null,
    };

    await setDoc(doc(db, 'users', cred.user.uid), userData);

    if (isAdmin) {
      setUser({
        uid: cred.user.uid,
        email: userData.email,
        displayName: userData.displayName,
        role: 'admin',
        status: 'approved',
      });
      return 'approved';
    } else {
      // Sign out pending users
      await signOut(auth);
      setUser(null);
      return 'pending';
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
