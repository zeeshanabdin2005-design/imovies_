import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  type User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signInAnonymously
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, testConnection, seedInitialDataIfNeeded } from '../services/firebase';
import type { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isDemoAdminMode: boolean;
  toggleDemoAdminMode: () => void;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const ADMIN_EMAILS = ['zeeshanabdin2005@gmail.com', 'riz190175@gmail.com'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [trustedAdmin, setTrustedAdmin] = useState(false);

  useEffect(() => {
    // Catalog seeding is best-effort; security rules must restrict writes to admins.
    void testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setUserProfile(null);
      setTrustedAdmin(false);
      try {
        if (firebaseUser) {
          const token = await firebaseUser.getIdTokenResult(true);
          const userEmail = (firebaseUser.email || '').toLowerCase();
          const emailAdmin = Boolean(
            ADMIN_EMAILS.includes(userEmail) &&
            firebaseUser.emailVerified &&
            token.claims.email_verified === true
          );
          let adminDocExists = false;
          try {
            const adminSnap = await getDoc(doc(db, 'admins', firebaseUser.uid));
            adminDocExists = adminSnap.exists();
          } catch {
            // Email-based admin authorization remains available only for the verified allowlisted account.
          }
          setTrustedAdmin(emailAdmin || adminDocExists);
          if (emailAdmin || adminDocExists) {
            // Seed demonstration catalog only after Firebase confirms a trusted admin session.
            await seedInitialDataIfNeeded();
          }

          const profileRef = doc(db, 'users', firebaseUser.uid);
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) {
            const data = profileSnap.data() as Partial<UserProfile>;
            setUserProfile({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || data.displayName || 'Movie Fan',
              role: (emailAdmin || adminDocExists) ? 'admin' : 'user',
              createdAt: data.createdAt
            });
          } else {
            const profile: UserProfile = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || (firebaseUser.isAnonymous ? 'Guest Explorer' : 'Movie Fan'),
              role: 'user',
              createdAt: new Date().toISOString()
            };
            // A new user can create only their own user-role profile under Firestore rules.
            await setDoc(profileRef, profile);
            setUserProfile({ ...profile, role: (emailAdmin || adminDocExists) ? 'admin' : 'user' });
          }
        }
      } catch (error) {
        console.warn('Authentication profile initialization failed:', error);
        if (firebaseUser) {
          const userEmail = (firebaseUser.email || '').toLowerCase();
          const isAllowlistedVerifiedAdmin =
            ADMIN_EMAILS.includes(userEmail) && firebaseUser.emailVerified;
          setTrustedAdmin(Boolean(isAllowlistedVerifiedAdmin));
          setUserProfile({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || (firebaseUser.isAnonymous ? 'Guest Explorer' : 'Movie Fan'),
            role: isAllowlistedVerifiedAdmin ? 'admin' : 'user'
          });
        }
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const isAdmin = trustedAdmin;
  const isDemoAdminMode = false;
  const toggleDemoAdminMode = () => {
    // Intentionally disabled: frontend-only demo toggles must never grant administrator access.
    console.warn('Demo Admin Mode is disabled. Sign in with the authorized, verified administrator account.');
  };

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), pass);
  };

  const signupWithEmail = async (email: string, pass: string, name: string) => {
    if (pass.length < 8) throw new Error('Use a password with at least 8 characters.');
    const normalizedEmail = email.trim().toLowerCase();
    if (ADMIN_EMAILS.includes(normalizedEmail)) {
      throw new Error('This administrator account cannot be created through public registration. Use the authorized existing account.');
    }
    const cred = await createUserWithEmailAndPassword(auth, normalizedEmail, pass);
    if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
    const profile: UserProfile = {
      id: cred.user.uid,
      email: normalizedEmail,
      displayName: name.trim() || 'Movie Fan',
      role: 'user',
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'users', cred.user.uid), profile);
    setUserProfile(profile);
  };

  const loginAsGuest = async () => {
    // Do not fabricate a client-only identity; guest access requires Firebase Anonymous Auth.
    await signInAnonymously(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserProfile(null);
    setTrustedAdmin(false);
  };

  return (
    <AuthContext.Provider value={{
      user, userProfile, loading, isAdmin, isDemoAdminMode, toggleDemoAdminMode,
      loginWithGoogle, loginWithEmail, signupWithEmail, loginAsGuest, resetPassword, logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
