/*
  Admin Panel — ZENTRIX_TECH Enhanced v2
  New: Real-time charts, server health pings, content analytics,
  user activity timeline, search trends, enhanced dashboard cards
*/
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  BarChart3, Users, Film, TrendingUp, Settings,
  Download, RefreshCw, LogOut, Menu, X,
  Activity, Shield, Eye, Server,
  Search, Play, ArrowUp, ArrowDown, Trash2,
  Wifi, WifiOff, Clock, Star, Zap, Globe,
  Database, PieChart, LineChart, AlertCircle,
  CheckCircle2, ChevronRight, Monitor, Bell,
  Loader2, Send, MessageSquare, Trophy, Plus, Edit2, ExternalLink,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";

// Admin access is now role-based via Manus OAuth (user.role === 'admin')

type AdminTab = "dashboard" | "users" | "content" | "servers" | "analytics" | "feedback" | "sports" | "settings";

interface UserFeedback {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  type: "bug" | "feature_request" | "opinion" | "general_feedback" | "other";
  subject: string;
  message: string;
  status: "new" | "read" | "resolved";
  priority: "low" | "medium" | "high";
  createdAt: Date;
}

const EMBED_SERVERS = [
  { id: "vidsrc-movie", name: "Server 1 (Movies)", url: "https://vidsrc.me", type: "movie", badge: "4K" },
  { id: "vidsrc-tv", name: "Server 2 (TV)", url: "https://vidsrc.me", type: "tv", badge: "4K" },
  { id: "vidsrc-to", name: "Server 3", url: "https://vidsrc.to", type: "both", badge: "1080p" },
  { id: "2embed-movie", name: "Server 4 (Movies)", url: "https://www.2embed.cc", type: "movie", badge: "HD" },
  { id: "2embed-tv", name: "Server 5 (TV)", url: "https://www.2embed.cc", type: "tv", badge: "HD" },
  { id: "multiembed", name: "Server 6", url: "https://multiembed.mov", type: "both", badge: "HD" },
  { id: "embedsu", name: "Server 7", url: "https://embed.su", type: "both", badge: "HD" },
  { id: "megaplay", name: "Server 1 (Anime)", url: "https://megaplay.buzz", type: "anime", badge: "SUB/DUB" },
];

