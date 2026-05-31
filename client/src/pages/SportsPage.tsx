/*
  ZENTRIX — Sports Page (/sports)
  Live matches from SportSRC API (free, no auth)
*/

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Trophy, Radio, Clock, PlayCircle, RefreshCw, Loader2, Zap } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const SPORTSRC_BASE = "https://api.sportsrc.org";

const SPORT_TABS = [
  { label: "All",        emoji: "🏆", cats: ["football", "basketball", "fighting", "cricket"] },
  { label: "Football",   emoji: "⚽", cats: ["football"] },
  { label: "Basketball", emoji: "🏀", cats: ["basketball"] },
  { label: "MMA/UFC",    emoji: "🥊", cats: ["fighting"] },
  { label: "Cricket",    emoji: "🏏", cats: ["cricket"] },
  { label: "Tennis",     emoji: "🎾", cats: ["tennis"] },
];

function LiveMatchCard({ match }: { match: any }) {
  const home = match.teams?.home ?? {};
  const away = match.teams?.away ?? {};
  const homeName = home.name ?? match.homeTeam ?? "Home";
  const awayName = away.name ?? match.awayTeam ?? "Away";
  const homeBadge = home.badge;
  const awayBadge = away.badge;
  const startTime = match.date ? new Date(match.date) : null;
  const timeStr = startTime?.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const isLive = match.status === "live" || match.isLive;
  const hasScore = match.homeScore !== undefined && match.awayScore !== undefined;

  return (
    <Link href={`/sports/live/${encodeURIComponent(match.id)}?cat=${match.category ?? "football"}`}>
      <motion.div
        className="rounded-2xl p-4 cursor-pointer"
        style={{
          background: "rgba(11,18,32,0.9)",
          border: isLive ? "1px solid rgba(255,50,50,0.35)" : "1px solid rgba(255,255,255,0.07)",
          boxShadow: isLive ? "0 0 20px rgba(255,50,50,0.05)" : "none",
        }}
        whileHover={{ scale: 1.02, y: -3 }}
        whileTap={{ scale: 0.97 }}
      >
        {/* Live badge */}
        {isLive && (
          <div className="flex items-center gap-1.5 mb-3">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#FF3232" }} />
            <span className="text-[11px] font-black tracking-widest" style={{ color: "#FF3232" }}>LIVE</span>
          </div>
        )}

        {/* Teams */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
            {homeBadge ? (
              <img src={homeBadge} alt={homeName} className="w-9 h-9 object-contain" />
            ) : (
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: "rgba(0,212,255,0.1)", color: "#00D4FF" }}>
                {homeName[0]}
              </div>
            )}
            <p className="text-[11px] font-semibold text-center truncate w-full" style={{ color: "#F0F4FF" }}>{homeName}</p>
          </div>

          <div className="text-center px-1 flex-shrink-0">
            {hasScore ? (
              <p className="text-lg font-black" style={{ color: "#00D4FF" }}>
                {match.homeScore} — {match.awayScore}
              </p>
            ) : (
              <div>
                <p className="text-xs font-bold" style={{ color: "#8899AA" }}>VS</p>
                {timeStr && <p className="text-[10px] mt-0.5" style={{ color: "#556677" }}>{timeStr}</p>}
              </div>
            )}
            <p className="text-[9px] mt-1 truncate max-w-[72px]" style={{ color: "#445566" }}>
              {match.league ?? match.category ?? ""}
            </p>
          </div>

          <div className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
            {awayBadge ? (
              <img src={awayBadge} alt={awayName} className="w-9 h-9 object-contain" />
            ) : (
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: "rgba(139,92,246,0.1)", color: "#8B5CF6" }}>
                {awayName[0]}
              </div>
            )}
            <p className="text-[11px] font-semibold text-center truncate w-full" style={{ color: "#F0F4FF" }}>{awayName}</p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-center gap-1.5">
          <PlayCircle className="w-3.5 h-3.5" style={{ color: "#00D4FF" }} />
          <span className="text-[11px] font-bold" style={{ color: "#00D4FF" }}>Watch Now</span>
        </div>
      </motion.div>
    </Link>
  );
}

