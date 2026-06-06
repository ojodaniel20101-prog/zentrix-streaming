import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, browserLocalPersistence, setPersistence, signOut as firebaseSignOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDRLnXhRtW6XWzfwzgSSAxGm5h39AvRUEg",
  authDomain: "zentrix-chat.firebaseapp.com",
  projectId: "zentrix-chat",
  storageBucket: "zentrix-chat.firebasestorage.app",
  messagingSenderId: "318694299710",
  appId: "1:318694299710:web:7e291cb622de5ed211596f",
  measurementId: "G-GQPP5JY6EF"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();

export interface UserProfile {
  id: number;
  openId: string;
  email: string;
  name: string;
  picture?: string;
  role: "user" | "admin";
  joinedAt: number;
}

export interface DownloadedItem {
  id: number;
  type: "movie" | "tv" | "anime";
  title: string;
  poster: string;
  quality: string;
  downloadedAt: number;
  fileSize?: string;
  season?: number;
  episode?: number;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signInWithManus: () => void;
  signOut: () => void;
  downloads: DownloadedItem[];
  addDownload: (item: DownloadedItem) => void;
  removeDownload: (id: number, type: string) => void;
  isDownloaded: (id: number, type: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Helper: send idToken to backend and set session cookie
async function authenticateWithBackend(idToken: string): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/firebase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem("zx_user");
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [downloads, setDownloads] = useState<DownloadedItem[]>(() => {
    try {
      const stored = localStorage.getItem("zx_downloads");
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });



  const { data: currentUser, isLoading: authLoading } = trpc.auth.me.useQuery(undefined, {
    retry: false,
  });


  const trackActivityMutation = trpc.analytics.trackActivityDb.useMutation();

  useEffect(() => {
    if (!authLoading && currentUser) {
      const userProfile: UserProfile = {
        id: currentUser.id,
        openId: currentUser.openId,
        email: currentUser.email || "",
        name: currentUser.name || "",
        picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || "User")}&background=0D1B2A&color=00D4FF&size=96`,
        role: currentUser.role,
        joinedAt: Date.now(),
      };
      setUser(userProfile);
      localStorage.setItem("zx_user", JSON.stringify(userProfile));
      trackActivityMutation.mutate({ type: "signin" });
    }
    setIsLoading(false);
  }, [currentUser, authLoading]);

  useEffect(() => {
    if (user) localStorage.setItem("zx_user", JSON.stringify(user));
    else localStorage.removeItem("zx_user");
  }, [user]);

  useEffect(() => {
    localStorage.setItem("zx_downloads", JSON.stringify(downloads));
  }, [downloads]);

  // Handle redirect result — fires when Google redirects back to the site
  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).then(() => {
      getRedirectResult(auth)
        .then(async (result) => {
          if (!result?.user) return;
          setIsLoading(true);
          const idToken = await result.user.getIdToken(true);
          const ok = await authenticateWithBackend(idToken);
          if (ok) {
            await new Promise(r => setTimeout(r, 500));
            window.location.replace("/");
          } else {
            setAuthError("Backend auth failed. Check FIREBASE_SERVICE_ACCOUNT_JSON on Railway.");
            setIsLoading(false);
          }
        })
        .catch((err) => {
          if (err?.code !== "auth/no-auth-event") {
            setAuthError("Redirect error: " + (err?.message || err?.code));
          }
        });
    });
  }, []);

  const signInWithManus = useCallback(async () => {
    setIsLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      googleProvider.setCustomParameters({ prompt: "select_account" });
      // Try popup first — works on desktop and some mobile
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const ok = await authenticateWithBackend(idToken);
      if (ok) {
        await new Promise(r => setTimeout(r, 300));
        window.location.reload();
      } else {
        setAuthError("Sign in failed — backend rejected token.");
        setIsLoading(false);
      }
    } catch (error: any) {
      if (
        error.code === "auth/popup-closed-by-user" ||
        error.code === "auth/cancelled-popup-request"
      ) {
        setIsLoading(false);
        return;
      }
      if (
        error.code === "auth/popup-blocked" ||
        error.code === "auth/operation-not-supported-in-this-environment"
      ) {
        // Popup blocked — fall back to redirect
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (e: any) {
          setAuthError("Redirect failed: " + e.message);
          setIsLoading(false);
        }
        return;
      }
      setAuthError("Sign in error: " + (error.message || error.code));
      setIsLoading(false);
    }
  }, []);

  const { mutate: logout } = trpc.auth.logout.useMutation({
    onSuccess: async () => {
      await firebaseSignOut(auth);
      setUser(null);
      localStorage.removeItem("zx_user");
      window.location.href = "/";
    },
  });

  const signOut = useCallback(() => logout(), [logout]);

  const addDownload = useCallback((item: DownloadedItem) => {
    setDownloads((prev) => {
      if (prev.some((d) => d.id === item.id && d.type === item.type)) return prev;
      return [...prev, item];
    });
  }, []);

  const removeDownload = useCallback((id: number, type: string) => {
    setDownloads((prev) => prev.filter((d) => !(d.id === id && d.type === type)));
  }, []);

  const isDownloaded = useCallback(
    (id: number, type: string) => downloads.some((d) => d.id === id && d.type === type),
    [downloads]
  );

  if (authError) {
    return (
      <div style={{
        position: "fixed", inset: 0, zIndex: 99999,
        background: "#0a0f1a", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: "24px"
      }}>
        <div style={{
          background: "#1a0a0a", border: "1px solid #ff4444", borderRadius: "16px",
          padding: "24px", maxWidth: "400px", width: "100%"
        }}>
          <p style={{ color: "#ff4444", fontWeight: "bold", fontSize: "18px", marginBottom: "12px" }}>
            🔴 Auth Error
          </p>
          <p style={{ color: "#ffffff", fontSize: "14px", wordBreak: "break-all", marginBottom: "20px" }}>
            {authError}
          </p>
          <button
            onClick={() => { setAuthError(null); setIsLoading(false); }}
            style={{
              background: "#ff4444", color: "#fff", border: "none",
              borderRadius: "8px", padding: "10px 20px", cursor: "pointer", width: "100%"
            }}
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      user,
      isLoading: isLoading || authLoading,
      isAuthenticated: !!user,
      signInWithManus,
      signOut,
      downloads,
      addDownload,
      removeDownload,
      isDownloaded,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
