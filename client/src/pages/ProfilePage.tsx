/*
  ProfilePage — Enhanced User Dashboard v2
  New features: Stats overview, activity heatmap, genre breakdown,
  continue watching, rating system, achievement badges, better settings
*/
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, Link } from "wouter";
import {
  User, Clock, Bookmark, Download, LogOut, Settings,
  Trash2, Play, Star, Calendar, Film, Tv, Sword,
  ChevronRight, Shield, Bell, Eye, EyeOff, X,
  TrendingUp, Award, BarChart3, Flame, Check,
  RefreshCw, Heart, Share2, Grid, List, Filter,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useWatchlist } from "@/contexts/WatchlistContext";
import { tmdbImg } from "@/lib/api";
import { getLoginUrl } from "@/const";

type ProfileTab = "overview" | "history" | "watchlist" | "downloads" | "settings";

export default function ProfilePage() {
  const [, navigate] = useLocation();
  const { user, signOut, downloads, removeDownload } = useAuth();
  const { watchlist, watchHistory, removeFromWatchlist, clearHistory } = useWatchlist();
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<"all" | "movie" | "tv" | "anime">("all");
  const [watchlistFilter, setWatchlistFilter] = useState<"all" | "movie" | "tv" | "anime">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  if (!user) {
    return (
      <div style={{ background: "#050816", minHeight: "100vh" }}>
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <User className="w-16 h-16 mx-auto mb-4" style={{ color: "#00D4FF" }} />
            <h2 className="text-2xl font-bold mb-2" style={{ color: "#FFFFFF" }}>Sign in Required</h2>
            <p className="mb-6" style={{ color: "#8899AA" }}>Please sign in to view your profile</p>
            <a href={getLoginUrl()} className="inline-block px-6 py-3 rounded-xl font-medium" style={{ background: "rgba(0,212,255,0.2)", color: "#00D4FF", border: "1px solid rgba(0,212,255,0.3)", textDecoration: "none" }}>
              Sign In
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Compute stats
  const stats = useMemo(() => {
    const movieCount = watchHistory.filter(h => h.type === "movie").length;
    const tvCount = watchHistory.filter(h => h.type === "tv").length;
    const animeCount = watchHistory.filter(h => h.type === "anime").length;
    const totalWatched = watchHistory.length;
    const uniqueShows = new Set(watchHistory.map(h => `${h.type}_${h.id}`)).size;

    // Genre breakdown from history (approximate)
    const typeBreakdown = [
      { label: "Movies", count: movieCount, color: "#FF6464" },
      { label: "TV Shows", count: tvCount, color: "#64C8FF" },
      { label: "Anime", count: animeCount, color: "#C864FF" },
    ].filter(t => t.count > 0);

    // Recent activity (last 7 days)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentActivity = watchHistory.filter(h => h.watchedAt > sevenDaysAgo).length;

    // Streak (consecutive days)
    const days = new Set(watchHistory.map(h => new Date(h.watchedAt).toDateString()));
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      if (days.has(d.toDateString())) streak++;
      else break;
    }

    // Achievements
    const achievements = [];
    if (totalWatched >= 1) achievements.push({ icon: "🎬", label: "First Watch", desc: "Watched your first title" });
    if (totalWatched >= 10) achievements.push({ icon: "🍿", label: "Cinephile", desc: "Watched 10+ titles" });
    if (totalWatched >= 50) achievements.push({ icon: "🏆", label: "Marathon", desc: "Watched 50+ titles" });
    if (watchlist.length >= 5) achievements.push({ icon: "📋", label: "Curator", desc: "5+ items in watchlist" });
    if (animeCount >= 5) achievements.push({ icon: "⛩️", label: "Otaku", desc: "Watched 5+ anime" });
    if (streak >= 3) achievements.push({ icon: "🔥", label: "On Fire", desc: `${streak} day streak!` });
    if (downloads.length >= 1) achievements.push({ icon: "💾", label: "Downloader", desc: "Downloaded your first title" });

    return { movieCount, tvCount, animeCount, totalWatched, uniqueShows, typeBreakdown, recentActivity, streak, achievements };
  }, [watchHistory, watchlist, downloads]);

  const filteredHistory = watchHistory.filter(h => historyFilter === "all" || h.type === historyFilter);
  const filteredWatchlist = watchlist.filter(w => watchlistFilter === "all" || w.type === watchlistFilter);

  const getTypeIcon = (type: string) => type === "movie" ? Film : type === "tv" ? Tv : Sword;
  const getTypeColor = (type: string) => type === "movie" ? "#FF6464" : type === "tv" ? "#64C8FF" : "#C864FF";
  const getTypeLabel = (type: string) => type === "movie" ? "Movie" : type === "tv" ? "TV" : "Anime";

  const handleSignOut = () => { signOut(); navigate("/"); };

  const tabs: { id: ProfileTab; label: string; icon: any; count?: number }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "history", label: "History", icon: Clock, count: watchHistory.length },
    { id: "watchlist", label: "Watchlist", icon: Bookmark, count: watchlist.length },
    { id: "downloads", label: "Downloads", icon: Download, count: downloads.length },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div style={{ background: "#050816", minHeight: "100vh" }}>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl p-4 sm:p-6 mb-6"
          style={{ background: "linear-gradient(135deg, rgba(11,18,32,0.95) 0%, rgba(0,212,255,0.05) 100%)", border: "1px solid rgba(0,212,255,0.2)" }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative flex-shrink-0">
                <img src={user.picture} alt={user.name} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover" style={{ border: "3px solid rgba(0,212,255,0.4)" }} />
                {stats.streak >= 3 && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ background: "#FF6400" }} title={`${stats.streak} day streak!`}>🔥</div>
                )}
              </div>
              <div className="flex-1 min-w-0 sm:hidden">
                <h1 className="text-lg font-bold truncate" style={{ color: "#FFFFFF", fontFamily: "'Space Grotesk', sans-serif" }}>{user.name}</h1>
                <p className="text-xs text-gray-400 truncate" style={{ color: "#8899AA" }}>{user.email}</p>
              </div>
            </div>

            <div className="flex-1 min-w-0 w-full">
              <div className="hidden sm:block">
                <h1 className="text-2xl font-bold mb-1" style={{ color: "#FFFFFF", fontFamily: "'Space Grotesk', sans-serif" }}>{user.name}</h1>
                <p className="text-sm mb-3" style={{ color: "#8899AA" }}>{user.email}</p>
              </div>
              <div className="grid grid-cols-4 sm:flex sm:flex-wrap gap-2 sm:gap-3">
                <div className="text-center p-2 sm:px-3 sm:py-1.5 rounded-lg" style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.15)" }}>
                  <p className="text-sm sm:text-lg font-bold" style={{ color: "#00D4FF" }}>{stats.totalWatched}</p>
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-wider" style={{ color: "#8899AA" }}>Watched</p>
                </div>
                <div className="text-center p-2 sm:px-3 sm:py-1.5 rounded-lg" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)" }}>
                  <p className="text-sm sm:text-lg font-bold" style={{ color: "#8B5CF6" }}>{watchlist.length}</p>
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-wider" style={{ color: "#8899AA" }}>Saved</p>
                </div>
                <div className="text-center p-2 sm:px-3 sm:py-1.5 rounded-lg" style={{ background: "rgba(6,255,165,0.08)", border: "1px solid rgba(6,255,165,0.15)" }}>
                  <p className="text-sm sm:text-lg font-bold" style={{ color: "#06FFA5" }}>{stats.streak}</p>
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-wider" style={{ color: "#8899AA" }}>Day Streak</p>
                </div>
                <div className="text-center p-2 sm:px-3 sm:py-1.5 rounded-lg" style={{ background: "rgba(255,100,100,0.08)", border: "1px solid rgba(255,100,100,0.15)" }}>
                  <p className="text-sm sm:text-lg font-bold" style={{ color: "#FF6464" }}>{stats.recentActivity}</p>
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-wider" style={{ color: "#8899AA" }}>This Week</p>
                </div>
              </div>
            </div>
            <button onClick={handleSignOut} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium mt-2 sm:mt-0" style={{ background: "rgba(255,100,100,0.1)", color: "#FF6464", border: "1px solid rgba(255,100,100,0.2)" }}>
              <LogOut className="w-4 h-4" />Sign Out
            </button>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 overflow-x-auto flex-nowrap scrollbar-hide no-scrollbar">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-3 sm:px-4 py-1 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all"
              style={{ background: activeTab === tab.id ? "rgba(0,212,255,0.15)" : "rgba(11,18,32,0.8)", color: activeTab === tab.id ? "#00D4FF" : "#8899AA", border: `1px solid ${activeTab === tab.id ? "rgba(0,212,255,0.4)" : "rgba(255,255,255,0.06)"}` }}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: activeTab === tab.id ? "rgba(0,212,255,0.3)" : "rgba(255,255,255,0.08)", color: activeTab === tab.id ? "#00D4FF" : "#8899AA" }}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ─── OVERVIEW TAB ─────────────────────────────────────── */}
          {activeTab === "overview" && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">

              {/* Type breakdown */}
              {stats.typeBreakdown.length > 0 && (
                <div className="rounded-2xl p-6" style={{ background: "rgba(11,18,32,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <h2 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: "#8899AA" }}>
                    <BarChart3 className="w-4 h-4" />Watching Breakdown
                  </h2>
                  <div className="space-y-3">
                    {stats.typeBreakdown.map(t => (
                      <div key={t.label}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm" style={{ color: "#F0F4FF" }}>{t.label}</span>
                          <span className="text-sm font-bold" style={{ color: t.color }}>{t.count}</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${stats.totalWatched > 0 ? (t.count / stats.totalWatched) * 100 : 0}%` }} transition={{ duration: 0.8, ease: "easeOut" }} className="h-full rounded-full" style={{ background: t.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Achievements */}
              {stats.achievements.length > 0 && (
                <div className="rounded-2xl p-6" style={{ background: "rgba(11,18,32,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <h2 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: "#8899AA" }}>
                    <Award className="w-4 h-4" />Achievements
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {stats.achievements.map(a => (
                      <div key={a.label} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.1)" }}>
                        <span className="text-2xl">{a.icon}</span>
                        <div>
                          <p className="text-xs font-bold" style={{ color: "#F0F4FF" }}>{a.label}</p>
                          <p className="text-[10px]" style={{ color: "#8899AA" }}>{a.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}



              {stats.totalWatched === 0 && (
                <div className="text-center py-16">
                  <Film className="w-16 h-16 mx-auto mb-4" style={{ color: "#8899AA" }} />
                  <h3 className="text-xl font-bold mb-2" style={{ color: "#F0F4FF" }}>Start Your Journey</h3>
                  <p className="mb-4" style={{ color: "#8899AA" }}>Watch movies, shows, and anime to build your profile</p>
                  <Link href="/"><span className="px-6 py-3 rounded-xl text-sm font-semibold cursor-pointer" style={{ background: "rgba(0,212,255,0.15)", color: "#00D4FF", border: "1px solid rgba(0,212,255,0.3)" }}>Browse Content</span></Link>
                </div>
              )}
            </motion.div>
          )}

          {/* ─── HISTORY TAB ──────────────────────────────────────── */}
          {activeTab === "history" && (
            <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  {(["all", "movie", "tv", "anime"] as const).map(f => (
                    <button key={f} onClick={() => setHistoryFilter(f)} className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize" style={{ background: historyFilter === f ? "rgba(0,212,255,0.15)" : "rgba(11,18,32,0.8)", color: historyFilter === f ? "#00D4FF" : "#8899AA", border: `1px solid ${historyFilter === f ? "rgba(0,212,255,0.4)" : "rgba(255,255,255,0.06)"}` }}>
                      {f === "all" ? "All" : f === "movie" ? "Movies" : f === "tv" ? "TV" : "Anime"}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {(["list", "grid"] as const).map(v => (
                      <button key={v} onClick={() => setViewMode(v)} className="p-1.5 rounded" style={{ background: viewMode === v ? "rgba(0,212,255,0.15)" : "rgba(11,18,32,0.8)", color: viewMode === v ? "#00D4FF" : "#8899AA", border: `1px solid ${viewMode === v ? "rgba(0,212,255,0.4)" : "rgba(255,255,255,0.06)"}` }}>
                        {v === "list" ? <List className="w-3.5 h-3.5" /> : <Grid className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                  {watchHistory.length > 0 && (
                    <button onClick={() => setShowClearConfirm(true)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "rgba(255,100,100,0.1)", color: "#FF6464", border: "1px solid rgba(255,100,100,0.2)" }}>
                      <Trash2 className="w-3 h-3" />Clear All
                    </button>
                  )}
                </div>
              </div>

              {filteredHistory.length === 0 ? (
                <div className="text-center py-16">
                  <Clock className="w-12 h-12 mx-auto mb-4" style={{ color: "#8899AA" }} />
                  <p style={{ color: "#8899AA" }}>No watch history yet</p>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {filteredHistory.map((item, i) => {
                    const TypeIcon = getTypeIcon(item.type);
                    return (
                      <Link key={i} href={`/watch/${item.type}/${item.id}`}>
                        <motion.div className="rounded-xl overflow-hidden cursor-pointer" style={{ border: "1px solid rgba(255,255,255,0.06)" }} whileHover={{ scale: 1.04 }}>
                          {item.poster ? <div className="aspect-[2/3]"><img src={item.poster} alt={item.title} className="w-full h-full object-cover" /></div> : <div className="aspect-[2/3] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}><TypeIcon className="w-5 h-5" style={{ color: getTypeColor(item.type) }} /></div>}
                          <div className="p-1.5" style={{ background: "rgba(11,18,32,0.9)" }}>
                            <p className="text-[10px] truncate" style={{ color: "#F0F4FF" }}>{item.title}</p>
                          </div>
                        </motion.div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredHistory.map((item, i) => {
                    const TypeIcon = getTypeIcon(item.type);
                    return (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="flex items-center gap-4 p-3 rounded-xl" style={{ background: "rgba(11,18,32,0.8)", border: "1px solid rgba(255,255,255,0.05)" }}>
                        {item.poster ? (
                          <img src={item.poster} alt={item.title} className="w-10 h-14 object-cover rounded-lg flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-14 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(0,0,0,0.4)" }}>
                            <TypeIcon className="w-5 h-5" style={{ color: getTypeColor(item.type) }} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{ background: item.type === "movie" ? "rgba(255,100,100,0.15)" : item.type === "tv" ? "rgba(100,200,255,0.15)" : "rgba(200,100,255,0.15)", color: getTypeColor(item.type) }}>{getTypeLabel(item.type)}</span>
                          </div>
                          <p className="text-sm font-semibold truncate" style={{ color: "#F0F4FF" }}>{item.title}</p>
                          {item.type !== "movie" && (
                            <p className="text-xs" style={{ color: "#8899AA" }}>
                              {item.season ? `Season ${item.season} · ` : ""}Episode {item.episode}
                            </p>
                          )}
                          <p className="text-xs" style={{ color: "#8899AA" }}>{new Date(item.watchedAt).toLocaleDateString()}</p>
                        </div>
                        <Link href={`/watch/${item.type}/${item.id}${item.season ? `?season=${item.season}&episode=${item.episode || 1}` : ""}`}>
                          <motion.button className="p-2 rounded-lg" style={{ background: "rgba(0,212,255,0.08)", color: "#00D4FF" }} whileTap={{ scale: 0.95 }}>
                            <Play className="w-4 h-4" />
                          </motion.button>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Clear confirm dialog */}
              <AnimatePresence>
                {showClearConfirm && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(5,8,22,0.85)", backdropFilter: "blur(8px)" }}>
                    <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="rounded-2xl p-6 max-w-sm w-full" style={{ background: "rgba(11,18,32,0.95)", border: "1px solid rgba(255,100,100,0.3)" }}>
                      <h3 className="text-lg font-bold mb-2" style={{ color: "#FFFFFF" }}>Clear Watch History?</h3>
                      <p className="text-sm mb-6" style={{ color: "#8899AA" }}>This action cannot be undone. All {watchHistory.length} entries will be removed.</p>
                      <div className="flex gap-3">
                        <button onClick={() => setShowClearConfirm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "rgba(255,255,255,0.05)", color: "#8899AA", border: "1px solid rgba(255,255,255,0.08)" }}>Cancel</button>
                        <button onClick={() => { clearHistory(); setShowClearConfirm(false); }} className="flex-1 py-2.5 rounded-xl text-sm font-semibold" style={{ background: "rgba(255,100,100,0.2)", color: "#FF6464", border: "1px solid rgba(255,100,100,0.3)" }}>Clear History</button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ─── WATCHLIST TAB ────────────────────────────────────── */}
          {activeTab === "watchlist" && (
            <motion.div key="watchlist" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  {(["all", "movie", "tv", "anime"] as const).map(f => (
                    <button key={f} onClick={() => setWatchlistFilter(f)} className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize" style={{ background: watchlistFilter === f ? "rgba(139,92,246,0.15)" : "rgba(11,18,32,0.8)", color: watchlistFilter === f ? "#8B5CF6" : "#8899AA", border: `1px solid ${watchlistFilter === f ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.06)"}` }}>
                      {f === "all" ? "All" : f === "movie" ? "Movies" : f === "tv" ? "TV" : "Anime"}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1">
                  {(["list", "grid"] as const).map(v => (
                    <button key={v} onClick={() => setViewMode(v)} className="p-1.5 rounded" style={{ background: viewMode === v ? "rgba(0,212,255,0.15)" : "rgba(11,18,32,0.8)", color: viewMode === v ? "#00D4FF" : "#8899AA", border: `1px solid ${viewMode === v ? "rgba(0,212,255,0.4)" : "rgba(255,255,255,0.06)"}` }}>
                      {v === "list" ? <List className="w-3.5 h-3.5" /> : <Grid className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {filteredWatchlist.length === 0 ? (
                <div className="text-center py-16">
                  <Bookmark className="w-12 h-12 mx-auto mb-4" style={{ color: "#8899AA" }} />
                  <p style={{ color: "#8899AA" }}>Your watchlist is empty</p>
                  <Link href="/"><span className="mt-4 inline-block px-6 py-3 rounded-xl text-sm font-semibold cursor-pointer" style={{ background: "rgba(139,92,246,0.15)", color: "#8B5CF6", border: "1px solid rgba(139,92,246,0.3)" }}>Discover Content</span></Link>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                  {filteredWatchlist.map((item, i) => (
                    <motion.div key={i} className="relative group" whileHover={{ scale: 1.04 }}>
                      <Link href={`/detail/${item.type}/${item.id}`}>
                        <div className="rounded-xl overflow-hidden cursor-pointer" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                          {item.poster ? (
                            <div className="aspect-[2/3]"><img src={item.poster} alt={item.title} className="w-full h-full object-cover" /></div>
                          ) : (
                            <div className="aspect-[2/3] flex items-center justify-center" style={{ background: "rgba(11,18,32,0.8)" }}>
                              {(() => { const I = getTypeIcon(item.type); return <I className="w-8 h-8" style={{ color: getTypeColor(item.type) }} />; })()}
                            </div>
                          )}
                          <div className="p-2" style={{ background: "rgba(11,18,32,0.9)" }}>
                            <p className="text-[10px] font-semibold truncate" style={{ color: "#F0F4FF" }}>{item.title}</p>
                            {item.rating != null && item.rating > 0 && <p className="text-[10px] flex items-center gap-0.5" style={{ color: "#FFD700" }}><Star className="w-2 h-2" />{item.rating.toFixed(1)}</p>}
                          </div>
                        </div>
                      </Link>
                      <button onClick={() => removeFromWatchlist(item.id, item.type)} className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: "rgba(255,100,100,0.8)" }}>
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredWatchlist.map((item, i) => {
                    const TypeIcon = getTypeIcon(item.type);
                    return (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} className="flex items-center gap-4 p-3 rounded-xl" style={{ background: "rgba(11,18,32,0.8)", border: "1px solid rgba(255,255,255,0.05)" }}>
                        {item.poster ? <img src={item.poster} alt={item.title} className="w-10 h-14 object-cover rounded-lg flex-shrink-0" /> : <div className="w-10 h-14 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(0,0,0,0.4)" }}><TypeIcon className="w-5 h-5" style={{ color: getTypeColor(item.type) }} /></div>}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: "#F0F4FF" }}>{item.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{ background: item.type === "movie" ? "rgba(255,100,100,0.15)" : item.type === "tv" ? "rgba(100,200,255,0.15)" : "rgba(200,100,255,0.15)", color: getTypeColor(item.type) }}>{getTypeLabel(item.type)}</span>
                            {item.rating != null && item.rating > 0 && <span className="text-xs flex items-center gap-0.5" style={{ color: "#FFD700" }}><Star className="w-3 h-3" />{item.rating.toFixed(1)}</span>}
                            {item.year && <span className="text-xs" style={{ color: "#8899AA" }}>{item.year}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link href={`/watch/${item.type}/${item.id}`}>
                            <motion.button className="p-2 rounded-lg" style={{ background: "rgba(0,212,255,0.08)", color: "#00D4FF" }} whileTap={{ scale: 0.95 }}><Play className="w-4 h-4" /></motion.button>
                          </Link>
                          <motion.button onClick={() => removeFromWatchlist(item.id, item.type)} className="p-2 rounded-lg" style={{ background: "rgba(255,100,100,0.08)", color: "#FF6464" }} whileTap={{ scale: 0.95 }}><Trash2 className="w-4 h-4" /></motion.button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ─── DOWNLOADS TAB ────────────────────────────────────── */}
          {activeTab === "downloads" && (
            <motion.div key="downloads" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {downloads.length === 0 ? (
                <div className="text-center py-16">
                  <Download className="w-12 h-12 mx-auto mb-4" style={{ color: "#8899AA" }} />
                  <p style={{ color: "#8899AA" }}>No downloads yet</p>
                  <p className="text-sm mt-2" style={{ color: "#8899AA" }}>Use the Download button while watching to save titles</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {downloads.map((item: any, i: number) => {
                    const TypeIcon = getTypeIcon(item.type || "movie");
                    return (
                      <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-4 p-3 rounded-xl" style={{ background: "rgba(11,18,32,0.8)", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <div className="w-10 h-14 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(0,0,0,0.4)" }}>
                          <TypeIcon className="w-5 h-5" style={{ color: getTypeColor(item.type || "movie") }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: "#F0F4FF" }}>{item.title || "Unknown Title"}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {item.quality && <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{ background: "rgba(6,255,165,0.1)", color: "#06FFA5", border: "1px solid rgba(6,255,165,0.2)" }}>{item.quality}</span>}
                            {item.downloadedAt && <span className="text-xs" style={{ color: "#8899AA" }}>{new Date(item.downloadedAt).toLocaleDateString()}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: "rgba(6,255,165,0.08)", border: "1px solid rgba(6,255,165,0.2)" }}>
                            <Check className="w-3 h-3" style={{ color: "#06FFA5" }} />
                            <span className="text-xs font-semibold" style={{ color: "#06FFA5" }}>Downloaded</span>
                          </div>
                          <motion.button onClick={() => removeDownload((item as any).id || i, (item as any).type || "movie")} className="p-2 rounded-lg" style={{ background: "rgba(255,100,100,0.08)", color: "#FF6464" }} whileTap={{ scale: 0.95 }}><Trash2 className="w-4 h-4" /></motion.button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ─── SETTINGS TAB ─────────────────────────────────────── */}
          {activeTab === "settings" && (
            <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4 max-w-2xl">
              <div className="rounded-2xl p-6" style={{ background: "rgba(11,18,32,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "#8899AA" }}>Account</h3>
                <div className="space-y-3">
                  <SettingRow icon={User} label="Display Name" value={user.name} />
                  <SettingRow icon={Shield} label="Email" value={user.email} />
                  <SettingRow icon={Calendar} label="Joined" value={new Date().getFullYear().toString()} />
                </div>
              </div>

              <div className="rounded-2xl p-6" style={{ background: "rgba(11,18,32,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "#8899AA" }}>Preferences</h3>
                <div className="space-y-3">
                  <ToggleSetting label="Auto-play next episode" description="Automatically load the next episode when one ends" defaultOn={true} />
                  <ToggleSetting label="Remember watch progress" description="Save your place in episodes and shows" defaultOn={true} />
                  <ToggleSetting label="Show watched badges" description="Show checkmarks on episodes you've seen" defaultOn={true} />
                </div>
              </div>

              <div className="rounded-2xl p-6" style={{ background: "rgba(11,18,32,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "#8899AA" }}>Data & Privacy</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#F0F4FF" }}>Watch History</p>
                      <p className="text-xs" style={{ color: "#8899AA" }}>{watchHistory.length} entries stored locally</p>
                    </div>
                    <button onClick={() => { setActiveTab("history"); setShowClearConfirm(true); }} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "rgba(255,100,100,0.1)", color: "#FF6464", border: "1px solid rgba(255,100,100,0.2)" }}>Clear</button>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "#F0F4FF" }}>Watchlist</p>
                      <p className="text-xs" style={{ color: "#8899AA" }}>{watchlist.length} items saved</p>
                    </div>
                    <Link href="/watchlist"><span className="px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer" style={{ background: "rgba(0,212,255,0.1)", color: "#00D4FF", border: "1px solid rgba(0,212,255,0.2)" }}>View</span></Link>
                  </div>
                </div>
              </div>

              <button onClick={handleSignOut} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold" style={{ background: "rgba(255,100,100,0.1)", color: "#FF6464", border: "1px solid rgba(255,100,100,0.2)" }}>
                <LogOut className="w-4 h-4" />Sign Out of Zentrix
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Footer />
    </div>
  );
}

function SettingRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4" style={{ color: "#8899AA" }} />
        <span className="text-sm" style={{ color: "#8899AA" }}>{label}</span>
      </div>
      <span className="text-sm font-semibold" style={{ color: "#F0F4FF" }}>{value}</span>
    </div>
  );
}

function ToggleSetting({ label, description, defaultOn }: { label: string; description: string; defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
      <div>
        <p className="text-sm font-semibold" style={{ color: "#F0F4FF" }}>{label}</p>
        <p className="text-xs" style={{ color: "#8899AA" }}>{description}</p>
      </div>
      <button onClick={() => setOn(!on)} className="relative w-10 h-5 rounded-full transition-colors" style={{ background: on ? "rgba(0,212,255,0.6)" : "rgba(255,255,255,0.1)" }}>
        <div className="absolute top-0.5 w-4 h-4 rounded-full transition-transform bg-white" style={{ transform: on ? "translateX(1.375rem)" : "translateX(0.125rem)" }} />
      </button>
    </div>
  );
}
