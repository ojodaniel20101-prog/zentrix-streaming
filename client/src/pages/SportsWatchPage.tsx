/*
  ZENTRIX — Sports Watch Page (/sports/watch/:id)
  iframe player, server buttons, match info, related events
*/

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useParams } from "wouter";
import {
  Trophy, Radio, ChevronLeft, Calendar, PlayCircle,
  ExternalLink, Globe, Youtube, Server, Clock,
  Share2, Loader2,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";

// ── Helpers ───────────────────────────────────────────────────────────────

function buildSources(event: any): { label: string; url: string; icon: any; badge?: string }[] {
  const sources: { label: string; url: string; icon: any; badge?: string }[] = [];

  if (event.youtubeVideoId) {
    sources.push({
      label: "YouTube",
      url: `https://www.youtube.com/embed/${event.youtubeVideoId}`,
      icon: Youtube,
      badge: "HD",
    });
  }

  if (event.embedUrl) {
    sources.push({
      label: "Server 1",
      url: event.embedUrl,
      icon: Server,
      badge: "HD",
    });
  }

  if (event.strVideo && !event.strVideo.includes("youtube")) {
    sources.push({
      label: "Highlights",
      url: event.strVideo,
      icon: PlayCircle,
      badge: "Clip",
    });
  }

  (event.streams ?? []).forEach((s: any, i: number) => {
    sources.push({
      label: s.name || `Stream ${i + 1}`,
      url: s.url,
      icon: Globe,
      badge: s.quality || "HD",
    });
  });

  return sources;
}

// ── Related Card (mini) ───────────────────────────────────────────────────

function RelatedCard({ event }: { event: any }) {
  return (
    <Link href={`/sports/watch/${event.id}`}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="flex items-center gap-3 p-3 rounded-xl cursor-pointer"
        style={{ background: "rgba(11,18,32,0.7)", border: "1px solid rgba(0,212,255,0.08)" }}
      >
        <div className="w-14 h-10 rounded-lg overflow-hidden flex-shrink-0"
          style={{ background: "rgba(5,8,22,0.8)" }}>
          {event.thumbnailUrl ? (
            <img src={event.thumbnailUrl} alt="" className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Trophy className="w-4 h-4 opacity-20" style={{ color: "#00D4FF" }} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold truncate" style={{ color: "#F0F4FF" }}>
            {event.homeTeam && event.awayTeam ? `${event.homeTeam} vs ${event.awayTeam}` : event.title}
          </p>
          <p className="text-[10px]" style={{ color: "#8899AA" }}>{event.league}</p>
        </div>
        {event.status === "live" && (
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
        )}
      </motion.div>
    </Link>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────

export default function SportsWatchPage() {
  const params = useParams<{ id: string }>();
  const eventId = parseInt(params.id ?? "0", 10);

  const eventQuery = trpc.sports.byId.useQuery({ id: eventId }, { enabled: !!eventId });
  const relatedQuery = trpc.sports.list.useQuery({ limit: 20 });

  const event = eventQuery.data;
  const related = (relatedQuery.data ?? []).filter(e => e.id !== eventId).slice(0, 10);

  const sources = event ? buildSources(event) : [];
  const [activeSource, setActiveSource] = useState(0);

  if (eventQuery.isLoading) {
    return (
      <div style={{ background: "#050816", minHeight: "100vh" }}>
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#00D4FF" }} />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{ background: "#050816", minHeight: "100vh" }}>
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[80vh]">
          <Trophy className="w-16 h-16 mb-4 opacity-20" style={{ color: "#00D4FF" }} />
          <p className="text-lg font-semibold mb-4" style={{ color: "#F0F4FF" }}>Event not found</p>
          <Link href="/sports">
            <button className="px-5 py-2.5 rounded-xl font-medium text-sm"
              style={{ background: "rgba(0,212,255,0.15)", border: "1px solid rgba(0,212,255,0.3)", color: "#00D4FF" }}>
              Back to Sports
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const isLive = event.status === "live";
  const startDate = event.startTime ? new Date(event.startTime) : null;
  const activeUrl = sources[activeSource]?.url;

  return (
    <div style={{ background: "#050816", minHeight: "100vh" }}>
      <Navbar />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        {/* Back */}
        <Link href="/sports">
          <button className="flex items-center gap-1 text-sm mb-5 transition-opacity hover:opacity-70"
            style={{ color: "#8899AA" }}>
            <ChevronLeft className="w-4 h-4" /> Sports
          </button>
        </Link>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6">
          {/* ── Left: Player + Info ───────────────────────────── */}
          <div className="space-y-5">
            {/* Player */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative rounded-2xl overflow-hidden"
              style={{ aspectRatio: "16/9", background: "#0A0F1E", border: "1px solid rgba(0,212,255,0.15)" }}
            >
              {activeUrl ? (
                <iframe
                  key={activeUrl}
                  src={activeUrl}
                  className="w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  referrerPolicy="no-referrer"
                />
              ) : event.thumbnailUrl ? (
                <div className="w-full h-full relative">
                  <img src={event.thumbnailUrl} alt={event.title} className="w-full h-full object-cover opacity-40" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Trophy className="w-16 h-16 mb-4 opacity-40" style={{ color: "#00D4FF" }} />
                    <p className="text-sm" style={{ color: "#8899AA" }}>No stream available yet</p>
                    {isLive && (
                      <p className="text-xs mt-1" style={{ color: "#8899AA" }}>Stream will appear when the event starts</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <Trophy className="w-16 h-16 mb-4 opacity-20" style={{ color: "#00D4FF" }} />
                  <p className="text-sm" style={{ color: "#8899AA" }}>
                    {isLive ? "Stream coming soon" : "No stream available"}
                  </p>
                </div>
              )}

              {/* Live badge overlay */}
              {isLive && (
                <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{ background: "rgba(220,38,38,0.9)", backdropFilter: "blur(8px)" }}>
                  <motion.div
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    className="w-2 h-2 rounded-full bg-white"
                  />
                  <span className="text-white text-xs font-bold tracking-wider">LIVE</span>
                </div>
              )}
            </motion.div>

            {/* Server Buttons */}
            {sources.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#8899AA" }}>
                  Stream Sources
                </p>
                <div className="flex flex-wrap gap-2">
                  {sources.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveSource(i)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        background: activeSource === i ? "rgba(0,212,255,0.15)" : "rgba(11,18,32,0.8)",
                        border: activeSource === i ? "1px solid rgba(0,212,255,0.4)" : "1px solid rgba(255,255,255,0.08)",
                        color: activeSource === i ? "#00D4FF" : "#8899AA",
                      }}
                    >
                      <src.icon className="w-4 h-4" />
                      {src.label}
                      {src.badge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                          style={{ background: activeSource === i ? "rgba(0,212,255,0.2)" : "rgba(255,255,255,0.06)", color: activeSource === i ? "#00D4FF" : "#8899AA" }}>
                          {src.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Match Info */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl p-5"
              style={{ background: "rgba(11,18,32,0.8)", border: "1px solid rgba(0,212,255,0.1)" }}
            >
              {/* League */}
              {event.league && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg"
                    style={{ background: "rgba(0,212,255,0.1)", color: "#00D4FF", border: "1px solid rgba(0,212,255,0.2)" }}>
                    {event.league}
                  </span>
                  {event.sport && (
                    <span className="text-xs" style={{ color: "#8899AA" }}>{event.sport}</span>
                  )}
                </div>
              )}

              {/* Teams / Title */}
              {event.homeTeam && event.awayTeam ? (
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="text-center flex-1">
                    <p className="text-xl font-black" style={{ color: "#F0F4FF", fontFamily: "'Space Grotesk', sans-serif" }}>
                      {event.homeTeam}
                    </p>
                    {event.homeScore !== null && event.homeScore !== undefined && (
                      <p className="text-4xl font-black mt-1" style={{ color: "#00D4FF" }}>{event.homeScore}</p>
                    )}
                    <p className="text-xs mt-1" style={{ color: "#8899AA" }}>Home</p>
                  </div>
                  <div className="text-center">
                    <span className="text-2xl font-bold" style={{ color: "#8899AA" }}>vs</span>
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-xl font-black" style={{ color: "#F0F4FF", fontFamily: "'Space Grotesk', sans-serif" }}>
                      {event.awayTeam}
                    </p>
                    {event.awayScore !== null && event.awayScore !== undefined && (
                      <p className="text-4xl font-black mt-1" style={{ color: "#00D4FF" }}>{event.awayScore}</p>
                    )}
                    <p className="text-xs mt-1" style={{ color: "#8899AA" }}>Away</p>
                  </div>
                </div>
              ) : (
                <h1 className="text-2xl font-black mb-4" style={{ color: "#F0F4FF", fontFamily: "'Space Grotesk', sans-serif" }}>
                  {event.title}
                </h1>
              )}

              {/* Meta */}
              <div className="flex flex-wrap gap-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                {startDate && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" style={{ color: "#8899AA" }} />
                    <span className="text-sm" style={{ color: "#8899AA" }}>
                      {startDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                      {" · "}
                      {startDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                )}
                {event.venue && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" style={{ color: "#8899AA" }} />
                    <span className="text-sm" style={{ color: "#8899AA" }}>{event.venue}</span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* ── Right: Related ────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="space-y-3"
          >
            <p className="text-sm font-bold uppercase tracking-widest" style={{ color: "#8899AA" }}>
              Related Events
            </p>
            {related.length === 0 ? (
              <p className="text-sm" style={{ color: "#8899AA" }}>No related events</p>
            ) : (
              related.map(ev => <RelatedCard key={ev.id} event={ev} />)
            )}
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