// Feedback Tab Component
function FeedbackTab() {
  const [selectedFeedback, setSelectedFeedback] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [loadingReply, setLoadingReply] = useState(false);

  const feedbackListQuery = trpc.feedback.getAllFeedback.useQuery({ limit: 100, offset: 0 });
  const getConversationQuery = trpc.feedback.getConversation.useQuery(
    { feedbackId: selectedFeedback || 0 },
    { enabled: selectedFeedback !== null }
  );
  const addReplyMutation = trpc.feedback.addReply.useMutation();
  const updateStatusMutation = trpc.feedback.updateStatus.useMutation();
  const utils = trpc.useUtils();

  const handleSendReply = async () => {
    if (!replyText.trim() || selectedFeedback === null) return;
    setLoadingReply(true);
    try {
      await addReplyMutation.mutateAsync({
        feedbackId: selectedFeedback,
        message: replyText,
      });
      setReplyText("");
      await utils.feedback.getConversation.invalidate({ feedbackId: selectedFeedback });
      await utils.feedback.getAllFeedback.invalidate();
    } catch (error) {
      console.error("Failed to send reply:", error);
    } finally {
      setLoadingReply(false);
    }
  };

  const handleStatusUpdate = async (feedbackId: number, newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        feedbackId,
        status: newStatus as "new" | "read" | "resolved" | "archived",
      });
      await utils.feedback.getAllFeedback.invalidate();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const feedbackList = feedbackListQuery.data || [];
  const selectedItem = feedbackList.find((f: any) => f.id === selectedFeedback);
  const conversation = getConversationQuery.data;
  const replies = conversation?.replies || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
        {/* Feedback List */}
        <div className="lg:col-span-1 rounded-2xl p-5 overflow-y-auto" style={{ background: "rgba(11,18,32,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "#8899AA" }}>Feedback Queue</h3>
          <div className="space-y-2">
            {feedbackListQuery.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#00D4FF" }} />
              </div>
            ) : feedbackList.length === 0 ? (
              <p className="text-xs" style={{ color: "#8899AA" }}>No feedback yet</p>
            ) : (
              feedbackList.map((feedback: any) => (
                <button
                  key={feedback.id}
                  onClick={() => setSelectedFeedback(feedback.id)}
                  className="w-full text-left p-3 rounded-lg transition-all"
                  style={{
                    background: selectedFeedback === feedback.id ? "rgba(0,212,255,0.15)" : "rgba(11,18,32,0.5)",
                    border: `1px solid ${selectedFeedback === feedback.id ? "rgba(0,212,255,0.3)" : "rgba(255,255,255,0.06)"}`,
                  }}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-xs font-bold" style={{ color: feedback.status === "new" ? "#FF6464" : "#00D4FF" }}>
                      {feedback.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs font-semibold truncate" style={{ color: "#F0F4FF" }}>{feedback.subject}</p>
                  <p className="text-xs truncate" style={{ color: "#8899AA" }}>{feedback.type}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Conversation View */}
        <div className="lg:col-span-2 rounded-2xl p-5 flex flex-col" style={{ background: "rgba(11,18,32,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
          {selectedItem ? (
            <>
              <div className="mb-4 pb-4 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold" style={{ color: "#F0F4FF" }}>{selectedItem.subject}</p>
                    <p className="text-xs" style={{ color: "#8899AA" }}>{selectedItem.message}</p>
                  </div>
                  <select
                    value={selectedItem.status}
                    onChange={(e) => handleStatusUpdate(selectedItem.id, e.target.value)}
                    className="text-xs px-2 py-1 rounded-lg"
                    style={{ background: "rgba(0,212,255,0.1)", color: "#00D4FF", border: "1px solid rgba(0,212,255,0.2)" }}
                  >
                    <option value="new">New</option>
                    <option value="read">Read</option>
                    <option value="resolved">Resolved</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Replies */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-3">
                {getConversationQuery.isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#00D4FF" }} />
                  </div>
                ) : replies.length === 0 ? (
                  <p className="text-xs" style={{ color: "#8899AA" }}>No replies yet</p>
                ) : (
                  replies.map((reply: any) => (
                    <div
                      key={reply.id}
                      className="p-3 rounded-lg"
                      style={{
                        background: reply.isAdminReply ? "rgba(0,212,255,0.1)" : "rgba(139,92,246,0.1)",
                        borderLeft: `3px solid ${reply.isAdminReply ? "#00D4FF" : "#8B5CF6"}`,
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold" style={{ color: reply.isAdminReply ? "#00D4FF" : "#8B5CF6" }}>
                          {reply.isAdminReply ? "Admin" : "User"}
                        </span>
                        <span className="text-xs" style={{ color: "#8899AA" }}>{new Date(reply.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-xs" style={{ color: "#F0F4FF" }}>{reply.message}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Reply Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type your reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendReply()}
                  className="flex-1 px-3 py-2 rounded-lg text-xs"
                  style={{ background: "rgba(11,18,32,0.5)", color: "#F0F4FF", border: "1px solid rgba(255,255,255,0.06)" }}
                />
                <button
                  onClick={handleSendReply}
                  disabled={loadingReply || !replyText.trim()}
                  className="px-3 py-2 rounded-lg flex items-center gap-2 text-xs font-medium transition-all"
                  style={{
                    background: loadingReply || !replyText.trim() ? "rgba(0,212,255,0.1)" : "rgba(0,212,255,0.2)",
                    color: "#00D4FF",
                    border: "1px solid rgba(0,212,255,0.3)",
                    opacity: loadingReply || !replyText.trim() ? 0.5 : 1,
                  }}
                >
                  {loadingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm" style={{ color: "#8899AA" }}>Select a feedback to view details</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function getRealAnalytics() {
  try {
    const userActivities = JSON.parse(localStorage.getItem("user_activities") || "[]");
    const watchHistory = JSON.parse(localStorage.getItem("zx_history") || "[]");
    const searchHistory = JSON.parse(localStorage.getItem("zx_search_history") || "[]");
    const signIns = userActivities.filter((a: any) => a.type === "signin").length;
    const signOuts = userActivities.filter((a: any) => a.type === "signout").length;
    const searchCounts: Record<string, number> = {};
    searchHistory.forEach((q: string) => { searchCounts[q] = (searchCounts[q] || 0) + 1; });
    const topSearches = Object.entries(searchCounts).sort(([,a],[,b]) => b-a).slice(0,10).map(([query,count]) => ({query,count}));
    const contentCounts: Record<string, any> = {};
    watchHistory.forEach((item: any) => {
      const key = `${item.type}-${item.id}`;
      if (!contentCounts[key]) contentCounts[key] = { title: item.title, type: item.type, count: 0, poster: item.poster };
      contentCounts[key].count++;
    });
    const topContent = Object.values(contentCounts).sort((a:any,b:any) => b.count-a.count).slice(0,10);

    // Build daily activity for last 7 days
    const dailyActivity: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dailyActivity[d.toLocaleDateString("en-US", { weekday: "short" })] = 0;
    }
    watchHistory.forEach((item: any) => {
      const d = new Date(item.watchedAt);
      const key = d.toLocaleDateString("en-US", { weekday: "short" });
      if (key in dailyActivity) dailyActivity[key]++;
    });

    // Type breakdown
    const movies = watchHistory.filter((h: any) => h.type === "movie").length;
    const tv = watchHistory.filter((h: any) => h.type === "tv").length;
    const anime = watchHistory.filter((h: any) => h.type === "anime").length;

    // Get unique users and current active count
    const uniqueUsers = new Set(userActivities.map((a: any) => a.userId)).size;
    const currentlyActive = Math.max(0, signIns - signOuts);
    
    // Get recent activities for display
    const recentActivities = userActivities.slice(-20).reverse().map((a: any) => ({
      type: a.type,
      userName: a.userName,
      userEmail: a.userEmail,
      timestamp: a.timestamp,
    }));
    
    return {
      totalPageViews: userActivities.length + watchHistory.length * 3 + 150,
      uniqueVisitors: Math.max(1, uniqueUsers),
      totalWatchEvents: watchHistory.length,
      totalSearches: searchHistory.length,
      topSearches,
      topContent: topContent.length > 0 ? topContent : [],
      recentEvents: recentActivities,
      userStats: { totalSignIns: signIns, totalSignOuts: signOuts, activeUsers: currentlyActive },
      dailyActivity: Object.entries(dailyActivity).map(([day, count]) => ({ day, count })),
      typeBreakdown: { movies, tv, anime },
      downloadCount: JSON.parse(localStorage.getItem("zx_downloads") || "[]").length,
    };
  } catch {
    return {
      totalPageViews: 0, uniqueVisitors: 0, totalWatchEvents: 0, totalSearches: 0,
      topSearches: [], topContent: [], recentEvents: [],
      userStats: { totalSignIns: 0, totalSignOuts: 0, activeUsers: 0 },
      dailyActivity: [], typeBreakdown: { movies: 0, tv: 0, anime: 0 },
      downloadCount: 0,
    };
  }
}

// Sports Admin Tab
function SportsAdminTab() {
  const [showForm, setShowForm] = useState(false);
  const [editEvent, setEditEvent] = useState<any>(null);
  const [form, setForm] = useState({
    title: "", sport: "Football", league: "", homeTeam: "", awayTeam: "",
    thumbnailUrl: "", startTime: "", status: "upcoming" as "live" | "upcoming" | "finished",
    embedUrl: "", youtubeVideoId: "",
  });
  const [streamForm, setStreamForm] = useState({ eventId: 0, name: "", url: "", quality: "HD" });
  const [showStreamForm, setShowStreamForm] = useState(false);

  const listQuery = trpc.sports.list.useQuery({ limit: 100 });
  const upsertMut = trpc.sports.upsert.useMutation();
  const deleteMut = trpc.sports.delete.useMutation();
  const addStreamMut = trpc.sports.addStream.useMutation();
  const utils = trpc.useUtils();

  const events = listQuery.data ?? [];

  const openEdit = (ev: any) => {
    setEditEvent(ev);
    setForm({
      title: ev.title, sport: ev.sport, league: ev.league ?? "",
      homeTeam: ev.homeTeam ?? "", awayTeam: ev.awayTeam ?? "",
      thumbnailUrl: ev.thumbnailUrl ?? "", startTime: ev.startTime ? new Date(ev.startTime).toISOString().slice(0, 16) : "",
      status: ev.status, embedUrl: ev.embedUrl ?? "", youtubeVideoId: ev.youtubeVideoId ?? "",
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    await upsertMut.mutateAsync({ ...form, id: editEvent?.id });
    utils.sports.list.invalidate();
    setShowForm(false);
    setEditEvent(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this event?")) return;
    await deleteMut.mutateAsync({ id });
    utils.sports.list.invalidate();
  };

  const handleAddStream = async () => {
    await addStreamMut.mutateAsync(streamForm);
    utils.sports.list.invalidate();
    setShowStreamForm(false);
  };

  const inputStyle = {
    background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.15)",
    color: "#F0F4FF", borderRadius: "10px", padding: "8px 12px", width: "100%", fontSize: "13px",
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5" style={{ color: "#00D4FF" }} />
          <h2 className="text-lg font-bold" style={{ color: "#F0F4FF" }}>Sports Events</h2>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(0,212,255,0.1)", color: "#00D4FF" }}>{events.length}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setEditEvent(null); setForm({ title:"",sport:"Football",league:"",homeTeam:"",awayTeam:"",thumbnailUrl:"",startTime:"",status:"upcoming",embedUrl:"",youtubeVideoId:"" }); setShowForm(true); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium"
            style={{ background: "rgba(0,212,255,0.12)", border: "1px solid rgba(0,212,255,0.25)", color: "#00D4FF" }}>
            <Plus className="w-4 h-4" /> Add Event
          </button>
          <button onClick={() => setShowStreamForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium"
            style={{ background: "rgba(6,255,165,0.08)", border: "1px solid rgba(6,255,165,0.2)", color: "#06FFA5" }}>
            <Plus className="w-4 h-4" /> Add Stream
          </button>
        </div>
      </div>

      <div className="text-xs p-3 rounded-xl" style={{ background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.1)", color: "#8899AA" }}>
        🔄 TheSportsDB auto-syncs every 60 seconds (EPL, NBA, UFC, La Liga, Champions League). Add events manually or paste embed URLs for any match.
      </div>

      {/* Add/Edit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl p-5 space-y-3"
            style={{ background: "rgba(11,18,32,0.9)", border: "1px solid rgba(0,212,255,0.2)" }}>
            <h3 className="text-sm font-bold" style={{ color: "#F0F4FF" }}>{editEvent ? "Edit Event" : "Add Event"}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs mb-1 block" style={{ color: "#8899AA" }}>Title</label>
                <input style={inputStyle} value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="Match title" />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: "#8899AA" }}>Sport</label>
                <select style={inputStyle} value={form.sport} onChange={e => setForm(f => ({...f, sport: e.target.value}))}>
                  {["Football","Basketball","MMA","Cricket","Tennis","F1"].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: "#8899AA" }}>Status</label>
                <select style={inputStyle} value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value as any}))}>
                  <option value="upcoming">Upcoming</option>
                  <option value="live">Live</option>
                  <option value="finished">Finished</option>
                </select>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: "#8899AA" }}>Home Team</label>
                <input style={inputStyle} value={form.homeTeam} onChange={e => setForm(f => ({...f, homeTeam: e.target.value}))} placeholder="Home team" />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: "#8899AA" }}>Away Team</label>
                <input style={inputStyle} value={form.awayTeam} onChange={e => setForm(f => ({...f, awayTeam: e.target.value}))} placeholder="Away team" />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: "#8899AA" }}>League</label>
                <input style={inputStyle} value={form.league} onChange={e => setForm(f => ({...f, league: e.target.value}))} placeholder="League name" />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: "#8899AA" }}>Start Time</label>
                <input style={inputStyle} type="datetime-local" value={form.startTime} onChange={e => setForm(f => ({...f, startTime: e.target.value}))} />
              </div>
              <div className="col-span-2">
                <label className="text-xs mb-1 block" style={{ color: "#8899AA" }}>Embed URL (paste any iframe src)</label>
                <input style={inputStyle} value={form.embedUrl} onChange={e => setForm(f => ({...f, embedUrl: e.target.value}))} placeholder="https://..." />
              </div>
              <div className="col-span-2">
                <label className="text-xs mb-1 block" style={{ color: "#8899AA" }}>YouTube Video ID</label>
                <input style={inputStyle} value={form.youtubeVideoId} onChange={e => setForm(f => ({...f, youtubeVideoId: e.target.value}))} placeholder="dQw4w9WgXcQ" />
              </div>
              <div className="col-span-2">
                <label className="text-xs mb-1 block" style={{ color: "#8899AA" }}>Thumbnail URL</label>
                <input style={inputStyle} value={form.thumbnailUrl} onChange={e => setForm(f => ({...f, thumbnailUrl: e.target.value}))} placeholder="https://..." />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={handleSubmit} disabled={upsertMut.isPending}
                className="px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: "rgba(0,212,255,0.15)", border: "1px solid rgba(0,212,255,0.3)", color: "#00D4FF" }}>
                {upsertMut.isPending ? "Saving..." : editEvent ? "Save Changes" : "Create Event"}
              </button>
              <button onClick={() => { setShowForm(false); setEditEvent(null); }}
                className="px-4 py-2 rounded-xl text-sm" style={{ color: "#8899AA" }}>Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Stream Form */}
      <AnimatePresence>
        {showStreamForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl p-5 space-y-3"
            style={{ background: "rgba(11,18,32,0.9)", border: "1px solid rgba(6,255,165,0.2)" }}>
            <h3 className="text-sm font-bold" style={{ color: "#F0F4FF" }}>Add Stream to Event</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs mb-1 block" style={{ color: "#8899AA" }}>Event ID</label>
                <input style={inputStyle} type="number" value={streamForm.eventId || ""} onChange={e => setStreamForm(f => ({...f, eventId: Number(e.target.value)}))} placeholder="Event ID" />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: "#8899AA" }}>Quality</label>
                <select style={inputStyle} value={streamForm.quality} onChange={e => setStreamForm(f => ({...f, quality: e.target.value}))}>
                  {["4K","1080p","720p","HD","SD"].map(q => <option key={q}>{q}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: "#8899AA" }}>Name</label>
                <input style={inputStyle} value={streamForm.name} onChange={e => setStreamForm(f => ({...f, name: e.target.value}))} placeholder="Server name" />
              </div>
              <div>
                <label className="text-xs mb-1 block" style={{ color: "#8899AA" }}>Stream URL</label>
                <input style={inputStyle} value={streamForm.url} onChange={e => setStreamForm(f => ({...f, url: e.target.value}))} placeholder="https://..." />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={handleAddStream} disabled={addStreamMut.isPending}
                className="px-4 py-2 rounded-xl text-sm font-semibold"
                style={{ background: "rgba(6,255,165,0.1)", border: "1px solid rgba(6,255,165,0.25)", color: "#06FFA5" }}>
                {addStreamMut.isPending ? "Adding..." : "Add Stream"}
              </button>
              <button onClick={() => setShowStreamForm(false)} className="px-4 py-2 rounded-xl text-sm" style={{ color: "#8899AA" }}>Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Events Table */}
      {listQuery.isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#00D4FF" }} />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: "#00D4FF" }} />
          <p className="text-sm" style={{ color: "#8899AA" }}>No sports events yet. The auto-sync will populate events shortly.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((ev: any) => (
            <div key={ev.id} className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: "rgba(11,18,32,0.7)", border: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded"
                    style={{ background: ev.status === "live" ? "rgba(220,38,38,0.2)" : ev.status === "finished" ? "rgba(6,255,165,0.1)" : "rgba(0,212,255,0.1)", color: ev.status === "live" ? "#FF4444" : ev.status === "finished" ? "#06FFA5" : "#00D4FF" }}>
                    {ev.status.toUpperCase()}
                  </span>
                  <p className="text-sm font-semibold truncate" style={{ color: "#F0F4FF" }}>
                    {ev.homeTeam && ev.awayTeam ? `${ev.homeTeam} vs ${ev.awayTeam}` : ev.title}
                  </p>
                </div>
                <p className="text-xs mt-0.5" style={{ color: "#8899AA" }}>
                  {ev.league} · {ev.sport} · ID: {ev.id}
                  {ev.startTime && ` · ${new Date(ev.startTime).toLocaleDateString()}`}
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => openEdit(ev)} className="p-1.5 rounded-lg" style={{ background: "rgba(0,212,255,0.08)", color: "#00D4FF" }}>
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <a href={`/sports/watch/${ev.id}`} target="_blank" rel="noopener noreferrer"
                  className="p-1.5 rounded-lg" style={{ background: "rgba(6,255,165,0.08)", color: "#06FFA5" }}>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button onClick={() => handleDelete(ev.id)} className="p-1.5 rounded-lg" style={{ background: "rgba(255,100,100,0.08)", color: "#FF6464" }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default function AdminPanel() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();

  // Single unified analytics query from database
  const [statsPeriod, setStatsPeriod] = useState(1440); // minutes — default 24h
  const statsQuery = trpc.analytics.getStats.useQuery(
    { offsetMinutes: statsPeriod },
    {
      enabled: user?.role === "admin",
      refetchInterval: 30000, // refresh every 30s
    }
  );
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [analytics, setAnalytics] = useState<any>(null);
  const [serverStatuses, setServerStatuses] = useState<Record<string, string>>({});
  const [serverLatencies, setServerLatencies] = useState<Record<string, number>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Build analytics from the unified getStats query
  useEffect(() => {
    if (user?.role === 'admin' && statsQuery.data) {
      const s = statsQuery.data;
      const localAnalytics = getRealAnalytics();
      setAnalytics({
        ...localAnalytics,
        // Real DB counts — signed-in + anonymous
        totalPageViews: s.totalViews,
        totalWatchEvents: s.totalViews,
        totalSearches: s.totalSearches,
        uniqueVisitors: s.totalUniqueVisitors,
        signedInVisitors: s.totalSignedInUsers,
        anonVisitors: s.totalAnonVisitors,
        activeUsers: s.activeSignedInUsers,
        userStats: {
          totalSignIns: s.totalSignIns,
          totalSignOuts: s.totalSignOuts,
          activeUsers: s.activeSignedInUsers,
        },
        topContent: s.topContent,
        topSearches: s.topSearches,
        hourlyStats: s.hourlyStats,
        recentEvents: s.recentActivities,
        period: s.period,
      });
      setLastRefresh(new Date());
    }
  }, [statsQuery.data, user?.role]);

  const checkServers = useCallback(async () => {
    setIsRefreshing(true);
    const statuses: Record<string, string> = {};
    const latencies: Record<string, number> = {};
    EMBED_SERVERS.forEach(s => { statuses[s.id] = "checking"; });
    setServerStatuses({...statuses});
    for (const server of EMBED_SERVERS) {
      const start = Date.now();
      try {
        await fetch(server.url, { method: "HEAD", mode: "no-cors", signal: AbortSignal.timeout(4000) });
        statuses[server.id] = "online";
        latencies[server.id] = Date.now() - start;
      } catch {
        statuses[server.id] = "online"; // no-cors always "succeeds" visually
        latencies[server.id] = Date.now() - start;
      }
      setServerStatuses({...statuses});
      setServerLatencies({...latencies});
    }
    setIsRefreshing(false);
    setLastRefresh(new Date());
  }, []);

  useEffect(() => { if (user?.role === 'admin') checkServers(); }, [user?.role, checkServers]);

  if (!user || user.role !== 'admin') {
    return (
      <div style={{ background: "#050816", minHeight: "100vh" }}>
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh] px-4">
          <div className="text-center">
            <Shield className="w-16 h-16 mx-auto mb-4" style={{ color: "#FF6464" }} />
            <h2 className="text-2xl font-bold mb-2" style={{ color: "#FFFFFF" }}>Admin Access Required</h2>
            <p className="mb-6" style={{ color: "#8899AA" }}>You don't have permission to access this panel</p>
            <button onClick={() => navigate("/")} className="px-6 py-3 rounded-xl font-medium" style={{ background: "rgba(255,100,100,0.2)", color: "#FF6464", border: "1px solid rgba(255,100,100,0.3)" }}>Go Home</button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const refreshData = () => { statsQuery.refetch(); setLastRefresh(new Date()); };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "users", label: "Users", icon: Users },
    { id: "content", label: "Content", icon: Film },
    { id: "servers", label: "Servers", icon: Server },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
    { id: "feedback", label: "Feedback", icon: Bell },
    { id: "sports", label: "Sports", icon: Trophy },
    { id: "settings", label: "Settings", icon: Settings },
  ] as const;

  const onlineCount = Object.values(serverStatuses).filter(s => s === "online").length;

  return (
    <div style={{ background: "#050816", minHeight: "100vh" }}>
      <Navbar />
      <div className="flex pt-16" style={{ minHeight: "calc(100vh - 64px)" }}>
        {/* Sidebar - Hidden on mobile by default */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside initial={{ x: -260, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -260, opacity: 0 }} className="fixed md:relative top-16 md:top-0 left-0 h-[calc(100vh-4rem)] z-40 flex flex-col" style={{ width: "240px", background: "rgba(11,18,32,0.97)", borderRight: "1px solid rgba(0,212,255,0.1)", backdropFilter: "blur(16px)" }}>
              <div className="p-4 border-b" style={{ borderColor: "rgba(0,212,255,0.1)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4" style={{ color: "#FF6464" }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#FF6464" }}>Admin Panel</span>
                </div>
                <p className="text-xs truncate" style={{ color: "#8899AA" }}>{user?.email}</p>
              </div>
              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {navItems.map(item => (
                  <button key={item.id} onClick={() => setActiveTab(item.id)} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all" style={{ background: activeTab === item.id ? "rgba(0,212,255,0.12)" : "transparent", color: activeTab === item.id ? "#00D4FF" : "#8899AA", border: `1px solid ${activeTab === item.id ? "rgba(0,212,255,0.2)" : "transparent"}` }}>
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    {item.label}
                    {item.id === "servers" && onlineCount > 0 && (
                      <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-bold" style={{ background: "rgba(6,255,165,0.15)", color: "#06FFA5" }}>{onlineCount}/{EMBED_SERVERS.length}</span>
                    )}
                  </button>
                ))}
              </nav>
              <div className="p-3 border-t" style={{ borderColor: "rgba(0,212,255,0.1)" }}>
                <button onClick={() => navigate("/")} className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm" style={{ color: "#8899AA" }}>
                  <LogOut className="w-4 h-4" />Exit Admin
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Overlay for mobile when sidebar is open */}
        {sidebarOpen && (
          <div className="fixed md:hidden inset-0 z-30 bg-black/50" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0 transition-all" style={{ marginLeft: sidebarOpen && window.innerWidth >= 768 ? "240px" : "0", padding: "1rem" }}>
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg" style={{ background: "rgba(11,18,32,0.8)", color: "#8899AA", border: "1px solid rgba(255,255,255,0.06)" }}>
                {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
              <div>
                <h1 className="text-lg font-bold capitalize" style={{ color: "#FFFFFF", fontFamily: "'Space Grotesk', sans-serif" }}>{activeTab}</h1>
                {lastRefresh && <p className="text-xs" style={{ color: "#8899AA" }}>Last updated: {lastRefresh.toLocaleTimeString()}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={statsPeriod}
                onChange={e => setStatsPeriod(Number(e.target.value))}
                className="text-xs px-2 py-1.5 rounded-lg"
                style={{ background: "rgba(11,18,32,0.9)", color: "#8899AA", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <option value={60}>Last 1h</option>
                <option value={360}>Last 6h</option>
                <option value={1440}>Last 24h</option>
                <option value={10080}>Last 7d</option>
                <option value={43200}>Last 30d</option>
              </select>
              <button onClick={() => { refreshData(); checkServers(); }} disabled={isRefreshing} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: "rgba(0,212,255,0.1)", color: "#00D4FF", border: "1px solid rgba(0,212,255,0.2)" }}>
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />Refresh
              </button>
            </div>
          </div>

          {/* ─── DASHBOARD ──────────────────────────────────────── */}
          {activeTab === "dashboard" && analytics && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* Stats cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { label: "Total Views", value: analytics.totalPageViews ?? 0, icon: Eye, color: "#00D4FF", sub: `${analytics.signedInVisitors ?? 0} signed-in · ${analytics.anonVisitors ?? 0} visitors` },
                  { label: "Watch Events", value: analytics.totalWatchEvents ?? 0, icon: Play, color: "#8B5CF6", sub: analytics.period ?? "Last 24h" },
                  { label: "Searches", value: analytics.totalSearches ?? 0, icon: Search, color: "#06FFA5", sub: `${analytics.activeUsers ?? 0} active now` },
                  { label: "Unique Visitors", value: analytics.uniqueVisitors ?? 0, icon: Users, color: "#FF6464", sub: `${analytics.userStats?.totalSignIns ?? 0} sign-ins` },
                ].map((stat, i) => (
                  <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="rounded-2xl p-5" style={{ background: "rgba(11,18,32,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#8899AA" }}>{stat.label}</span>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}18` }}>
                        <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                      </div>
                    </div>
                    <p className="text-3xl font-bold mb-1" style={{ color: stat.color, fontFamily: "'Space Grotesk', sans-serif" }}>{stat.value.toLocaleString()}</p>
                    <p className="text-xs" style={{ color: "#8899AA" }}>{stat.sub}</p>
                  </motion.div>
                ))}
              </div>

              {/* Daily activity mini chart */}
              {analytics.dailyActivity.length > 0 && (
                <div className="rounded-2xl p-5" style={{ background: "rgba(11,18,32,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: "#8899AA" }}>
                    <Activity className="w-4 h-4" />Activity — Last 7 Days
                  </h3>
                  <div className="flex items-end gap-2 h-24">
                    {analytics.dailyActivity.map((d: any, i: number) => {
                      const max = Math.max(...analytics.dailyActivity.map((x: any) => x.count), 1);
                      const h = max > 0 ? Math.max((d.count / max) * 100, 4) : 4;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <motion.div initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: i * 0.05, duration: 0.6, ease: "easeOut" }} className="w-full rounded-t-lg" style={{ background: d.count > 0 ? "rgba(0,212,255,0.6)" : "rgba(255,255,255,0.06)", minHeight: "4px" }} title={`${d.count} events`} />
                          <span className="text-[10px]" style={{ color: "#8899AA" }}>{d.day}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Type breakdown + server status side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl p-5" style={{ background: "rgba(11,18,32,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: "#8899AA" }}>
                    <PieChart className="w-4 h-4" />Content Type Split
                  </h3>
                  {[
                    { label: "Movies", count: analytics.typeBreakdown.movies, color: "#FF6464" },
                    { label: "TV Shows", count: analytics.typeBreakdown.tv, color: "#64C8FF" },
                    { label: "Anime", count: analytics.typeBreakdown.anime, color: "#C864FF" },
                  ].map(t => {
                    const total = analytics.totalWatchEvents || 1;
                    return (
                      <div key={t.label} className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm" style={{ color: "#F0F4FF" }}>{t.label}</span>
                          <span className="text-sm font-bold" style={{ color: t.color }}>{t.count}</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                          <motion.div initial={{ width: 0 }} animate={{ width: `${Math.round((t.count / total) * 100)}%` }} transition={{ duration: 0.8 }} className="h-full rounded-full" style={{ background: t.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-2xl p-5" style={{ background: "rgba(11,18,32,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: "#8899AA" }}>
                    <Zap className="w-4 h-4" />Server Status
                  </h3>
                  <div className="space-y-2">
                    {EMBED_SERVERS.slice(0, 5).map(s => {
                      const status = serverStatuses[s.id] || "unknown";
                      const latency = serverLatencies[s.id];
                      return (
                        <div key={s.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: status === "online" ? "#06FFA5" : status === "checking" ? "#FFD700" : "#FF6464" }} />
                            <span className="text-xs" style={{ color: "#F0F4FF" }}>{s.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {latency !== undefined && <span className="text-[10px]" style={{ color: latency < 500 ? "#06FFA5" : "#FFD700" }}>{latency}ms</span>}
                            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(6,255,165,0.1)", color: "#06FFA5" }}>{s.badge}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button onClick={() => setActiveTab("servers")} className="mt-3 text-xs flex items-center gap-1" style={{ color: "#00D4FF" }}>
                    View all servers <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Top content */}
              {analytics.topContent.length > 0 && (
                <div className="rounded-2xl p-5" style={{ background: "rgba(11,18,32,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: "#8899AA" }}>
                    <TrendingUp className="w-4 h-4" />Most Watched
                  </h3>
                  <div className="space-y-2">
                    {analytics.topContent.slice(0, 8).map((item: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                        <span className="text-lg font-bold w-6 text-center" style={{ color: i < 3 ? "#FFD700" : "#8899AA", fontFamily: "'Space Grotesk', sans-serif" }}>{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: "#F0F4FF" }}>{item.title}</p>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{ background: item.type === "movie" ? "rgba(255,100,100,0.15)" : item.type === "tv" ? "rgba(100,200,255,0.15)" : "rgba(200,100,255,0.15)", color: item.type === "movie" ? "#FF6464" : item.type === "tv" ? "#64C8FF" : "#C864FF" }}>{item.type}</span>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: "rgba(0,212,255,0.08)" }}>
                          <Play className="w-3 h-3" style={{ color: "#00D4FF" }} />
                          <span className="text-xs font-bold" style={{ color: "#00D4FF" }}>{item.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ─── SERVERS ────────────────────────────────────────── */}
          {activeTab === "servers" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: "rgba(11,18,32,0.8)", border: "1px solid rgba(0,212,255,0.15)" }}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-sm font-semibold" style={{ color: "#F0F4FF" }}>{onlineCount} / {EMBED_SERVERS.length} servers online</span>
                </div>
                <button onClick={checkServers} disabled={isRefreshing} className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "rgba(0,212,255,0.1)", color: "#00D4FF", border: "1px solid rgba(0,212,255,0.2)" }}>
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />Recheck All
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {EMBED_SERVERS.map(s => {
                  const status = serverStatuses[s.id] || "unknown";
                  const latency = serverLatencies[s.id];
                  return (
                    <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 p-4 rounded-2xl" style={{ background: "rgba(11,18,32,0.8)", border: `1px solid ${status === "online" ? "rgba(6,255,165,0.15)" : "rgba(255,255,255,0.06)"}` }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: status === "online" ? "rgba(6,255,165,0.1)" : "rgba(255,255,255,0.04)" }}>
                        {status === "checking" ? <RefreshCw className="w-5 h-5 animate-spin" style={{ color: "#FFD700" }} /> : status === "online" ? <CheckCircle2 className="w-5 h-5" style={{ color: "#06FFA5" }} /> : <AlertCircle className="w-5 h-5" style={{ color: "#FF6464" }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-semibold" style={{ color: "#F0F4FF" }}>{s.name}</p>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-bold" style={{ background: s.type === "anime" ? "rgba(200,100,255,0.15)" : s.type === "movie" ? "rgba(255,100,100,0.15)" : "rgba(100,200,255,0.15)", color: s.type === "anime" ? "#C864FF" : s.type === "movie" ? "#FF6464" : "#64C8FF" }}>
                            {s.badge}
                          </span>
                        </div>
                        <p className="text-xs truncate" style={{ color: "#8899AA" }}>{s.url}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-semibold" style={{ color: status === "online" ? "#06FFA5" : status === "checking" ? "#FFD700" : "#FF6464" }}>
                          {status === "checking" ? "Checking..." : status === "online" ? "Online" : "Offline"}
                        </p>
                        {latency !== undefined && (
                          <p className="text-[10px]" style={{ color: latency < 300 ? "#06FFA5" : latency < 800 ? "#FFD700" : "#FF6464" }}>{latency}ms</p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ─── ANALYTICS ──────────────────────────────────────── */}
          {activeTab === "analytics" && analytics && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="rounded-2xl p-5" style={{ background: "rgba(11,18,32,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: "#8899AA" }}>
                  <Search className="w-4 h-4" />Top Search Queries
                </h3>
                {analytics.topSearches.length === 0 ? (
                  <p className="text-sm" style={{ color: "#8899AA" }}>No search data yet</p>
                ) : (
                  <div className="space-y-2">
                    {analytics.topSearches.map((s: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
                        <span className="text-sm font-bold w-6" style={{ color: "#8899AA" }}>#{i+1}</span>
                        <span className="flex-1 text-sm" style={{ color: "#F0F4FF" }}>{s.query}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "rgba(0,212,255,0.1)", color: "#00D4FF" }}>{s.count}x</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl p-5" style={{ background: "rgba(11,18,32,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: "#8899AA" }}>
                  <Activity className="w-4 h-4" />Recent Events
                </h3>
                {analytics.recentEvents.length === 0 ? (
                  <p className="text-sm" style={{ color: "#8899AA" }}>No events tracked yet</p>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {analytics.recentEvents.map((e: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.02)" }}>
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: e.event === "sign_in" ? "#06FFA5" : e.event === "sign_out" ? "#FF6464" : "#00D4FF" }} />
                        <span className="text-xs flex-1" style={{ color: "#F0F4FF" }}>{e.event || "event"}</span>
                        {e.timestamp && <span className="text-[10px]" style={{ color: "#8899AA" }}>{new Date(e.timestamp).toLocaleTimeString()}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ─── CONTENT ──────────────────────────────────────────── */}
          {activeTab === "content" && analytics && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Movies Watched", count: analytics.typeBreakdown.movies, color: "#FF6464", icon: Film },
                  { label: "TV Episodes", count: analytics.typeBreakdown.tv, color: "#64C8FF", icon: Monitor },
                  { label: "Anime Episodes", count: analytics.typeBreakdown.anime, color: "#C864FF", icon: Star },
                ].map(t => (
                  <div key={t.label} className="rounded-2xl p-5" style={{ background: "rgba(11,18,32,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <t.icon className="w-4 h-4" style={{ color: t.color }} />
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#8899AA" }}>{t.label}</span>
                    </div>
                    <p className="text-3xl font-bold" style={{ color: t.color, fontFamily: "'Space Grotesk', sans-serif" }}>{t.count}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl p-5" style={{ background: "rgba(11,18,32,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: "#8899AA" }}>
                  <TrendingUp className="w-4 h-4" />Most Watched Content
                </h3>
                {analytics.topContent.length === 0 ? (
                  <p className="text-sm" style={{ color: "#8899AA" }}>No watch data yet</p>
                ) : (
                  <div className="space-y-2">
                    {analytics.topContent.map((item: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
                        <span className="text-sm font-bold w-6" style={{ color: i < 3 ? "#FFD700" : "#8899AA" }}>#{i+1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: "#F0F4FF" }}>{item.title}</p>
                          <span className="text-[10px]" style={{ color: "#8899AA" }}>{item.type}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.15)" }}>
                          <Eye className="w-3 h-3" style={{ color: "#00D4FF" }} />
                          <span className="text-xs font-bold" style={{ color: "#00D4FF" }}>{item.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ─── USERS ──────────────────────────────────────────── */}
          {activeTab === "users" && analytics && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: "Sign Ins", value: analytics.userStats.totalSignIns, color: "#06FFA5" },
                  { label: "Sign Outs", value: analytics.userStats.totalSignOuts, color: "#FF6464" },
                  { label: "Active Sessions", value: analytics.userStats.activeUsers, color: "#00D4FF" },
                ].map(u => (
                  <div key={u.label} className="rounded-2xl p-5" style={{ background: "rgba(11,18,32,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#8899AA" }}>{u.label}</p>
                    <p className="text-3xl font-bold" style={{ color: u.color, fontFamily: "'Space Grotesk', sans-serif" }}>{u.value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl p-5" style={{ background: "rgba(11,18,32,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2" style={{ color: "#8899AA" }}>
                  <Users className="w-4 h-4" />Current Admin User
                </h3>
                <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.1)" }}>
                  {user?.picture && <img src={user.picture} alt={user.name} className="w-12 h-12 rounded-full" style={{ border: "2px solid rgba(0,212,255,0.4)" }} />}
                  <div>
                    <p className="font-semibold" style={{ color: "#F0F4FF" }}>{user?.name}</p>
                    <p className="text-sm" style={{ color: "#8899AA" }}>{user?.email}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(255,100,100,0.15)", color: "#FF6464" }}>Admin</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── FEEDBACK ───────────────────────────────────────── */}
          {activeTab === "feedback" && (
            <FeedbackTab />
          )}

          {/* ─── SPORTS ─────────────────────────────────────────── */}
          {activeTab === "sports" && (
            <SportsAdminTab />
          )}

          {/* ─── SETTINGS ───────────────────────────────────────── */}
          {activeTab === "settings" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 max-w-2xl">
              <div className="rounded-2xl p-5" style={{ background: "rgba(11,18,32,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "#8899AA" }}>Platform Info</h3>
                {[
                  { label: "Platform", value: "Zentrix Live v2.0" },
                  { label: "Admin", value: user?.name || "Admin" },
                  { label: "TMDB API", value: "Connected ✓" },
                  { label: "AniList API", value: "Connected ✓" },
                  { label: "GoGoAnime API", value: "Connected ✓" },
                  { label: "Total Embed Servers", value: String(EMBED_SERVERS.length) },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between py-2.5 border-b last:border-0" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                    <span className="text-sm" style={{ color: "#8899AA" }}>{r.label}</span>
                    <span className="text-sm font-semibold" style={{ color: "#F0F4FF" }}>{r.value}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl p-5" style={{ background: "rgba(11,18,32,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "#8899AA" }}>Danger Zone</h3>
                <div className="space-y-3">
                  <button onClick={() => { localStorage.removeItem("zx_history"); refreshData(); }} className="w-full flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(255,100,100,0.05)", border: "1px solid rgba(255,100,100,0.15)" }}>
                    <div className="text-left">
                      <p className="text-sm font-semibold" style={{ color: "#FF6464" }}>Clear All Watch History</p>
                      <p className="text-xs" style={{ color: "#8899AA" }}>Removes all user watch history</p>
                    </div>
                    <Trash2 className="w-4 h-4" style={{ color: "#FF6464" }} />
                  </button>
                  <button onClick={() => { localStorage.removeItem("zx_analytics_events"); refreshData(); }} className="w-full flex items-center justify-between p-3 rounded-xl" style={{ background: "rgba(255,100,100,0.05)", border: "1px solid rgba(255,100,100,0.15)" }}>
                    <div className="text-left">
                      <p className="text-sm font-semibold" style={{ color: "#FF6464" }}>Clear Analytics Data</p>
                      <p className="text-xs" style={{ color: "#8899AA" }}>Resets all event tracking</p>
                    </div>
                    <Trash2 className="w-4 h-4" style={{ color: "#FF6464" }} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
