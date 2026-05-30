/* ZENTRIX_TECH — HeroSection Component
   Design: Obsidian Forge — fullscreen cinematic hero with backdrop, particles
   Features: featured content, CTA buttons, search, trending tags, particles
*/

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Info, Download, Star, Clock, ChevronLeft, ChevronRight, Volume2, VolumeX } from "lucide-react";
import { Link } from "wouter";
import { tmdbBackdrop, getMediaTitle, getMediaYear, type TMDBMedia, type AniListMedia } from "@/lib/api";

interface HeroSectionProps {
  items: (TMDBMedia | AniListMedia)[];
  loading?: boolean;
}

function isTMDB(item: TMDBMedia | AniListMedia): item is TMDBMedia {
  return "vote_average" in item;
}

/* FIX: Replaced 20 framer-motion animated particles with 5 CSS-only orbs.
   The original 20 particles each had:
   - filter:blur() → forces a separate GPU compositing layer per element
   - framer-motion animate with repeat:Infinity → keeps JS animation loop running
   - 20 × 3 animated properties (x, y, opacity) = 60 simultaneous tweens
   On mobile GPUs this exhausts the compositing layer budget, causing visual
   corruption/tearing in adjacent composited elements (the iframe + ContentRow).
   Solution: pure CSS @keyframes on 5 static elements — zero JS, zero extra GPU layers. */
const PARTICLES_MOBILE_SAFE = [
  { id: 0, x: 15, y: 20, size: 80, color: "rgba(0, 212, 255, 0.07)", duration: "12s", delay: "0s" },
  { id: 1, x: 75, y: 60, size: 100, color: "rgba(139, 92, 246, 0.06)", duration: "15s", delay: "3s" },
  { id: 2, x: 45, y: 75, size: 60, color: "rgba(6, 255, 165, 0.05)", duration: "10s", delay: "6s" },
  { id: 3, x: 85, y: 15, size: 70, color: "rgba(0, 212, 255, 0.05)", duration: "18s", delay: "1s" },
  { id: 4, x: 30, y: 50, size: 90, color: "rgba(139, 92, 246, 0.04)", duration: "14s", delay: "4s" },
];

const TRENDING_TAGS = ["#Trending", "#NewRelease", "#TopRated", "#Anime", "#Action", "#Thriller"];

