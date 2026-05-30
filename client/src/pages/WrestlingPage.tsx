/*
  ZENTRIX — Wrestling Watch Page (/wrestling)
  Dailymotion iframe embeds for WWE RAW, SmackDown, NXT & AEW
  Matches Zentrix Obsidian Forge design system
*/

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { Trophy, Radio, RefreshCw, Tv2, ChevronRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// ── Stream Data ────────────────────────────────────────────────────────────

const SHOWS = [
  {
    id: "raw",
    name: "WWE RAW",
    shortName: "RAW",
    videoId: "xabvvww",
    color: "#E31837",
    badge: "LIVE",
    description: "Monday Night RAW — Season 34",
    network: "Netflix",
  },
  {
    id: "smackdown",
    name: "WWE SmackDown",
    shortName: "SmackDown",
    videoId: "xabvxtg",
    color: "#0066CC",
    badge: "NEW",
    description: "Friday Night SmackDown",
    network: "USA Network",
  },
  {
    id: "nxt",
    name: "WWE NXT",
    shortName: "NXT",
    videoId: "xabvvpk",
    color: "#F5A623",
    badge: "NEW",
    description: "NXT — Season 20",
    network: "USA Network",
  },
  {
    id: "aew",
    name: "AEW Dynamite",
    shortName: "AEW",
    videoId: "xabskee",
    color: "#00B140",
    badge: "NEW",
    description: "All Elite Wrestling — Dynamite",
    network: "TBS",
  },
];

// Build Dailymotion embed URL with WWE-style params
function buildEmbedUrl(videoId: string): string {
  const params = new URLSearchParams({
    autoplay: "1",
    "ui-theme": "dark",
    "ui-logo": "0",
    "sharing-enable": "0",
    "ui-highlight": "e31837",
    "queue-enable": "0",
    controls: "1",
    "ui-start-screen-info": "0",
  });
  return `https://www.dailymotion.com/embed/video/${videoId}?${params.toString()}`;
}

// ── Tab Button ─────────────────────────────────────────────────────────────

function ShowTab({
  show,
  active,
  onClick,
}: {
  show: (typeof SHOWS)[0];
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="relative flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all flex-shrink-0"
      style={{
        background: active
          ? `rgba(${hexToRgb(show.color)}, 0.18)`
          : "rgba(11,18,32,0.7)",
        border: active
          ? `1.5px solid ${show.color}`
          : "1.5px solid rgba(255,255,255,0.07)",
        color: active ? show.color : "#8899AA",
        boxShadow: active ? `0 0 18px rgba(${hexToRgb(show.color)}, 0.2)` : "none",
      }}
    >
      {/* Live pulse dot */}
      {show.badge === "LIVE" && (
        <motion.span
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: show.color }}
        />
      )}
      {show.shortName}
      <span
        className="text-[10px] px-1.5 py-0.5 rounded font-black tracking-wider"
        style={{
          background: active ? `rgba(${hexToRgb(show.color)}, 0.25)` : "rgba(255,255,255,0.06)",
          color: active ? show.color : "#8899AA",
        }}
      >
        {show.badge}
      </span>
    </motion.button>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : "0,212,255";
}

// ── Episode Card ───────────────────────────────────────────────────────────

