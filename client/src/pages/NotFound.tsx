/* ZENTRIX_TECH — 404 Not Found Page */

import { motion } from "framer-motion";
import { Link } from "wouter";
import { Home, Search, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "#050816" }}
    >
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #8B5CF6, transparent)" }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="text-center max-w-md relative z-10"
      >
        {/* 404 */}
        <div className="text-8xl font-800 mb-4 leading-none"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 800,
            background: "linear-gradient(135deg, #00D4FF 0%, #8B5CF6 50%, #06FFA5 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
          404
        </div>

        <h1 className="text-2xl font-700 mb-3"
          style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: "#F0F4FF" }}>
          Page Not Found
        </h1>
        <p className="text-sm mb-8" style={{ color: "#8899AA", fontFamily: "'Inter', sans-serif" }}>
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link href="/">
            <motion.div
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl cursor-pointer"
              style={{
                background: "linear-gradient(135deg, #00D4FF, #8B5CF6)",
                color: "#050816",
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: "0.875rem",
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <Home className="w-4 h-4" />
              Go Home
            </motion.div>
          </Link>
          <Link href="/search">
            <motion.div
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl cursor-pointer"
              style={{
                background: "rgba(255,255,255,0.06)",
                color: "#F0F4FF",
                border: "1px solid rgba(255,255,255,0.1)",
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 600,
                fontSize: "0.875rem",
              }}
              whileHover={{ background: "rgba(255,255,255,0.1)" }}
              whileTap={{ scale: 0.97 }}
            >
              <Search className="w-4 h-4" />
              Search
            </motion.div>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
