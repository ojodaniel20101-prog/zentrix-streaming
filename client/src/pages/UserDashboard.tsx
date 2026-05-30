/*
  Mobile-Optimized User Dashboard
  Features: Watchlist, watch history, recommendations, profile settings, badges, achievements, feedback
*/

import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useWatchlist } from "@/contexts/WatchlistContext";
import {
  Bookmark, BookmarkCheck, History, Settings, LogOut, Menu, X,
  Play, Clock, Star, Trash2, Share2, Download, ChevronRight,
  User, Bell, Lock, Eye, EyeOff, Grid, List, Search, Send, MessageSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type DashboardTab = "watchlist" | "history" | "recommendations" | "badges" | "feedback" | "profile";
type ViewMode = "grid" | "list";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earned: boolean;
  earnedAt?: Date;
}

interface UserStats {
  totalWatched: number;
  totalHours: number;
  favoriteGenre: string;
  streakDays: number;
  badges: Badge[];
}

interface WatchlistItem {
  id: number;
  title: string;
  type: "movie" | "tv" | "anime";
  poster: string;
  rating: number;
  progress?: number;
}

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const { watchlist, removeFromWatchlist } = useWatchlist();
  const [activeTab, setActiveTab] = useState<DashboardTab>("watchlist");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [feedbackType, setFeedbackType] = useState("bug");
  const [feedbackSubject, setFeedbackSubject] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [userFeedbacks, setUserFeedbacks] = useState<any[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);
  const [showFeedbackForm, setShowFeedbackForm] = useState(true);

  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [historyItems, setHistoryItems] = useState<WatchlistItem[]>([]);

  useEffect(() => {
    const savedWatchlist = JSON.parse(localStorage.getItem("zx_watchlist") || "[]");
    const savedHistory = JSON.parse(localStorage.getItem("zx_history") || "[]");
    
    if (savedWatchlist.length > 0) {
      setWatchlistItems(savedWatchlist.map((item: any) => ({
        id: item.id,
        title: item.title,
        type: item.type,
        poster: item.poster,
        rating: item.rating || 0,
        progress: item.progress || 0,
      })));
    } else {
      setWatchlistItems([
        { id: 1, title: "Frieren: Beyond Journey's End", type: "anime", poster: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx154587-qQTzQnEJJ3oB.jpg", rating: 9.1, progress: 65 },
        { id: 2, title: "Attack on Titan", type: "anime", poster: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx16498-buvcRTBx4NSm.jpg", rating: 8.5, progress: 100 },
        { id: 3, title: "Dune: Part Two", type: "movie", poster: "https://image.tmdb.org/t/p/w300/8zTezRondo1J3BAJjLn0bnLWMO6.jpg", rating: 8.0, progress: 45 },
      ]);
    }
    
    if (savedHistory.length > 0) {
      setHistoryItems(savedHistory.slice(0, 10).map((item: any) => ({
        id: item.id,
        title: item.title,
        type: item.type,
        poster: item.poster,
        rating: item.rating || 0,
      })));
    } else {
      setHistoryItems([
        { id: 1, title: "Witch Hat Atelier", type: "anime", poster: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx147105-rwOX8qyUy8gV.jpg", rating: 8.6 },
        { id: 2, title: "Delicious in Dungeon", type: "anime", poster: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx153518-IVXPDY5ph3kO.jpg", rating: 8.5 },
      ]);
    }
  }, []);

  // Fetch user feedbacks from database using tRPC
  const userFeedbacksQuery = trpc.feedback.getUserFeedback.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 5000, // Refetch every 5 seconds to get admin replies
  });

  useEffect(() => {
    if (userFeedbacksQuery.data) {
      setUserFeedbacks(userFeedbacksQuery.data);
    } else if (user) {
      // Fallback to localStorage if tRPC fails
      const feedbacks = JSON.parse(localStorage.getItem(`feedbacks_${user.id}`) || "[]");
      setUserFeedbacks(feedbacks);
    }
  }, [userFeedbacksQuery.data, user]);

  // Enhanced badges system
  const badges: Badge[] = [
    { id: "first-watch", name: "First Watch", description: "Watched your first episode", icon: "🎬", color: "#00D4FF", earned: true, earnedAt: new Date(Date.now() - 30*24*60*60*1000) },
    { id: "binge-watcher", name: "Binge Watcher", description: "Watched 10+ episodes in a day", icon: "🔥", color: "#FF6B6B", earned: true, earnedAt: new Date(Date.now() - 15*24*60*60*1000) },
    { id: "anime-fan", name: "Anime Fan", description: "Watched 50 anime episodes", icon: "⭐", color: "#FFD700", earned: true, earnedAt: new Date(Date.now() - 7*24*60*60*1000) },
    { id: "movie-buff", name: "Movie Buff", description: "Watched 20 movies", icon: "🎭", color: "#8B5CF6", earned: false },
    { id: "series-master", name: "Series Master", description: "Completed 5 TV series", icon: "📺", color: "#00D4FF", earned: false },
    { id: "critic", name: "Critic", description: "Rated 25 items", icon: "🏆", color: "#FFD700", earned: false },
    { id: "explorer", name: "Explorer", description: "Watched content from 10 genres", icon: "🌍", color: "#00D4FF", earned: false },
    { id: "loyal", name: "Loyal Member", description: "Member for 30 days", icon: "💎", color: "#8B5CF6", earned: true, earnedAt: new Date(Date.now() - 30*24*60*60*1000) },
    { id: "night-owl", name: "Night Owl", description: "Watched 5+ hours between midnight and 6am", icon: "🌙", color: "#9D4EDD", earned: true, earnedAt: new Date(Date.now() - 20*24*60*60*1000) },
    { id: "speed-watcher", name: "Speed Watcher", description: "Watched 100 episodes in a month", icon: "⚡", color: "#FF006E", earned: true, earnedAt: new Date(Date.now() - 10*24*60*60*1000) },
    { id: "genre-master", name: "Genre Master", description: "Watched 50+ items from one genre", icon: "🎨", color: "#3A86FF", earned: true, earnedAt: new Date(Date.now() - 8*24*60*60*1000) },
    { id: "collector", name: "Collector", description: "Added 50 items to watchlist", icon: "📚", color: "#FB5607", earned: true, earnedAt: new Date(Date.now() - 6*24*60*60*1000) },
    { id: "social-butterfly", name: "Social Butterfly", description: "Shared 10 items with friends", icon: "🦋", color: "#FFBE0B", earned: false },
    { id: "trendsetter", name: "Trendsetter", description: "Watched a new release within 24 hours", icon: "🚀", color: "#8338EC", earned: false },
    { id: "completionist", name: "Completionist", description: "Finished 10 complete series", icon: "✅", color: "#06FFA5", earned: false },
    { id: "reviewer", name: "Reviewer", description: "Written 5 reviews", icon: "📝", color: "#FF006E", earned: false },
  ];

  const calculateStats = (): UserStats => {
    const history = JSON.parse(localStorage.getItem("zx_history") || "[]");
    const totalWatched = history.length;
    const totalHours = history.reduce((sum: number, item: any) => {
      return sum + (item.type === "movie" ? 2 : 0.75);
    }, 0);
    const genreCounts: Record<string, number> = {};
    history.forEach((item: any) => {
      const genre = item.genres?.[0] || "Unknown";
      genreCounts[genre] = (genreCounts[genre] || 0) + 1;
    });
    const favoriteGenre = Object.entries(genreCounts).sort(([,a],[,b]) => b-a)[0]?.[0] || "Anime";
    const watchDates = history.map((item: any) => new Date(item.watchedAt).toDateString());
    const uniqueDates = Array.from(new Set(watchDates));
    let streakDays = 0;
    if (uniqueDates.length > 0) {
      let currentDate = new Date();
      while (uniqueDates.includes(currentDate.toDateString())) {
        streakDays++;
        currentDate.setDate(currentDate.getDate() - 1);
      }
    }
    return {
      totalWatched,
      totalHours: Math.round(totalHours),
      favoriteGenre,
      streakDays,
      badges,
    };
  };

  const userStats = calculateStats();

  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const tabs: { id: DashboardTab; label: string; icon: React.ReactNode }[] = [
    { id: "watchlist", label: "Watchlist", icon: <Bookmark className="w-5 h-5" /> },
    { id: "history", label: "History", icon: <History className="w-5 h-5" /> },
    { id: "recommendations", label: "Recommendations", icon: <Star className="w-5 h-5" /> },
    { id: "badges", label: "Badges", icon: <Star className="w-5 h-5" /> },
    { id: "feedback", label: "Send Feedback", icon: <MessageSquare className="w-5 h-5" /> },
    { id: "profile", label: "Profile", icon: <User className="w-5 h-5" /> },
  ];

  const filteredWatchlist = watchlistItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const submitFeedbackMutation = trpc.feedback.submit.useMutation();

  const handleFeedbackSubmit = async () => {
    if (feedbackSubject.trim() && feedbackMessage.trim()) {
      try {
        await submitFeedbackMutation.mutateAsync({
          type: feedbackType as "bug" | "feature_request" | "opinion" | "general_feedback" | "other",
          subject: feedbackSubject,
          message: feedbackMessage,
        });
        
        // Also save to localStorage for local tracking
        const feedback = {
          id: Date.now(),
          userId: user?.id,
          type: feedbackType,
          subject: feedbackSubject,
          message: feedbackMessage,
          timestamp: new Date().toISOString(),
          status: "new",
          replies: [],
        };
        
        const feedbacks = JSON.parse(localStorage.getItem(`feedbacks_${user?.id}`) || "[]");
        feedbacks.push(feedback);
        localStorage.setItem(`feedbacks_${user?.id}`, JSON.stringify(feedbacks));
        
        const allFeedbacks = JSON.parse(localStorage.getItem("feedbacks") || "[]");
        allFeedbacks.push(feedback);
        localStorage.setItem("feedbacks", JSON.stringify(allFeedbacks));
        
        setUserFeedbacks(feedbacks);
        setFeedbackSubmitted(true);
        setTimeout(() => {
          setFeedbackSubmitted(false);
          setFeedbackType("bug");
          setFeedbackSubject("");
          setFeedbackMessage("");
          setShowFeedbackForm(false);
        }, 2000);
      } catch (error) {
        console.error("Failed to submit feedback:", error);
      }
    }
  };

  const renderWatchlistItem = (item: WatchlistItem) => (
    <motion.div
      key={item.id}
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={viewMode === "grid" ? "rounded-lg overflow-hidden group cursor-pointer" : "flex items-center gap-4 p-3 rounded-lg hover:bg-opacity-50"}
      style={viewMode === "grid" ? { background: "rgba(11,18,32,0.8)" } : { background: "rgba(11,18,32,0.5)" }}
    >
      {viewMode === "grid" ? (
        <Link href={`/detail/${item.type}/${item.id}`}>
          <div className="relative aspect-[2/3] overflow-hidden">
            <img src={item.poster} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
              <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="white" />
            </div>
            {item.progress && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                <div className="h-full bg-cyan-500" style={{ width: `${item.progress}%` }} />
              </div>
            )}
          </div>
          <div className="p-3">
            <p className="text-sm font-semibold truncate" style={{ color: "#F0F4FF" }}>{item.title}</p>
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3" style={{ color: "#FFD700" }} fill="#FFD700" />
                <span className="text-xs" style={{ color: "#8899AA" }}>{item.rating}</span>
              </div>
              <span className="text-xs px-2 py-1 rounded" style={{ background: "rgba(139,92,246,0.2)", color: "#8B5CF6" }}>{item.type}</span>
            </div>
          </div>
        </Link>
      ) : (
        <Link href={`/detail/${item.type}/${item.id}`}>
          <div className="flex items-center gap-4 w-full">
            <img src={item.poster} alt={item.title} className="w-12 h-16 object-cover rounded" />
            <div className="flex-1">
              <p className="font-semibold text-sm" style={{ color: "#F0F4FF" }}>{item.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <Star className="w-3 h-3" style={{ color: "#FFD700" }} fill="#FFD700" />
                <span className="text-xs" style={{ color: "#8899AA" }}>{item.rating}</span>
              </div>
            </div>
            <button onClick={() => removeFromWatchlist(item.id, item.type)} className="p-2 hover:bg-opacity-50">
              <Trash2 className="w-4 h-4" style={{ color: "#EF4444" }} />
            </button>
          </div>
        </Link>
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "rgba(11,18,32,1)" }}>
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex w-64 border-r" style={{ borderColor: "rgba(139,92,246,0.1)" }}>
          <div className="w-full flex flex-col p-6 space-y-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all"
                style={{
                  background: activeTab === tab.id ? "rgba(139,92,246,0.2)" : "transparent",
                  color: activeTab === tab.id ? "#00D4FF" : "#8899AA",
                }}
              >
                {tab.icon}
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed inset-0 z-40 md:hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-64 flex flex-col" style={{ background: "rgba(11,18,32,0.95)" }}>
                <div className="p-4 flex items-center justify-between border-b" style={{ borderColor: "rgba(139,92,246,0.1)" }}>
                  <h2 className="font-bold" style={{ color: "#F0F4FF" }}>Menu</h2>
                  <button onClick={() => setMobileMenuOpen(false)}>
                    <X className="w-5 h-5" style={{ color: "#8899AA" }} />
                  </button>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all"
                      style={{
                        background: activeTab === tab.id ? "rgba(139,92,246,0.2)" : "transparent",
                        color: activeTab === tab.id ? "#00D4FF" : "#8899AA",
                      }}
                    >
                      {tab.icon}
                      <span className="text-sm font-medium">{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between p-4 border-b" style={{ borderColor: "rgba(139,92,246,0.1)" }}>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu className="w-6 h-6" style={{ color: "#00D4FF" }} />
            </button>
            <h1 className="font-bold" style={{ color: "#F0F4FF" }}>Dashboard</h1>
            <div className="w-6" />
          </div>

          <div className="p-4 md:p-6 max-w-7xl mx-auto">
            {/* Watchlist Tab */}
            {activeTab === "watchlist" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-bold" style={{ color: "#F0F4FF" }}>My Watchlist</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewMode("grid")}
                      className="p-2 rounded-lg transition-all"
                      style={{ background: viewMode === "grid" ? "rgba(139,92,246,0.2)" : "transparent", color: viewMode === "grid" ? "#00D4FF" : "#8899AA" }}
                    >
                      <Grid className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className="p-2 rounded-lg transition-all"
                      style={{ background: viewMode === "list" ? "rgba(139,92,246,0.2)" : "transparent", color: viewMode === "list" ? "#00D4FF" : "#8899AA" }}
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-3 w-5 h-5" style={{ color: "#8899AA" }} />
                  <input
                    type="text"
                    placeholder="Search watchlist..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg text-sm"
                    style={{ background: "rgba(11,18,32,0.8)", border: "1px solid rgba(139,92,246,0.2)", color: "#F0F4FF" }}
                  />
                </div>

                {filteredWatchlist.length > 0 ? (
                  <div className={viewMode === "grid" ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4" : "space-y-2"}>
                    {filteredWatchlist.map(item => renderWatchlistItem(item))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Bookmark className="w-12 h-12 mx-auto mb-4" style={{ color: "#8899AA" }} />
                    <p style={{ color: "#8899AA" }}>No items in watchlist</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* History Tab */}
            {activeTab === "history" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ color: "#F0F4FF" }}>Watch History</h2>
                <div className="space-y-2">
                  {historyItems.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4 rounded-lg"
                      style={{ background: "rgba(11,18,32,0.8)" }}
                    >
                      <img src={item.poster} alt={item.title} className="w-12 h-16 object-cover rounded" />
                      <div className="flex-1">
                        <p className="font-semibold" style={{ color: "#F0F4FF" }}>{item.title}</p>
                        <p className="text-xs mt-1" style={{ color: "#8899AA" }}>Watched 2 hours ago</p>
                      </div>
                      <Clock className="w-5 h-5" style={{ color: "#8899AA" }} />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Recommendations Tab */}
            {activeTab === "recommendations" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <h2 className="text-2xl font-bold" style={{ color: "#F0F4FF" }}>Recommended For You</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="rounded-lg overflow-hidden" style={{ background: "rgba(11,18,32,0.8)" }}>
                      <div className="aspect-[2/3] bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                        <Star className="w-8 h-8 text-white" />
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-semibold truncate" style={{ color: "#F0F4FF" }}>Recommended Item {i + 1}</p>
                        <p className="text-xs mt-1" style={{ color: "#8899AA" }}>Based on your interests</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Badges Tab */}
            {activeTab === "badges" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <h2 className="text-2xl font-bold" style={{ color: "#F0F4FF" }}>Your Achievements</h2>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-4 rounded-lg" style={{ background: "rgba(11,18,32,0.8)", border: "1px solid rgba(139,92,246,0.1)" }}>
                    <p className="text-xs" style={{ color: "#8899AA" }}>Total Watched</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: "#00D4FF" }}>{userStats.totalWatched}</p>
                    <p className="text-xs mt-1" style={{ color: "#8899AA" }}>items</p>
                  </div>
                  <div className="p-4 rounded-lg" style={{ background: "rgba(11,18,32,0.8)", border: "1px solid rgba(139,92,246,0.1)" }}>
                    <p className="text-xs" style={{ color: "#8899AA" }}>Total Hours</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: "#FFD700" }}>{userStats.totalHours}</p>
                    <p className="text-xs mt-1" style={{ color: "#8899AA" }}>hours</p>
                  </div>
                  <div className="p-4 rounded-lg" style={{ background: "rgba(11,18,32,0.8)", border: "1px solid rgba(139,92,246,0.1)" }}>
                    <p className="text-xs" style={{ color: "#8899AA" }}>Favorite Genre</p>
                    <p className="text-lg font-bold mt-1" style={{ color: "#8B5CF6" }}>{userStats.favoriteGenre}</p>
                  </div>
                  <div className="p-4 rounded-lg" style={{ background: "rgba(11,18,32,0.8)", border: "1px solid rgba(139,92,246,0.1)" }}>
                    <p className="text-xs" style={{ color: "#8899AA" }}>Streak</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: "#FF6B6B" }}>{userStats.streakDays}</p>
                    <p className="text-xs mt-1" style={{ color: "#8899AA" }}>days</p>
                  </div>
                </div>

                {/* Badges Grid */}
                <div>
                  <h3 className="text-lg font-bold mb-3" style={{ color: "#F0F4FF" }}>Badges</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {userStats.badges.map(badge => (
                      <motion.div
                        key={badge.id}
                        whileHover={{ scale: badge.earned ? 1.05 : 1 }}
                        className="p-4 rounded-lg text-center cursor-pointer transition-all"
                        style={{
                          background: badge.earned ? `rgba(${badge.color === "#00D4FF" ? "0,212,255" : badge.color === "#FF6B6B" ? "255,107,107" : badge.color === "#FFD700" ? "255,215,0" : "139,92,246"},0.1)` : "rgba(11,18,32,0.5)",
                          border: `1px solid ${badge.earned ? badge.color : "rgba(139,92,246,0.1)"}`,
                          opacity: badge.earned ? 1 : 0.5,
                        }}
                      >
                        <p className="text-3xl mb-2">{badge.icon}</p>
                        <p className="text-xs font-semibold" style={{ color: badge.earned ? badge.color : "#8899AA" }}>{badge.name}</p>
                        <p className="text-[10px] mt-1" style={{ color: "#8899AA" }}>{badge.description}</p>
                        {badge.earned && badge.earnedAt && (
                          <p className="text-[10px] mt-1" style={{ color: badge.color }}>✓ Earned</p>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Feedback Tab */}
            {activeTab === "feedback" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 max-w-4xl">
                <h2 className="text-2xl font-bold" style={{ color: "#F0F4FF" }}>Feedback & Support</h2>
                <p style={{ color: "#8899AA" }}>View your feedback messages and admin replies</p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Feedback List */}
                  <div className="lg:col-span-1 space-y-2">
                    <h3 className="text-sm font-semibold" style={{ color: "#F0F4FF" }}>Your Messages ({userFeedbacks.length})</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {userFeedbacks.length === 0 ? (
                        <p className="text-xs" style={{ color: "#8899AA" }}>No feedback messages yet</p>
                      ) : (
                        userFeedbacks.map((fb: any) => (
                          <motion.div
                            key={fb.id}
                            onClick={() => setSelectedFeedback(fb)}
                            className="p-3 rounded-lg cursor-pointer transition-all"
                            style={{
                              background: selectedFeedback?.id === fb.id ? "rgba(0,212,255,0.2)" : "rgba(11,18,32,0.6)",
                              border: selectedFeedback?.id === fb.id ? "1px solid rgba(0,212,255,0.4)" : "1px solid rgba(139,92,246,0.1)",
                            }}
                            whileHover={{ scale: 1.02 }}
                          >
                            <p className="text-xs font-semibold truncate" style={{ color: "#F0F4FF" }}>{fb.subject}</p>
                            <p className="text-[10px] mt-1" style={{ color: "#8899AA" }}>{new Date(fb.timestamp).toLocaleDateString()}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-[10px] px-2 py-0.5 rounded" style={{ background: fb.status === "new" ? "rgba(255,100,100,0.2)" : fb.status === "replied" ? "rgba(0,212,255,0.2)" : "rgba(34,197,94,0.2)", color: fb.status === "new" ? "#FF6464" : fb.status === "replied" ? "#00D4FF" : "#22C55E" }}>
                                {fb.status}
                              </span>
                              {fb.replies && fb.replies.length > 0 && (
                                <span className="text-[10px]" style={{ color: "#00D4FF" }}>({fb.replies.length})</span>
                              )}
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Conversation View */}
                  <div className="lg:col-span-2">
                    {selectedFeedback ? (
                      <div className="p-4 rounded-lg" style={{ background: "rgba(11,18,32,0.8)", border: "1px solid rgba(139,92,246,0.1)" }}>
                        <h3 className="text-lg font-semibold mb-2" style={{ color: "#F0F4FF" }}>{selectedFeedback.subject}</h3>
                        <p className="text-xs mb-4" style={{ color: "#8899AA" }}>{new Date(selectedFeedback.timestamp).toLocaleString()}</p>
                        
                        {/* User Message */}
                        <div className="mb-4 p-3 rounded-lg" style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)" }}>
                          <p className="text-xs font-semibold mb-2" style={{ color: "#00D4FF" }}>Your Message</p>
                          <p className="text-sm" style={{ color: "#F0F4FF" }}>{selectedFeedback.message}</p>
                        </div>

                        {/* Admin Replies */}
                        {selectedFeedback.replies && selectedFeedback.replies.length > 0 ? (
                          <div className="space-y-3">
                            <p className="text-xs font-semibold" style={{ color: "#F0F4FF" }}>Admin Replies</p>
                            {selectedFeedback.replies.map((reply: any, idx: number) => (
                              <div key={idx} className="p-3 rounded-lg" style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
                                <p className="text-xs font-semibold mb-1" style={{ color: "#8B5CF6" }}>Admin</p>
                                <p className="text-sm mb-2" style={{ color: "#F0F4FF" }}>{reply.message}</p>
                                <p className="text-[10px]" style={{ color: "#8899AA" }}>{new Date(reply.timestamp).toLocaleString()}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-center py-4" style={{ color: "#8899AA" }}>No admin replies yet. We'll respond soon!</p>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg text-center" style={{ background: "rgba(11,18,32,0.8)", border: "1px solid rgba(139,92,246,0.1)" }}>
                        <p style={{ color: "#8899AA" }}>Select a message to view conversation</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* New Feedback Form */}
                <div className="mt-6 pt-6" style={{ borderTop: "1px solid rgba(139,92,246,0.1)" }}>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: "#F0F4FF" }}>Send New Feedback</h3>
                  {feedbackSubmitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 rounded-lg text-center"
                    style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)" }}
                  >
                    <p className="text-lg font-semibold" style={{ color: "#22C55E" }}>✓ Thank you!</p>
                    <p className="text-sm mt-2" style={{ color: "#8899AA" }}>Your feedback has been received. We appreciate your input!</p>
                  </motion.div>
                ) : (
                  <div className="p-6 rounded-lg" style={{ background: "rgba(11,18,32,0.8)", border: "1px solid rgba(139,92,246,0.1)" }}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: "#F0F4FF" }}>Feedback Type</label>
                        <select
                          value={feedbackType}
                          onChange={(e) => setFeedbackType(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg text-sm"
                          style={{ background: "rgba(11,18,32,0.8)", border: "1px solid rgba(139,92,246,0.2)", color: "#F0F4FF" }}
                        >
                          <option value="bug">🐛 Bug Report</option>
                          <option value="feature_request">✨ Feature Request</option>
                          <option value="opinion">💭 Opinion</option>
                          <option value="general_feedback">📝 General Feedback</option>
                          <option value="other">❓ Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: "#F0F4FF" }}>Subject</label>
                        <input
                          type="text"
                          placeholder="Brief subject..."
                          value={feedbackSubject}
                          onChange={(e) => setFeedbackSubject(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg text-sm"
                          style={{ background: "rgba(11,18,32,0.8)", border: "1px solid rgba(139,92,246,0.2)", color: "#F0F4FF" }}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: "#F0F4FF" }}>Message</label>
                        <textarea
                          placeholder="Tell us more..."
                          rows={5}
                          value={feedbackMessage}
                          onChange={(e) => setFeedbackMessage(e.target.value)}
                          className="w-full px-4 py-2 rounded-lg text-sm"
                          style={{ background: "rgba(11,18,32,0.8)", border: "1px solid rgba(139,92,246,0.2)", color: "#F0F4FF" }}
                        />
                      </div>

                      <button
                        onClick={handleFeedbackSubmit}
                        disabled={!feedbackSubject.trim() || !feedbackMessage.trim()}
                        className="w-full px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        style={{ background: "rgba(0,212,255,0.2)", color: "#00D4FF", border: "1px solid rgba(0,212,255,0.4)" }}
                      >
                        <Send className="w-4 h-4" />
                        Send Feedback
                      </button>
                    </div>
                  </div>
                )}
                </div>
              </motion.div>
            )}

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 max-w-2xl">
                <h2 className="text-2xl font-bold" style={{ color: "#F0F4FF" }}>Profile Settings</h2>

                <div className="p-6 rounded-lg" style={{ background: "rgba(11,18,32,0.8)", border: "1px solid rgba(139,92,246,0.1)" }}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "rgba(139,92,246,0.2)" }}>
                      <User className="w-8 h-8" style={{ color: "#8B5CF6" }} />
                    </div>
                    <div>
                      <p className="font-semibold" style={{ color: "#F0F4FF" }}>{user?.name || "User"}</p>
                      <p className="text-sm" style={{ color: "#8899AA" }}>{user?.email}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      { label: "Email Notifications", icon: <Bell /> },
                      { label: "Privacy Settings", icon: <Lock /> },
                      { label: "Viewing Preferences", icon: <Eye /> },
                    ].map((setting, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "rgba(139,92,246,0.05)" }}>
                        <div className="flex items-center gap-3">
                          <div style={{ color: "#8B5CF6" }}>{setting.icon}</div>
                          <span className="text-sm font-medium" style={{ color: "#F0F4FF" }}>{setting.label}</span>
                        </div>
                        <ChevronRight className="w-5 h-5" style={{ color: "#8899AA" }} />
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="w-full px-6 py-3 rounded-lg font-medium"
                  style={{ background: "rgba(239,68,68,0.1)", color: "#EF4444" }}
                >
                  <LogOut className="w-4 h-4 inline mr-2" />
                  Logout
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