function EpisodeCard({
  show,
  active,
  onClick,
}: {
  show: (typeof SHOWS)[0];
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
      style={{
        background: active ? `rgba(${hexToRgb(show.color)}, 0.1)` : "rgba(11,18,32,0.6)",
        border: active
          ? `1px solid rgba(${hexToRgb(show.color)}, 0.35)`
          : "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Color bar */}
      <div
        className="w-1 h-10 rounded-full flex-shrink-0"
        style={{ background: show.color }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate" style={{ color: "#F0F4FF" }}>
          {show.name}
        </p>
        <p className="text-xs truncate" style={{ color: "#8899AA" }}>
          {show.description}
        </p>
        <p className="text-[10px] mt-0.5 font-semibold" style={{ color: show.color }}>
          {show.network}
        </p>
      </div>
      {show.badge === "LIVE" ? (
        <motion.div
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ repeat: Infinity, duration: 1.2 }}
          className="flex items-center gap-1 px-2 py-1 rounded-full flex-shrink-0"
          style={{ background: "rgba(220,38,38,0.2)", border: "1px solid rgba(220,38,38,0.4)" }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          <span className="text-[10px] font-black text-red-400">LIVE</span>
        </motion.div>
      ) : (
        <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "#8899AA" }} />
      )}
    </motion.div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function WrestlingPage() {
  const [activeShow, setActiveShow] = useState(SHOWS[0]);
  const [playerKey, setPlayerKey] = useState(0); // force iframe reload

  const embedUrl = buildEmbedUrl(activeShow.videoId);

  function switchShow(show: (typeof SHOWS)[0]) {
    setActiveShow(show);
    setPlayerKey((k) => k + 1);
  }

  function refreshStream() {
    setPlayerKey((k) => k + 1);
  }

  return (
    <div style={{ background: "#050816", minHeight: "100vh" }}>
      <Navbar />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">

        {/* ── Header ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(227,24,55,0.15)", border: "1px solid rgba(227,24,55,0.3)" }}
            >
              <Trophy className="w-5 h-5" style={{ color: "#E31837" }} />
            </div>
            <div>
              <h1
                className="text-xl font-black tracking-tight"
                style={{ color: "#F0F4FF", fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Wrestling
              </h1>
              <p className="text-xs" style={{ color: "#8899AA" }}>
                WWE RAW · SmackDown · NXT · AEW
              </p>
            </div>
          </div>

          {/* Refresh button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={refreshStream}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
            style={{
              background: "rgba(11,18,32,0.8)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#8899AA",
            }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </motion.button>
        </motion.div>

        {/* ── Show Tabs (mobile scroll) ───────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide"
        >
          {SHOWS.map((show) => (
            <ShowTab
              key={show.id}
              show={show}
              active={activeShow.id === show.id}
              onClick={() => switchShow(show)}
            />
          ))}
        </motion.div>

        {/* ── Main Grid ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">

          {/* ── Player ──────────────────────────────────────── */}
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={playerKey}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25 }}
                className="relative rounded-2xl overflow-hidden"
                style={{
                  aspectRatio: "16/9",
                  background: "#0A0F1E",
                  border: `1px solid rgba(${hexToRgb(activeShow.color)}, 0.25)`,
                  boxShadow: `0 0 40px rgba(${hexToRgb(activeShow.color)}, 0.08)`,
                }}
              >
                <iframe
                  src={embedUrl}
                  className="w-full h-full"
                  frameBorder="0"
                  allowFullScreen
                  allow="autoplay; fullscreen; picture-in-picture"
                  referrerPolicy="no-referrer-when-downgrade"
                />

                {/* Live badge */}
                {activeShow.badge === "LIVE" && (
                  <div
                    className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                    style={{ background: "rgba(220,38,38,0.9)", backdropFilter: "blur(8px)" }}
                  >
                    <motion.div
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ repeat: Infinity, duration: 1.2 }}
                      className="w-2 h-2 rounded-full bg-white"
                    />
                    <span className="text-white text-xs font-black tracking-wider">LIVE</span>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Now Playing Info */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl p-5"
              style={{
                background: "rgba(11,18,32,0.8)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-lg"
                      style={{
                        background: `rgba(${hexToRgb(activeShow.color)}, 0.15)`,
                        color: activeShow.color,
                        border: `1px solid rgba(${hexToRgb(activeShow.color)}, 0.3)`,
                      }}
                    >
                      {activeShow.badge === "LIVE" ? "🔴 LIVE NOW" : activeShow.network}
                    </span>
                  </div>
                  <h2
                    className="text-2xl font-black mb-1"
                    style={{ color: "#F0F4FF", fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {activeShow.name}
                  </h2>
                  <p className="text-sm" style={{ color: "#8899AA" }}>
                    {activeShow.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Tv2 className="w-4 h-4" style={{ color: "#8899AA" }} />
                  <span className="text-xs" style={{ color: "#8899AA" }}>
                    via Dailymotion
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="mt-4 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-xs" style={{ color: "#8899AA" }}>
                  ⚡ Stream powered by Dailymotion community uploads. If stream doesn't load,
                  try refreshing or switching to another show.
                </p>
              </div>
            </motion.div>
          </div>

          {/* ── Right Sidebar: All Shows ─────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            <p
              className="text-xs font-black uppercase tracking-widest"
              style={{ color: "#8899AA" }}
            >
              All Shows
            </p>
            {SHOWS.map((show) => (
              <EpisodeCard
                key={show.id}
                show={show}
                active={activeShow.id === show.id}
                onClick={() => switchShow(show)}
              />
            ))}

            {/* Info card */}
            <div
              className="rounded-xl p-4 mt-4"
              style={{
                background: "rgba(11,18,32,0.6)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Radio className="w-4 h-4" style={{ color: "#00D4FF" }} />
                <span className="text-xs font-bold" style={{ color: "#00D4FF" }}>
                  Stream Info
                </span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "#8899AA" }}>
                Streams are user-uploaded community content on Dailymotion. Video IDs refresh
                frequently — use the Refresh button if a stream goes down.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
