"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface UserData {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'citizen' | 'admin' | 'maintenance';
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName: string, lastName: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        try {
          // Check all collections in parallel for faster lookup
          const [citizenDoc, adminDoc, maintenanceDoc, userDoc] = await Promise.all([
            getDoc(doc(db, 'citizens', user.uid)),
            getDoc(doc(db, 'administrators', user.uid)),
            getDoc(doc(db, 'maintenance', user.uid)),
            getDoc(doc(db, 'users', user.uid))
          ]);
          
          let data = null;
          
          if (citizenDoc.exists()) {
            data = { ...citizenDoc.data(), role: 'citizen' } as UserData;
          } else if (adminDoc.exists()) {
            data = { ...adminDoc.data(), role: 'admin' } as UserData;
          } else if (maintenanceDoc.exists()) {
            data = { ...maintenanceDoc.data(), role: 'maintenance' } as UserData;
          } else if (userDoc.exists()) {
            data = userDoc.data() as UserData;
          }
          
          if (data) {
            setUserData(data);
            
            // Set localStorage and cookie for middleware compatibility
            localStorage.setItem('userRole', data.role);
            localStorage.setItem('userEmail', data.email);
            document.cookie = `userRole=${data.role}; path=/; max-age=${60 * 60 * 24 * 7}`;
          }
        } catch (error) {
          // Silently handle user data fetch errors
        }
      } else {
        setUserData(null);
        localStorage.removeItem('userRole');
        localStorage.removeItem('userEmail');
        document.cookie = 'userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      // Don't fetch user data here - let the onAuthStateChanged handle it
      // This makes login much faster
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        throw new Error('No account found with this email address.');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Incorrect password.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address.');
      } else if (error.code === 'auth/user-disabled') {
        throw new Error('This account has been disabled.');
      }
      throw new Error(error.message || 'Failed to sign in');
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    firstName: string, 
    lastName: string, 
    role: string
  ) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's display name
      await updateProfile(result.user, {
        displayName: `${firstName} ${lastName}`
      });

      // Create user document in role-specific collection
      const userData: UserData = {
        uid: result.user.uid,
        email: result.user.email!,
        firstName,
        lastName,
        role: role as 'citizen' | 'admin' | 'maintenance',
        createdAt: new Date()
      };

      // Determine collection name based on role
      let collectionName = '';
      switch (role) {
        case 'citizen':
          collectionName = 'citizens';
          break;
        case 'admin':
          collectionName = 'administrators';
          break;
        case 'maintenance':
          collectionName = 'maintenance';
          break;
        default:
          collectionName = 'users'; // fallback
      }

      await setDoc(doc(db, collectionName, result.user.uid), userData);
      
    } catch (error: any) {
      if (error.code === 'auth/configuration-not-found') {
        throw new Error('Firebase Authentication is not enabled. Please enable Email/Password authentication in your Firebase console.');
      } else if (error.code === 'auth/invalid-api-key') {
        throw new Error('Invalid Firebase API key. Please check your configuration.');
      } else if (error.code === 'auth/project-not-found') {
        throw new Error('Firebase project not found. Please check your project ID.');
      }
      
      throw new Error(error.message || 'Failed to create account');
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sign out');
    }
  };

  const value = {
    user,
    userData,
    loading,
    signIn,
    signUp,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
