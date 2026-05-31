/*
  ZENTRIX — Sports Live Watch Page (/sports/live/:id)
  Fetches stream from SportSRC and embeds in iframe
*/

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Link, useParams, useSearch } from "wouter";
import { ChevronLeft, Loader2, WifiOff, RefreshCw, Server, Radio, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const SPORTSRC_BASE = "https://api.sportsrc.org";

export default function SportsWatchPage() {
  const { id } = useParams<{ id: string }>();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const category = params.get("cat") ?? "football";

  const [match, setMatch] = useState<any>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const popupBlockerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const installAdBlocker = useCallback(() => {
    const origOpen = window.open;
    window.open = () => null;

    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (anchor && anchor.getAttribute("target") === "_blank") {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    document.addEventListener("click", handleAnchorClick, true);

    return () => {
      document.removeEventListener("click", handleAnchorClick, true);
      window.open = origOpen;
      if (popupBlockerRef.current) clearInterval(popupBlockerRef.current);
    };
  }, []);

  // Install ad blocker whenever active URL changes
  useEffect(() => {
    if (!activeUrl) return;
    const cleanup = installAdBlocker();
    return cleanup;
  }, [activeUrl, installAdBlocker]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(false);

    fetch(`${SPORTSRC_BASE}/?data=detail&category=${category}&id=${decodeURIComponent(id)}`)
      .then(r => r.json())
      .then(d => {
        const data = d?.data;
        if (!data) throw new Error("No data");
        setMatch(data);
        const srcs: any[] = data.sources ?? [];
        setSources(srcs);
        // Use embedUrl if available, otherwise fall back to streamed.su
        const firstUrl = srcs.find(s => s.embedUrl)?.embedUrl;
        if (firstUrl) {
          setActiveUrl(firstUrl);
        } else {
          // Fallback: streamed.su embed by match id
          setActiveUrl(`https://streamed.su/watch/${encodeURIComponent(id ?? "")}/1`);
        }
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [id, category, retry]);

  const home = match?.teams?.home ?? {};
  const away = match?.teams?.away ?? {};
  const homeName = home.name ?? match?.homeTeam ?? "Home";
  const awayName = away.name ?? match?.awayTeam ?? "Away";
  const startTime = match?.date ? new Date(match.date) : null;

  return (
    <div style={{ background: "#050816", minHeight: "100vh" }}>
      <Navbar />

      <div className="pt-20 pb-20 max-w-[1440px] mx-auto px-4 sm:px-6">

        {/* Back */}
        <Link href="/sports">
          <motion.button className="flex items-center gap-2 mb-6 text-sm font-medium"
            style={{ color: "#8899AA" }} whileHover={{ color: "#00D4FF" }}>
            <ChevronLeft className="w-4 h-4" /> Back to Sports
          </motion.button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Player */}
          <div className="lg:col-span-2 space-y-4">

            {/* Match header */}
            {match && (
              <div className="rounded-2xl p-5" style={{ background: "rgba(11,18,32,0.9)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold"
                    style={{ background: "rgba(255,50,50,0.12)", color: "#FF3232", border: "1px solid rgba(255,50,50,0.25)" }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    LIVE
                  </span>
                  <span className="text-xs" style={{ color: "#8899AA" }}>{match.league ?? category}</span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 text-center">
                    {home.badge && <img src={home.badge} alt={homeName} className="w-14 h-14 object-contain mx-auto mb-2" />}
                    <p className="font-bold" style={{ color: "#F0F4FF" }}>{homeName}</p>
                    {match.homeScore !== undefined && (
                      <p className="text-3xl font-black mt-1" style={{ color: "#00D4FF" }}>{match.homeScore}</p>
                    )}
                  </div>

                  <div className="text-center">
                    <p className="text-sm font-bold" style={{ color: "#8899AA" }}>VS</p>
                    {startTime && (
                      <p className="text-xs mt-1" style={{ color: "#556677" }}>
                        {startTime.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>

                  <div className="flex-1 text-center">
                    {away.badge && <img src={away.badge} alt={awayName} className="w-14 h-14 object-contain mx-auto mb-2" />}
                    <p className="font-bold" style={{ color: "#F0F4FF" }}>{awayName}</p>
                    {match.awayScore !== undefined && (
                      <p className="text-3xl font-black mt-1" style={{ color: "#00D4FF" }}>{match.awayScore}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Video player */}
            <div className="rounded-2xl overflow-hidden" style={{ background: "#000", minHeight: "240px" }}>
              {loading ? (
                <div className="flex flex-col items-center justify-center h-64 gap-3">
                  <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#00D4FF" }} />
                  <p className="text-sm" style={{ color: "#8899AA" }}>Finding streams...</p>
                </div>
              ) : activeUrl ? (
                <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                  <iframe
                    ref={iframeRef}
                    src={activeUrl}
                    className="absolute inset-0 w-full h-full"
                    frameBorder="0"
                    scrolling="no"
                    allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                    allowFullScreen
                    title={match?.title ?? "Live Match"}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                  <WifiOff className="w-12 h-12 opacity-20" style={{ color: "#FF3232" }} />
                  <p className="font-semibold" style={{ color: "#F0F4FF" }}>No streams available</p>
                  <motion.button
                    onClick={() => setActiveUrl(`https://streamed.su/watch/${encodeURIComponent(id ?? "")}/1`)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
                    style={{ background: "rgba(0,212,255,0.15)", color: "#00D4FF", border: "1px solid rgba(0,212,255,0.3)" }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Radio className="w-4 h-4" /> Try Backup Stream
                  </motion.button>
                  <motion.button
                    onClick={() => setRetry(n => n + 1)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm"
                    style={{ background: "rgba(0,212,255,0.1)", color: "#00D4FF", border: "1px solid rgba(0,212,255,0.2)" }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <RefreshCw className="w-4 h-4" /> Retry
                  </motion.button>
                </div>
              )}
            </div>

            {/* Stream selector */}
            {sources.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {sources.map((s, i) => {
                  const isActive = activeUrl === s.embedUrl;
                  return (
                    <motion.button key={i} onClick={() => setActiveUrl(s.embedUrl || `https://streamed.su/watch/${encodeURIComponent(id ?? "")}/1`)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
                      style={{
                        background: isActive ? "rgba(0,212,255,0.15)" : "rgba(11,18,32,0.8)",
                        border: isActive ? "1px solid rgba(0,212,255,0.4)" : "1px solid rgba(255,255,255,0.06)",
                        color: isActive ? "#00D4FF" : "#8899AA",
                      }}
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Server className="w-3.5 h-3.5" />
                      {s.language ?? `Stream ${i + 1}`}
                      {s.hd && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                          style={{ background: "rgba(0,212,255,0.2)", color: "#00D4FF" }}>HD</span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info panel */}
          <div className="space-y-4">
            <div className="rounded-2xl p-5 space-y-3" style={{ background: "rgba(11,18,32,0.9)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: "#8899AA" }}>Match Info</h3>
              {match?.league && <InfoRow label="League" value={match.league} />}
              <InfoRow label="Sport" value={category} />
              {startTime && (
                <InfoRow label="Time" value={startTime.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })} />
              )}
            </div>

            <div className="rounded-2xl p-5" style={{ background: "rgba(11,18,32,0.9)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: "#8899AA" }}>Streams</h3>
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#00D4FF" }} />
                  <span className="text-sm" style={{ color: "#8899AA" }}>Searching...</span>
                </div>
              ) : sources.length > 0 ? (
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4" style={{ color: "#06FFA5" }} />
                  <span className="text-sm font-semibold" style={{ color: "#06FFA5" }}>
                    {sources.length} stream{sources.length > 1 ? "s" : ""} available
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <WifiOff className="w-4 h-4" style={{ color: "#FF6464" }} />
                  <span className="text-sm" style={{ color: "#FF6464" }}>No streams found</span>
                </div>
              )}
              <p className="text-xs mt-2" style={{ color: "#445566" }}>Powered by SportSRC</p>
            </div>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs" style={{ color: "#8899AA" }}>{label}</span>
      <span className="text-xs font-semibold" style={{ color: "#F0F4FF" }}>{value}</span>
    </div>
  );
}
