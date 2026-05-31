/* ZENTRIX_TECH — Navbar Component
   Design: Obsidian Forge — floating glass bar, 64px height
   Features: scroll-aware blur, search, nav links, watchlist
*/

import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Bell, Bookmark, Menu, X, ChevronDown,
  Film, Tv, Sword, Home, TrendingUp, Sparkles, Trophy, Trophy
} from "lucide-react";
import SearchOverlay from "./SearchOverlay";

const navLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/movies", label: "Movies", icon: Film },
  { href: "/tv", label: "TV Shows", icon: Tv },
  { href: "/anime", label: "Anime", icon: Sword },
  { href: "/sports", label: "Sports", icon: Trophy },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled
            ? "rgba(5, 8, 22, 0.95)"
            : "linear-gradient(180deg, rgba(5,8,22,0.85) 0%, rgba(5,8,22,0.4) 70%, transparent 100%)",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(0, 212, 255, 0.1)" : "none",
        }}
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/">
              <motion.div
                className="flex items-center gap-2 cursor-pointer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: "linear-gradient(135deg, #00D4FF, #8B5CF6)" }}>
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="absolute inset-0 rounded-lg blur-md opacity-50"
                    style={{ background: "linear-gradient(135deg, #00D4FF, #8B5CF6)" }} />
                </div>
                <div>
                  <span className="font-['Space_Grotesk'] font-800 text-lg tracking-tight"
                    style={{
                      background: "linear-gradient(135deg, #00D4FF 0%, #8B5CF6 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      fontWeight: 800,
                    }}>
                    ZENTRIX
                  </span>
                  <span className="font-['Space_Grotesk'] text-lg font-300 text-white/60 ml-0.5"
                    style={{ fontWeight: 300 }}>
                    TECH
                  </span>
                </div>
              </motion.div>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = location === link.href;
                return (
                  <Link key={link.href} href={link.href}>
                    <motion.div
                      className="relative px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                      style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        color: isActive ? "#00D4FF" : "#8899AA",
                        fontWeight: isActive ? 600 : 500,
                      }}
                      whileHover={{ color: "#F0F4FF" }}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="nav-active"
                          className="absolute inset-0 rounded-lg"
                          style={{ background: "rgba(0, 212, 255, 0.08)" }}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">{link.label}</span>
                    </motion.div>
                  </Link>
                );
              })}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <motion.button
                onClick={() => setSearchOpen(true)}
                className="p-2 rounded-lg transition-colors"
                style={{ color: "#8899AA" }}
                whileHover={{ color: "#00D4FF", backgroundColor: "rgba(0, 212, 255, 0.08)" }}
                whileTap={{ scale: 0.95 }}
              >
                <Search className="w-5 h-5" />
              </motion.button>

              {/* Watchlist */}
              <Link href="/watchlist">
                <motion.div
                  className="p-2 rounded-lg transition-colors cursor-pointer"
                  style={{ color: "#8899AA" }}
                  whileHover={{ color: "#8B5CF6", backgroundColor: "rgba(139, 92, 246, 0.08)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Bookmark className="w-5 h-5" />
                </motion.div>
              </Link>

              {/* Mobile Menu Toggle */}
              <motion.button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-lg"
                style={{ color: "#8899AA" }}
                whileHover={{ color: "#F0F4FF" }}
                whileTap={{ scale: 0.95 }}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              className="md:hidden overflow-hidden"
              style={{
                background: "rgba(5, 8, 22, 0.98)",
                borderTop: "1px solid rgba(0, 212, 255, 0.1)",
              }}
            >
              <div className="px-4 py-4 flex flex-col gap-1">
                {navLinks.map((link, i) => {
                  const isActive = location === link.href;
                  const Icon = link.icon;
                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link href={link.href}>
                        <div
                          className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer"
                          style={{
                            background: isActive ? "rgba(0, 212, 255, 0.08)" : "transparent",
                            color: isActive ? "#00D4FF" : "#8899AA",
                            fontFamily: "'Space Grotesk', sans-serif",
                            fontWeight: 600,
                          }}
                        >
                          <Icon className="w-4 h-4" />
                          {link.label}
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Search Overlay */}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
