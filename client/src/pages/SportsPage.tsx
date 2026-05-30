/*
  ZENTRIX — Sports Page
  Design: Obsidian Forge — dark #050816, cyan #00D4FF accents, glass cards
  Features: Live Now row, Upcoming grid, Replays, sport filter tabs
*/

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import {
  Trophy, Radio, Clock, PlayCircle, ChevronRight,
  Calendar, Zap, Filter,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";

// ── Types ─────────────────────────────────────────────────────────────────

type SportFilter = "All" | "Football" | "Basketball" | "MMA" | "Cricket" | "Tennis" | "F1";

const SPORT_TABS: { label: SportFilter; emoji: string }[] = [
  { label: "All",        emoji: "🏆" },
  { label: "Football",   emoji: "⚽" },
  { label: "Basketball", emoji: "🏀" },
  { label: "MMA",        emoji: "🥊" },
  { label: "Cricket",    emoji: "🏏" },
  { label: "Tennis",     emoji: "🎾" },
  { label: "F1",         emoji: "🏎️" },
];

// ── Event Card ────────────────────────────────────────────────────────────

function EventCard({ event, featured = false }: { event: any; featured?: boolean }) {
  const isLive = event.status === "live";
  const isFinished = event.status === "finished";
  const hasThumb = event.thumbnailUrl || event.strThumb;

  const startDate = event.startTime ? new Date(event.startTime) : null;
  const dateStr = startDate
    ? startDate.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
    : "";
  const timeStr = startDate
    ? startDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <Link href={`/sports/watch/${event.id}`}>
      <motion.div
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        className="relative rounded-2xl overflow-hidden cursor-pointer group"
        style={{
          background: "rgba(11, 18, 32, 0.85)",
          border: isLive
            ? "1px solid rgba(255, 50, 50, 0.4)"
            : "1px solid rgba(0, 212, 255, 0.12)",
          backdropFilter: "blur(12px)",
          boxShadow: isLive
            ? "0 0 24px rgba(255,50,50,0.12)"
            : "0 4px 24px rgba(0,0,0,0.4)",
        }}
      >
        {/* Thumbnail */}
        <div
          className={`relative overflow-hidden ${featured ? "h-48" : "h-36"}`}
          style={{ background: "rgba(5,8,22,0.9)" }}
        >
          {hasThumb ? (
            <img
              src={event.thumbnailUrl || event.strThumb}
              alt={event.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Trophy className="w-12 h-12" style={{ color: "rgba(0,212,255,0.2)" }} />
            </div>
          )}

          {/* Gradient overlay */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to top, rgba(11,18,32,1) 0%, transparent 60%)" }}
          />

          {/* LIVE badge */}
          {isLive && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: "rgba(220,38,38,0.9)", backdropFilter: "blur(8px)" }}>
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="w-2 h-2 rounded-full bg-white"
              />
              <span className="text-white text-xs font-bold tracking-wider">LIVE</span>
            </div>
          )}

          {/* Score overlay for finished */}
          {isFinished && (event.homeScore || event.awayScore) && (
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-xs font-bold"
              style={{ background: "rgba(11,18,32,0.9)", color: "#F0F4FF", border: "1px solid rgba(255,255,255,0.1)" }}>
              {event.homeScore} – {event.awayScore}
            </div>
          )}

          {/* Play button on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: "rgba(0,212,255,0.2)", border: "2px solid rgba(0,212,255,0.6)", backdropFilter: "blur(8px)" }}>
              <PlayCircle className="w-7 h-7" style={{ color: "#00D4FF" }} />
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          {event.league && (
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#00D4FF" }}>
                {event.league}
              </span>
            </div>
          )}

          {/* Teams */}
          {event.homeTeam && event.awayTeam ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold truncate flex-1" style={{ color: "#F0F4FF" }}>
                {event.homeTeam}
              </span>
              <span className="text-xs font-bold px-1.5" style={{ color: "#8899AA" }}>vs</span>
              <span className="text-sm font-bold truncate flex-1 text-right" style={{ color: "#F0F4FF" }}>
                {event.awayTeam}
              </span>
            </div>
          ) : (
            <p className="text-sm font-bold truncate" style={{ color: "#F0F4FF" }}>
              {event.title}
            </p>
          )}

          {/* Time */}
          {!isLive && startDate && (
            <div className="flex items-center gap-1.5 mt-2">
              <Calendar className="w-3 h-3" style={{ color: "#8899AA" }} />
              <span className="text-[11px]" style={{ color: "#8899AA" }}>
                {dateStr} · {timeStr}
              </span>
            </div>
          )}

          {isFinished && (
            <div className="flex items-center gap-1.5 mt-2">
              <PlayCircle className="w-3 h-3" style={{ color: "#00D4FF" }} />
              <span className="text-[11px] font-semibold" style={{ color: "#00D4FF" }}>
                Watch Replay
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

// ── Section Header ────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, color, viewAllHref }: {
  icon: any; title: string; color: string; viewAllHref?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}22` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <h2 className="text-xl font-bold" style={{ color: "#F0F4FF", fontFamily: "'Space Grotesk', sans-serif" }}>
          {title}
        </h2>
      </div>
      {viewAllHref && (
        <Link href={viewAllHref}>
          <button className="flex items-center gap-1 text-sm font-medium transition-colors hover:opacity-80" style={{ color }}>
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </Link>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────

export default function SportsPage() {
  const [activeSport, setActiveSport] = useState<SportFilter>("All");

  const liveQuery    = trpc.sports.live.useQuery(undefined, { refetchInterval: 30_000 });
  const upcomingQuery = trpc.sports.upcoming.useQuery({ limit: 30 });
  const replaysQuery  = trpc.sports.replays.useQuery({ limit: 20 });

  const filterBySport = (items: any[]) => {
    if (activeSport === "All") return items;
    return items.filter(e => e.sport === activeSport);
  };

  const liveEvents    = filterBySport(liveQuery.data    ?? []);
  const upcomingEvents = filterBySport(upcomingQuery.data ?? []);
  const replayEvents  = filterBySport(replaysQuery.data  ?? []);

  const heroEvent = liveEvents[0] ?? upcomingEvents[0];
  const loading = liveQuery.isLoading || upcomingQuery.isLoading;

  return (
    <div style={{ background: "#050816", minHeight: "100vh" }}>
      <Navbar />

      <div className="pt-20 pb-16">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <div
          className="relative mb-12 overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(0,212,255,0.08) 0%, rgba(5,8,22,0) 60%)",
            borderBottom: "1px solid rgba(0,212,255,0.08)",
          }}
        >
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "rgba(0,212,255,0.15)", border: "1px solid rgba(0,212,255,0.3)" }}>
                  <Trophy className="w-5 h-5" style={{ color: "#00D4FF" }} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#00D4FF" }}>Zentrix Sports</p>
                  <h1 className="text-3xl sm:text-4xl font-black" style={{ color: "#F0F4FF", fontFamily: "'Space Grotesk', sans-serif" }}>
                    Live & On Demand
                  </h1>
                </div>
              </div>
              <p className="text-sm max-w-lg" style={{ color: "#8899AA" }}>
                Watch live football, basketball, MMA, and more — plus highlights and replays from top leagues around the world.
              </p>
            </motion.div>
          </div>
          {/* Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 pointer-events-none"
            style={{ background: "radial-gradient(circle, #00D4FF 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
        </div>

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

          {/* ── Sport Filter Tabs ───────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide"
          >
            {SPORT_TABS.map(tab => (
              <button
                key={tab.label}
                onClick={() => setActiveSport(tab.label)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0"
                style={{
                  background: activeSport === tab.label ? "rgba(0,212,255,0.15)" : "rgba(11,18,32,0.7)",
                  border: activeSport === tab.label ? "1px solid rgba(0,212,255,0.4)" : "1px solid rgba(255,255,255,0.06)",
                  color: activeSport === tab.label ? "#00D4FF" : "#8899AA",
                }}
              >
                <span>{tab.emoji}</span>
                {tab.label}
              </button>
            ))}
          </motion.div>

          {/* ── Live Now ───────────────────────────────────────── */}
          <AnimatePresence>
            {liveEvents.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.15 }}
              >
                <SectionHeader icon={Radio} title="🔴 Live Now" color="#FF3232" viewAllHref="/sports/browse?status=live" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {liveEvents.map((ev, i) => (
                    <motion.div key={ev.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <EventCard event={ev} featured={i === 0} />
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* ── Upcoming ───────────────────────────────────────── */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="rounded-2xl h-52 animate-pulse" style={{ background: "rgba(11,18,32,0.6)" }} />
              ))}
            </div>
          ) : upcomingEvents.length > 0 ? (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <SectionHeader icon={Clock} title="⏰ Upcoming Matches" color="#00D4FF" viewAllHref="/sports/browse?status=upcoming" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {upcomingEvents.slice(0, 16).map((ev, i) => (
                  <motion.div key={ev.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <EventCard event={ev} />
                  </motion.div>
                ))}
              </div>
            </motion.section>
          ) : null}

          {/* ── Replays / Highlights ───────────────────────────── */}
          {replayEvents.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <SectionHeader icon={PlayCircle} title="🎬 Replays & Highlights" color="#06FFA5" viewAllHref="/sports/browse?status=finished" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {replayEvents.slice(0, 12).map((ev, i) => (
                  <motion.div key={ev.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <EventCard event={ev} />
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Empty state */}
          {!loading && liveEvents.length === 0 && upcomingEvents.length === 0 && replayEvents.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Trophy className="w-16 h-16 mb-4 opacity-20" style={{ color: "#00D4FF" }} />
              <p className="text-lg font-semibold mb-2" style={{ color: "#F0F4FF" }}>No events found</p>
              <p className="text-sm" style={{ color: "#8899AA" }}>
                {activeSport !== "All"
                  ? `No ${activeSport} events available right now`
                  : "Events will appear once the backend syncs with TheSportsDB"}
              </p>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