export default function SportsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setLoading(true);
    const cats = SPORT_TABS[activeTab].cats;
    Promise.all(
      cats.map(c =>
        fetch(`${SPORTSRC_BASE}/?data=matches&category=${c}`)
          .then(r => r.json())
          .then(d => (d?.data ?? d?.matches ?? []).map((m: any) => ({ ...m, category: c })))
          .catch(() => [])
      )
    ).then(results => {
      setMatches(results.flat());
      setLoading(false);
    });
  }, [activeTab, tick]);

  // Auto-refresh every 20s
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 20000);
    return () => clearInterval(t);
  }, []);

  const live     = matches.filter(m => m.status === "live" || m.isLive);
  const upcoming = matches.filter(m => m.status !== "live" && !m.isLive);

  return (
    <div style={{ background: "#050816", minHeight: "100vh" }}>
      <Navbar />

      <div className="pt-20 pb-20">
        {/* Hero */}
        <div className="relative mb-10" style={{
          background: "linear-gradient(135deg, rgba(0,212,255,0.07) 0%, transparent 60%)",
          borderBottom: "1px solid rgba(0,212,255,0.07)",
        }}>
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(0,212,255,0.12)", border: "1px solid rgba(0,212,255,0.25)" }}>
                <Trophy className="w-5 h-5" style={{ color: "#00D4FF" }} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#00D4FF" }}>Zentrix Sports</p>
                <h1 className="text-3xl font-black" style={{ color: "#F0F4FF", fontFamily: "'Space Grotesk', sans-serif" }}>
                  Live & Upcoming
                </h1>
              </div>
            </div>
            <motion.button
              onClick={() => setTick(n => n + 1)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
              style={{ background: "rgba(0,212,255,0.08)", color: "#00D4FF", border: "1px solid rgba(0,212,255,0.2)" }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </motion.button>
          </div>
        </div>

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 space-y-10">

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {SPORT_TABS.map((tab, i) => (
              <button key={i} onClick={() => setActiveTab(i)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-all"
                style={{
                  background: activeTab === i ? "rgba(0,212,255,0.15)" : "rgba(11,18,32,0.7)",
                  border: activeTab === i ? "1px solid rgba(0,212,255,0.4)" : "1px solid rgba(255,255,255,0.06)",
                  color: activeTab === i ? "#00D4FF" : "#8899AA",
                }}>
                {tab.emoji} {tab.label}
              </button>
            ))}
          </div>

          {/* Live Now */}
          <section>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,50,50,0.12)" }}>
                <Radio className="w-4 h-4" style={{ color: "#FF3232" }} />
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: "#F0F4FF" }}>🔴 Live Now</h2>
                <p className="text-xs" style={{ color: "#8899AA" }}>Powered by SportSRC · Auto-updates every 20s</p>
              </div>
              {loading && <Loader2 className="w-4 h-4 animate-spin ml-2" style={{ color: "#00D4FF" }} />}
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="rounded-2xl h-36 animate-pulse" style={{ background: "rgba(11,18,32,0.6)" }} />
                ))}
              </div>
            ) : live.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {live.map((m, i) => (
                  <motion.div key={m.id ?? i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <LiveMatchCard match={m} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl p-10 text-center" style={{ background: "rgba(11,18,32,0.5)", border: "1px solid rgba(255,255,255,0.04)" }}>
                <Zap className="w-10 h-10 mx-auto mb-3 opacity-20" style={{ color: "#FF3232" }} />
                <p className="font-semibold" style={{ color: "#F0F4FF" }}>No live matches right now</p>
                <p className="text-sm mt-1" style={{ color: "#8899AA" }}>Check back when matches are scheduled</p>
              </div>
            )}
          </section>

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(0,212,255,0.1)" }}>
                  <Clock className="w-4 h-4" style={{ color: "#00D4FF" }} />
                </div>
                <h2 className="text-xl font-bold" style={{ color: "#F0F4FF" }}>⏰ Upcoming Matches</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {upcoming.slice(0, 20).map((m, i) => (
                  <motion.div key={m.id ?? i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <LiveMatchCard match={m} />
                  </motion.div>
                ))}
              </div>
            </section>
          )}

        </div>
      </div>

      <Footer />
    </div>
  );
}
