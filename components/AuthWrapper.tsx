"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut, User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import { Loader2 } from "lucide-react";
import Image from "next/image";

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  isLoading: true,
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const logout = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setIsAdmin(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser && currentUser.email) {
        try {
          // Check if user exists in `admins` collection
          const adminRef = doc(db, "admins", currentUser.email);
          const adminSnap = await getDoc(adminRef);

          if (adminSnap.exists()) {
            // Update admin doc with their latest Google Data (photoURL, uid, lastLogin)
            await setDoc(
              adminRef,
              {
                uid: currentUser.uid,
                name: currentUser.displayName || adminSnap.data()?.name || "Anon",
                photoURL: currentUser.photoURL || "",
                lastLoginAt: new Date().toISOString(),
              },
              { merge: true }
            );

            setUser(currentUser);
            setIsAdmin(true);
            setErrorMsg("");
          } else {
            // Document doesn't exist, log them out
            await logout();
            setErrorMsg("Akses Ditolak: Email Anda tidak terdaftar sebagai Admin.");
          }
        } catch (error: any) {
          console.error("Auth error: ", error);
          await logout();
          // E.g., permission-denied if firestore rules explicitly block them
          setErrorMsg("Akses Ditolak: Anda tidak memiliki izin.");
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setErrorMsg("");
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      // Let onAuthStateChanged handle the verification
    } catch (error) {
      console.error("Login failed: ", error);
      setIsLoading(false);
      setErrorMsg("Gagal login dengan Google.");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-gold-500 w-12 h-12 mb-4" />
        <p className="text-foreground animate-pulse">Memuat Jhonbest Gaming...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="glass-panel w-full max-w-sm p-8 rounded-2xl shadow-2xl flex flex-col items-center">
          <Image
            src="/ic_brand.png"
            alt="Jhonbest Gaming"
            width={96}
            height={96}
            className="mb-6 rounded-xl drop-shadow-md"
          />
          <h1 className="text-2xl font-bold text-gold-500 mb-2">Login Admin</h1>
          <p className="text-center text-sm text-foreground/80 mb-6 font-medium">
            Masuk untuk mengakses panel admin Jhonbest Gaming
          </p>

          {errorMsg && (
            <div className="w-full bg-red-900/30 border border-red-500/50 text-red-200 p-3 rounded-lg text-sm text-center mb-6">
              {errorMsg}
            </div>
          )}

          <button
            onClick={loginWithGoogle}
            className="w-full py-3 px-4 bg-foreground text-background font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-gold-500 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              <path d="M1 1h22v22H1z" fill="none"/>
            </svg>
            Google Sign-In
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isAdmin, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
