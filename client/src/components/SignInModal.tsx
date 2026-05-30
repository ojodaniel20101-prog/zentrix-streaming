/*
  SignInModal — Google OAuth Sign In / Sign Up
  Design: Obsidian Forge — Tactical Dark UI
*/
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Shield, Star, Clock, Download, Bookmark } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Manus OAuth is handled by the backend

export default function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const { signInWithManus, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      onClose();
    }
  }, [isAuthenticated, onClose]);

  const handleSignIn = () => {
    signInWithManus();
  };

  const features = [
    { icon: Clock, text: "Watch history synced across devices" },
    { icon: Bookmark, text: "Personal watchlist & favorites" },
    { icon: Download, text: "Track your downloads" },
    { icon: Star, text: "Personalized recommendations" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ background: "rgba(0, 0, 0, 0.85)", backdropFilter: "blur(8px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="relative w-full max-w-md rounded-2xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(11, 18, 32, 0.98) 0%, rgba(5, 8, 22, 0.98) 100%)",
              border: "1px solid rgba(0, 212, 255, 0.25)",
              boxShadow: "0 25px 80px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 212, 255, 0.05)",
            }}
          >
            {/* Header gradient bar */}
            <div
              className="h-1 w-full"
              style={{ background: "linear-gradient(90deg, #00D4FF, #7B2FBE, #FF6464)" }}
            />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg transition-all hover:bg-white/10"
              style={{ color: "#8899AA" }}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8">
              {/* Logo & Title */}
              <div className="text-center mb-8">
                <div
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                  style={{
                    background: "linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(123, 47, 190, 0.2))",
                    border: "1px solid rgba(0, 212, 255, 0.3)",
                  }}
                >
                  <Shield className="w-8 h-8" style={{ color: "#00D4FF" }} />
                </div>
                <h2 className="text-2xl font-bold mb-2" style={{ color: "#FFFFFF" }}>
                  Join ZENTRIX_TECH
                </h2>
                <p className="text-sm" style={{ color: "#8899AA" }}>
                  Sign in to unlock your personalized experience
                </p>
              </div>

              {/* Features list */}
              <div className="space-y-3 mb-8">
                {features.map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <div
                      className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: "rgba(0, 212, 255, 0.1)", border: "1px solid rgba(0, 212, 255, 0.2)" }}
                    >
                      <Icon className="w-4 h-4" style={{ color: "#00D4FF" }} />
                    </div>
                    <span className="text-sm" style={{ color: "#B0C4D8" }}>
                      {text}
                    </span>
                  </div>
                ))}
              </div>

              {/* Google Sign In Button */}
              <div className="space-y-3">
                <motion.button
                  onClick={handleSignIn}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 py-3 px-6 rounded-xl font-medium transition-all"
                  style={{
                    background: isLoading ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #00D4FF, #8B5CF6)",
                    color: "#FFFFFF",
                    border: "1px solid rgba(0, 212, 255, 0.5)",
                  }}
                  whileHover={{ scale: isLoading ? 1 : 1.02 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  )}
                  {isLoading ? "Signing in..." : "Continue with Google"}
                </motion.button>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
                  <span className="text-xs" style={{ color: "#8899AA" }}>
                    or
                  </span>
                  <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
                </div>


              </div>

              {/* Terms */}
              <p className="text-center text-xs mt-6" style={{ color: "#4A5568" }}>
                By signing in, you agree to our{" "}
                <span style={{ color: "#00D4FF" }}>Terms of Service</span> and{" "}
                <span style={{ color: "#00D4FF" }}>Privacy Policy</span>
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
