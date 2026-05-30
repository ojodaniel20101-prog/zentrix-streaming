/* ZENTRIX_TECH — Watchlist Page */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import MediaCard from "@/components/MediaCard";
import Footer from "@/components/Footer";
import { useWatchlist } from "@/contexts/WatchlistContext";
import { Bookmark, Clock, Trash2, Play, Film, Tv, Sword, Star } from "lucide-react";

type Tab = "watchlist" | "history";

export default function WatchlistPage() {
  const [tab, setTab] = useState<Tab>("watchlist");
  const { watchlist, watchHistory, removeFromWatchlist, clearHistory } = useWatchlist();

  const typeIcon = (type: string) => {
    if (type === "anime") return <Sword className="w-3.5 h-3.5" style={{ color: "#8B5CF6" }} />;
    if (type === "tv") return <Tv className="w-3.5 h-3.5" style={{ color: "#06FFA5" }} />;
    return <Film className="w-3.5 h-3.5" style={{ color: "#00D4FF" }} />;
  };

  return (
    <div style={{ background: "#050816", minHeight: "100vh" }}>
      <Navbar />
      <div className="pt-24 pb-8 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Bookmark className="w-6 h-6" style={{ color: "#8B5CF6" }} />
            <h1 className="text-3xl font-800"
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, color: "#F0F4FF", letterSpacing: "-0.02em" }}>
              My Library
            </h1>
          </div>
          <p className="text-sm" style={{ color: "#8899AA" }}>
            Your saved content and watch history
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl w-fit mb-8"
          style={{ background: "rgba(11, 18, 32, 0.8)", border: "1px solid rgba(0, 212, 255, 0.1)" }}>
          {[
            { id: "watchlist" as Tab, label: "Watchlist", count: watchlist.length },
            { id: "history" as Tab, label: "History", count: watchHistory.length },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-600 transition-all"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 600,
                background: tab === t.id ? "rgba(139, 92, 246, 0.15)" : "transparent",
                color: tab === t.id ? "#8B5CF6" : "#8899AA",
                border: tab === t.id ? "1px solid rgba(139, 92, 246, 0.3)" : "1px solid transparent",
              }}
            >
              {t.label}
              <span className="text-xs px-1.5 py-0.5 rounded"
                style={{ background: "rgba(255,255,255,0.06)", color: tab === t.id ? "#8B5CF6" : "#8899AA" }}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* Watchlist Tab */}
        {tab === "watchlist" && (
          <AnimatePresence mode="wait">
            <motion.div
              key="watchlist"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {watchlist.length === 0 ? (
                <EmptyState
                  icon={<Bookmark className="w-12 h-12" style={{ color: "#8899AA" }} />}
                  title="Your watchlist is empty"
                  description="Add movies, TV shows, and anime to your watchlist to watch them later"
                  action={{ label: "Browse Content", href: "/" }}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {watchlist.map((item, i) => (
                    <div key={`${item.type}-${item.id}`} className="relative group">
                      <div className="flex justify-center">
                        <MediaCard
                          item={{
                            id: item.id,
                            title: item.title,
                            name: item.title,
                            overview: "",
                            poster_path: null,
                            backdrop_path: null,
                            vote_average: item.rating || 0,
                            vote_count: 0,
                            release_date: item.year,
                          } as any}
                          type={item.type}
                          index={i}
                        />
                      </div>
                      {/* Remove button */}
                      <button
                        onClick={() => removeFromWatchlist(item.id, item.type)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-20"
                        style={{
                          background: "rgba(255, 45, 85, 0.15)",
                          border: "1px solid rgba(255, 45, 85, 0.3)",
                          color: "#FF2D55",
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* History Tab */}
        {tab === "history" && (
          <AnimatePresence mode="wait">
            <motion.div
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {watchHistory.length === 0 ? (
                <EmptyState
                  icon={<Clock className="w-12 h-12" style={{ color: "#8899AA" }} />}
                  title="No watch history"
                  description="Start watching movies, TV shows, and anime to see your history here"
                  action={{ label: "Browse Content", href: "/" }}
                />
              ) : (
                <>
                  <div className="flex justify-end mb-4">
                    <button
                      onClick={clearHistory}
                      className="flex items-center gap-2 text-xs font-600 px-3 py-1.5 rounded-lg"
                      style={{
                        color: "#FF2D55",
                        background: "rgba(255, 45, 85, 0.08)",
                        border: "1px solid rgba(255, 45, 85, 0.2)",
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Clear History
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {watchHistory.map((item, i) => (
                      <motion.div
                        key={`${item.type}-${item.id}-${i}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-center gap-4 p-3 rounded-xl"
                        style={{
                          background: "rgba(11, 18, 32, 0.6)",
                          border: "1px solid rgba(0, 212, 255, 0.06)",
                        }}
                      >
                        {item.poster ? (
                          <img src={item.poster} alt={item.title}
                            className="w-12 h-16 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-16 rounded-lg flex-shrink-0 flex items-center justify-center"
                            style={{ background: "rgba(0,212,255,0.06)" }}>
                            <Play className="w-4 h-4" style={{ color: "#8899AA" }} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            {typeIcon(item.type)}
                            <p className="font-600 text-sm truncate"
                              style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: "#F0F4FF" }}>
                              {item.title}
                            </p>
                          </div>
                          {(item.season || item.episode) && (
                            <p className="text-xs" style={{ color: "#8899AA" }}>
                              {item.season ? `S${String(item.season).padStart(2, "0")}` : ""}
                              {item.episode ? `E${String(item.episode).padStart(2, "0")}` : ""}
                            </p>
                          )}
                          <p className="text-xs mt-0.5" style={{ color: "#8899AA" }}>
                            {new Date(item.watchedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Link href={`/watch/${item.type}/${item.id}${item.season ? `?season=${item.season}&episode=${item.episode || 1}` : ""}`}>
                          <motion.div
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer flex-shrink-0"
                            style={{
                              background: "rgba(0, 212, 255, 0.08)",
                              border: "1px solid rgba(0, 212, 255, 0.2)",
                              color: "#00D4FF",
                              fontFamily: "'Space Grotesk', sans-serif",
                              fontWeight: 600,
                              fontSize: "0.75rem",
                            }}
                            whileHover={{ background: "rgba(0, 212, 255, 0.15)" }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Play className="w-3 h-3 fill-current" />
                            Resume
                          </motion.div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
      <Footer />
    </div>
  );
}

function EmptyState({
  icon, title, description, action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 opacity-50">{icon}</div>
      <h2 className="text-xl font-700 mb-2"
        style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: "#F0F4FF" }}>
        {title}
      </h2>
      <p className="text-sm mb-6 max-w-sm" style={{ color: "#8899AA" }}>{description}</p>
      {action && (
        <Link href={action.href}>
          <motion.div
            className="px-6 py-3 rounded-xl text-sm font-600 cursor-pointer"
            style={{
              background: "linear-gradient(135deg, #00D4FF, #8B5CF6)",
              color: "#050816",
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {action.label}
          </motion.div>
        </Link>
      )}
    </div>
  );
}