export default function HeroSection({ items, loading }: HeroSectionProps) {
  const [current, setCurrent] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const featured = items[current];

  useEffect(() => {
    if (items.length <= 1) return;
    autoRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % items.length);
    }, 8000);
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [items.length]);

  useEffect(() => { setImgLoaded(false); }, [current]);

  if (loading || !featured) {
    return (
      <div className="relative h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #050816 0%, #0B1220 100%)" }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-4"
            style={{ borderColor: "rgba(0, 212, 255, 0.5)", borderTopColor: "transparent" }} />
          <p className="text-sm" style={{ color: "#8899AA" }}>Loading content...</p>
        </div>
      </div>
    );
  }

  const isAnime = !isTMDB(featured);
  const tmdb = !isAnime ? (featured as TMDBMedia) : null;
  const anime = isAnime ? (featured as AniListMedia) : null;

  const title = isAnime
    ? (anime!.title.english || anime!.title.romaji)
    : getMediaTitle(tmdb!);
  const year = isAnime ? String(anime!.seasonYear || "") : getMediaYear(tmdb!);
  const overview = isAnime ? anime!.description?.replace(/<[^>]*>/g, "") : tmdb!.overview;
  const backdrop = isAnime
    ? (anime!.bannerImage || anime!.coverImage.extraLarge)
    : tmdbBackdrop(tmdb!.backdrop_path);
  const rating = isAnime
    ? (anime!.averageScore ? (anime!.averageScore / 10).toFixed(1) : null)
    : (tmdb!.vote_average ? tmdb!.vote_average.toFixed(1) : null);
  const genres = isAnime
    ? anime!.genres.slice(0, 3)
    : (tmdb!.genre_ids?.slice(0, 3).map((id) => {
        const map: Record<number, string> = { 28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime", 18: "Drama", 14: "Fantasy", 27: "Horror", 9648: "Mystery", 10749: "Romance", 878: "Sci-Fi", 53: "Thriller", 10759: "Action", 10765: "Sci-Fi" };
        return map[id] || "";
      }).filter(Boolean) || []);

  const type = isAnime ? "anime" : (tmdb?.media_type === "tv" || tmdb?.name ? "tv" : "movie");

  const prev = () => setCurrent((c) => (c - 1 + items.length) % items.length);
  const next = () => setCurrent((c) => (c + 1) % items.length);

  return (
    <div className="relative h-screen min-h-[600px] max-h-[900px] overflow-hidden">
      {/* Background Image */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          className="absolute inset-0"
        >
          {backdrop && (
            <img
              src={backdrop}
              alt={title}
              className="w-full h-full object-cover"
              onLoad={() => setImgLoaded(true)}
              style={{ filter: "brightness(0.5) saturate(1.2)" }}
            />
          )}
          {/* Gradient overlays */}
          <div className="absolute inset-0"
            style={{
              background: "linear-gradient(90deg, rgba(5,8,22,0.95) 0%, rgba(5,8,22,0.6) 50%, rgba(5,8,22,0.2) 100%)",
            }} />
          <div className="absolute inset-0"
            style={{
              background: "linear-gradient(180deg, transparent 40%, rgba(5,8,22,0.8) 80%, #050816 100%)",
            }} />
          {/* Cinematic vignette */}
          <div className="absolute inset-0"
            style={{
              background: "radial-gradient(ellipse at center, transparent 50%, rgba(5,8,22,0.4) 100%)",
            }} />
        </motion.div>
      </AnimatePresence>

      {/* Particles — CSS-only, no JS animation, no GPU compositing layers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {PARTICLES_MOBILE_SAFE.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full zx-particle-float"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              background: p.color,
              animationDuration: p.duration,
              animationDelay: p.delay,
              /* No filter:blur — that's what created extra GPU layers */
            }}
          />
        ))}
      </div>

      {/* Scan line */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.1) 2px, rgba(0,212,255,0.1) 4px)",
        }} />

      {/* Content */}
      <div className="relative h-full flex items-center pb-4 md:pb-0">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              >
                {/* Type badge */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center gap-2 mb-4"
                >
                  <span className="zx-badge zx-badge-blue"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    {type === "anime" ? "ANIME" : type === "tv" ? "TV SERIES" : "MOVIE"}
                  </span>
                  {rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-current" style={{ color: "#FFD700" }} />
                      <span className="text-sm font-700" style={{ color: "#FFD700", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>
                        {rating}
                      </span>
                    </div>
                  )}
                  {year && (
                    <span className="text-sm" style={{ color: "#8899AA" }}>{year}</span>
                  )}
                </motion.div>

                {/* Title */}
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-4xl sm:text-5xl lg:text-6xl font-800 leading-tight mb-4"
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 800,
                    color: "#F0F4FF",
                    letterSpacing: "-0.03em",
                    textShadow: "0 2px 20px rgba(0,0,0,0.5)",
                  }}
                >
                  {title}
                </motion.h1>

                {/* Genres */}
                {genres.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center gap-2 mb-4"
                  >
                    {genres.map((g) => (
                      <span key={g} className="text-xs px-2 py-0.5 rounded"
                        style={{
                          background: "rgba(255,255,255,0.08)",
                          color: "#8899AA",
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontWeight: 600,
                          border: "1px solid rgba(255,255,255,0.08)",
                        }}>
                        {g}
                      </span>
                    ))}
                  </motion.div>
                )}

                {/* Overview */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="text-sm sm:text-base leading-relaxed mb-6 line-clamp-3"
                  style={{
                    color: "rgba(240, 244, 255, 0.7)",
                    fontFamily: "'Inter', sans-serif",
                    maxWidth: "520px",
                  }}
                >
                  {overview}
                </motion.p>

                {/* CTA Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center gap-3 flex-wrap"
                >
                  <Link href={`/watch/${type}/${featured.id}`}>
                    <motion.div
                      className="flex items-center gap-2 px-6 py-3 rounded-xl cursor-pointer"
                      style={{
                        background: "linear-gradient(135deg, #00D4FF, #8B5CF6)",
                        color: "#050816",
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        boxShadow: "0 8px 30px rgba(0, 212, 255, 0.3)",
                      }}
                      whileHover={{ scale: 1.03, boxShadow: "0 12px 40px rgba(0, 212, 255, 0.4)" }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Play className="w-4 h-4 fill-current" />
                      Watch Now
                    </motion.div>
                  </Link>
                  <Link href={`/detail/${type}/${featured.id}`}>
                    <motion.div
                      className="flex items-center gap-2 px-6 py-3 rounded-xl cursor-pointer"
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        color: "#F0F4FF",
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontWeight: 600,
                        fontSize: "0.9rem",
                        border: "1px solid rgba(255,255,255,0.15)",
                        backdropFilter: "blur(8px)",
                      }}
                      whileHover={{ background: "rgba(255,255,255,0.14)" }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Info className="w-4 h-4" />
                      More Info
                    </motion.div>
                  </Link>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Trending Tags */}
      <div className="absolute bottom-24 left-0 right-0 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto">
        <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          <span className="text-xs flex-shrink-0" style={{ color: "#8899AA", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}>
            Trending:
          </span>
          {TRENDING_TAGS.map((tag, i) => (
            <motion.span
              key={tag}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.05 }}
              className="text-xs px-3 py-1 rounded-full flex-shrink-0 cursor-pointer transition-all"
              style={{
                background: "rgba(0, 212, 255, 0.06)",
                border: "1px solid rgba(0, 212, 255, 0.15)",
                color: "#8899AA",
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 600,
              }}
            >
              {tag}
            </motion.span>
          ))}
        </div>
      </div>

      {/* Navigation arrows */}
      {items.length > 1 && (
        <>
          <motion.button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-xl"
            style={{
              background: "rgba(5, 8, 22, 0.6)",
              border: "1px solid rgba(0, 212, 255, 0.2)",
              color: "#F0F4FF",
              backdropFilter: "blur(8px)",
            }}
            whileHover={{ background: "rgba(0, 212, 255, 0.1)" }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>
          <motion.button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-xl"
            style={{
              background: "rgba(5, 8, 22, 0.6)",
              border: "1px solid rgba(0, 212, 255, 0.2)",
              color: "#F0F4FF",
              backdropFilter: "blur(8px)",
            }}
            whileHover={{ background: "rgba(0, 212, 255, 0.1)" }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>

          {/* Dots */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {items.slice(0, 8).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className="rounded-full transition-all"
                style={{
                  width: i === current ? "24px" : "6px",
                  height: "6px",
                  background: i === current ? "#00D4FF" : "rgba(255,255,255,0.3)",
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
