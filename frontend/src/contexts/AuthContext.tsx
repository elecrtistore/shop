import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../firebase';
import { UserProfile, UserRole } from '../types/user';
import { fetchProfile, assignRole } from '../services/authService';

interface AuthContextValue {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string, adminCode?: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  signupWithRole: (email: string, password: string, role: string, adminCode?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getStoredRole(): UserRole | null {
  try {
    const r = localStorage.getItem('electrishop-role');
    if (r === 'Admin' || r === 'Buyer' || r === 'Seller') return r;
  } catch {}
  return null;
}

function storeRole(role: string) {
  try { localStorage.setItem('electrishop-role', role); } catch {}
}

function clearStoredRole() {
  try { localStorage.removeItem('electrishop-role'); } catch {}
}

function buildFallbackProfile(fbUser: FirebaseUser, role: UserRole): UserProfile {
  return {
    uid: fbUser.uid,
    email: fbUser.email || '',
    displayName: fbUser.displayName || fbUser.email || 'User',
    role
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const pendingRole = useRef<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        if (pendingRole.current) {
          const role = pendingRole.current as UserRole;
          pendingRole.current = null;
          setUser(buildFallbackProfile(fbUser, role));
          setLoading(false);
          return;
        }
        try {
          const token = await fbUser.getIdToken();
          const profile = await fetchProfile(token);
          const storedRole = getStoredRole();
          if (profile.role === 'Buyer' && storedRole && storedRole !== 'Buyer') {
            storeRole(storedRole);
            setUser({ ...profile, role: storedRole });
          } else {
            storeRole(profile.role);
            setUser(profile);
          }
        } catch {
          const storedRole = getStoredRole();
          setUser(buildFallbackProfile(fbUser, storedRole || 'Buyer'));
        }
      } else {
        setUser(null);
        clearStoredRole();
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async (email: string, password: string, adminCode?: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    if (adminCode) {
      const fbUser = auth.currentUser;
      if (fbUser) {
        storeRole('Admin');
        setUser(buildFallbackProfile(fbUser, 'Admin'));
      }
    }
  };

  const signup = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const signupWithRole = async (email: string, password: string, role: string, adminCode?: string) => {
    const intendedRole = role === 'Admin' ? 'Admin' : 'Buyer';
    pendingRole.current = intendedRole;

    await createUserWithEmailAndPassword(auth, email, password);
    try {
      const fbUser = auth.currentUser;
      if (fbUser) {
        const token = await fbUser.getIdToken();
        const profile = await assignRole(token, role, adminCode);
        storeRole(profile.role);
        setUser(profile);
      }
    } catch {
      storeRole(intendedRole);
      const fbUser = auth.currentUser;
      if (fbUser) {
        setUser(buildFallbackProfile(fbUser, intendedRole));
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setFirebaseUser(null);
    clearStoredRole();
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, login, signup, signupWithRole, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
