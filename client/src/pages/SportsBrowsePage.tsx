/*
  ZENTRIX — Sports Browse Page (/sports/browse)
  Filter by sport, status, search
*/

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import {
  Trophy, Search, Filter, PlayCircle, Radio, Clock, CheckCircle,
  ChevronLeft, Calendar,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";

type SportType = "All" | "Football" | "Basketball" | "MMA" | "Cricket" | "Tennis" | "F1";
type StatusType = "all" | "live" | "upcoming" | "finished";

function parseQueryParam(search: string, key: string): string {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return params.get(key) ?? "";
}

function EventRow({ event }: { event: any }) {
  const isLive = event.status === "live";
  const startDate = event.startTime ? new Date(event.startTime) : null;
  const dateStr = startDate
    ? startDate.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
    : "TBC";
  const timeStr = startDate
    ? startDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <Link href={`/sports/watch/${event.id}`}>
      <motion.div
        whileHover={{ x: 4, backgroundColor: "rgba(0,212,255,0.04)" }}
        className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all"
        style={{ border: "1px solid rgba(255,255,255,0.05)", background: "rgba(11,18,32,0.7)" }}
      >
        {/* Thumb */}
        <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0"
          style={{ background: "rgba(5,8,22,0.8)", border: "1px solid rgba(0,212,255,0.08)" }}>
          {event.thumbnailUrl ? (
            <img src={event.thumbnailUrl} alt="" className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Trophy className="w-6 h-6 opacity-20" style={{ color: "#00D4FF" }} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            {event.league && <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#00D4FF" }}>{event.league}</span>}
            {event.sport && <span className="text-[10px]" style={{ color: "#8899AA" }}>· {event.sport}</span>}
          </div>
          <p className="text-sm font-semibold truncate" style={{ color: "#F0F4FF" }}>
            {event.homeTeam && event.awayTeam ? `${event.homeTeam} vs ${event.awayTeam}` : event.title}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <Calendar className="w-3 h-3" style={{ color: "#8899AA" }} />
            <span className="text-xs" style={{ color: "#8899AA" }}>{dateStr} {timeStr && `· ${timeStr}`}</span>
          </div>
        </div>

        {/* Status badge */}
        <div className="flex-shrink-0">
          {isLive ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "rgba(220,38,38,0.15)", border: "1px solid rgba(220,38,38,0.3)" }}>
              <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span className="text-xs font-bold" style={{ color: "#FF4444" }}>LIVE</span>
            </div>
          ) : event.status === "finished" ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "rgba(6,255,165,0.08)", border: "1px solid rgba(6,255,165,0.2)" }}>
              <PlayCircle className="w-3 h-3" style={{ color: "#06FFA5" }} />
              <span className="text-xs font-medium" style={{ color: "#06FFA5" }}>Replay</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)" }}>
              <Clock className="w-3 h-3" style={{ color: "#00D4FF" }} />
              <span className="text-xs font-medium" style={{ color: "#00D4FF" }}>Soon</span>
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

export default function SportsBrowsePage() {
  const [location] = useLocation();
  const [search, setSearch] = useState("");
  const [sport, setSport]   = useState<SportType>("All");
  const [status, setStatus] = useState<StatusType>("all");

  // Read URL query params on mount
  useEffect(() => {
    const qs = window.location.search;
    const s = parseQueryParam(qs, "status");
    if (s === "live" || s === "upcoming" || s === "finished") setStatus(s);
  }, []);

  const listQuery = trpc.sports.list.useQuery({
    sport: sport !== "All" ? sport : undefined,
    status: status !== "all" ? status : undefined,
    search: search || undefined,
    limit: 100,
  }, { refetchInterval: 30_000 });

  const events = listQuery.data ?? [];

  const SPORTS: SportType[] = ["All", "Football", "Basketball", "MMA", "Cricket", "Tennis", "F1"];
  const STATUSES: { value: StatusType; label: string; icon: any; color: string }[] = [
    { value: "all",      label: "All",      icon: Filter,      color: "#8899AA" },
    { value: "live",     label: "Live",     icon: Radio,       color: "#FF4444" },
    { value: "upcoming", label: "Upcoming", icon: Clock,       color: "#00D4FF" },
    { value: "finished", label: "Replays",  icon: CheckCircle, color: "#06FFA5" },
  ];

  return (
    <div style={{ background: "#050816", minHeight: "100vh" }}>
      <Navbar />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <Link href="/sports">
              <button className="flex items-center gap-1 text-sm" style={{ color: "#8899AA" }}>
                <ChevronLeft className="w-4 h-4" /> Sports
              </button>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Trophy className="w-7 h-7" style={{ color: "#00D4FF" }} />
            <h1 className="text-3xl font-black" style={{ color: "#F0F4FF", fontFamily: "'Space Grotesk', sans-serif" }}>
              Browse Sports
            </h1>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-5 mb-8 space-y-4"
          style={{ background: "rgba(11,18,32,0.8)", border: "1px solid rgba(0,212,255,0.1)" }}
        >
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "#8899AA" }} />
            <input
              type="text"
              placeholder="Search teams, events, leagues..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none"
              style={{
                background: "rgba(0,212,255,0.04)",
                border: "1px solid rgba(0,212,255,0.15)",
                color: "#F0F4FF",
              }}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            {/* Sport filter */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#8899AA" }}>Sport</p>
              <div className="flex items-center gap-2 flex-wrap">
                {SPORTS.map(s => (
                  <button key={s} onClick={() => setSport(s)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: sport === s ? "rgba(0,212,255,0.15)" : "rgba(255,255,255,0.04)",
                      border: sport === s ? "1px solid rgba(0,212,255,0.4)" : "1px solid rgba(255,255,255,0.06)",
                      color: sport === s ? "#00D4FF" : "#8899AA",
                    }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Status filter */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#8899AA" }}>Status</p>
              <div className="flex items-center gap-2">
                {STATUSES.map(s => (
                  <button key={s.value} onClick={() => setStatus(s.value)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: status === s.value ? `${s.color}18` : "rgba(255,255,255,0.04)",
                      border: status === s.value ? `1px solid ${s.color}50` : "1px solid rgba(255,255,255,0.06)",
                      color: status === s.value ? s.color : "#8899AA",
                    }}>
                    <s.icon className="w-3 h-3" />
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Results */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <p className="text-sm mb-4" style={{ color: "#8899AA" }}>
            {listQuery.isLoading ? "Loading..." : `${events.length} event${events.length !== 1 ? "s" : ""}`}
          </p>

          {listQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: "rgba(11,18,32,0.6)" }} />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Trophy className="w-16 h-16 mb-4 opacity-20" style={{ color: "#00D4FF" }} />
              <p className="text-lg font-semibold mb-2" style={{ color: "#F0F4FF" }}>No events found</p>
              <p className="text-sm" style={{ color: "#8899AA" }}>Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((ev, i) => (
                <motion.div key={ev.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                  <EventRow event={ev} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
