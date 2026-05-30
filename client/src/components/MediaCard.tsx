/* ZENTRIX_TECH — MediaCard Component
   Design: Obsidian Forge — cinematic card with glow, hover, rich metadata
   Mobile Fix v2: Removed backfaceVisibility:"hidden" on both wrapper divs.
   Having backfaceVisibility on outer + inner elements simultaneously creates
   two GPU compositing layers per card. With 8+ cards visible at once on mobile,
   this overflows the GPU tile cache and causes scanline/glitch artifacts.
   The card's poster image hover (scale-105) is a CSS transition only —
   no composite layer needed. Only whileTap uses the compositor, which is fine.
*/

import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Star, Bookmark, BookmarkCheck, Play } from "lucide-react";
import { useWatchlist } from "@/contexts/WatchlistContext";
import { tmdbImg, getMediaTitle, getMediaYear, type TMDBMedia, type AniListMedia } from "@/lib/api";

interface MediaCardProps {
  item: TMDBMedia | AniListMedia;
  type: "movie" | "tv" | "anime" | "animation";
  index?: number;
  size?: "sm" | "md" | "lg";
  progress?: number;
}

function isTMDB(item: TMDBMedia | AniListMedia): item is TMDBMedia {
  return "vote_average" in item;
}

export default function MediaCard({ item, type, index = 0, size = "md", progress }: MediaCardProps) {
  const [imgError, setImgError] = useState(false);
  const [, navigate] = useLocation();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();

  const isAnime = type === "anime";
  const tmdb = !isAnime ? (item as TMDBMedia) : null;
  const anime = isAnime ? (item as AniListMedia) : null;

  const title = isAnime
    ? (anime!.title.english || anime!.title.romaji)
    : getMediaTitle(tmdb!);
  const year = isAnime
    ? String(anime!.seasonYear || "")
    : getMediaYear(tmdb!);
  const rating = isAnime
    ? (anime!.averageScore ? (anime!.averageScore / 10).toFixed(1) : null)
    : (tmdb!.vote_average ? tmdb!.vote_average.toFixed(1) : null);
  const poster = isAnime
    ? anime!.coverImage.extraLarge
    : tmdbImg(tmdb!.poster_path, "w342");
  const genres = isAnime
    ? anime!.genres.slice(0, 2)
    : (tmdb!.genre_ids?.slice(0, 2).map((id) => {
        const map: Record<number, string> = {
          28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
          80: "Crime", 18: "Drama", 14: "Fantasy", 27: "Horror",
          9648: "Mystery", 10749: "Romance", 878: "Sci-Fi", 53: "Thriller",
          10759: "Action", 10765: "Sci-Fi",
        };
        return map[id] || "";
      }).filter(Boolean) || []);

  // Normalize animation to movie for watchlist check
  const watchlistCheckType = type === 'animation' ? 'movie' : type as "movie" | "tv" | "anime";
  const inWatchlist = isInWatchlist(item.id, watchlistCheckType);
  const detailHref = `/detail/${type}/${item.id}`;
  // Normalize animation to movie for watch route (animation uses movie servers)
  const watchType = type === 'animation' ? 'movie' : type;
  const watchHref = `/watch/${watchType}/${item.id}`;

  const widthClass = size === "sm" ? "w-[100px] md:w-[140px]" : size === "lg" ? "w-[220px]" : "w-[100px] md:w-[170px]";
  const heightClass = size === "sm" ? "h-[150px] md:h-[200px]" : size === "lg" ? "h-[310px]" : "h-[150px] md:h-[240px]";
  
  // Normalize animation to movie for detail route too
  const detailType = type === 'animation' ? 'movie' : type;
  const detailHrefNormalized = `/detail/${detailType}/${item.id}`;

  const handleCardClick = () => {
    navigate(detailHrefNormalized);
  };

  const handleWatchlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Normalize animation to movie for watchlist storage
    const watchlistType = type === 'animation' ? 'movie' : type as "movie" | "tv" | "anime";
    if (inWatchlist) {
      removeFromWatchlist(item.id, watchlistType);
    } else {
      addToWatchlist({
        id: item.id,
        type: watchlistType,
        title,
        poster: poster || "",
        rating: parseFloat(rating || "0"),
        year,
        addedAt: Date.now(),
      });
    }
  };

  return (
    /* FIX: Removed backfaceVisibility:"hidden" and WebkitBackfaceVisibility:"hidden"
       from this outer wrapper. These were forcing a new GPU compositing layer for
       every single card, causing the GPU tile cache overflow on mobile (8+ visible cards).
       framer-motion only promotes to compositor during active animations — that's correct.
       Static backfaceVisibility on a non-rotating element wastes GPU resources badly. */
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.3), duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className={`${widthClass} flex-shrink-0`}
      style={{ scrollSnapAlign: "start" }}
    >
      {/* FIX: Removed backfaceVisibility from this inner motion.div too.
          whileHover y:-4 is a compositor-eligible transform — framer-motion will
          promote this element when the hover starts and demote it after.
          We don't need to pre-promote it (which is what backfaceVisibility was doing). */}
      <motion.div
        className="relative cursor-pointer group"
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        onClick={handleCardClick}
        onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
      >
        {/* Poster */}
        <div
          className={`relative ${heightClass} rounded-xl overflow-hidden`}
          style={{
            background: "rgba(11, 18, 32, 0.8)",
            border: "1px solid rgba(0, 212, 255, 0.08)",
            transition: "border-color 200ms, box-shadow 200ms",
          }}
        >
          {/* Image
              FIX: Use CSS transition for scale instead of framer-motion animate.
              CSS transitions on transform run on the compositor with ZERO JS overhead.
              framer-motion animate on a child element that already has a parent
              whileHover creates a nested compositing conflict on mobile WebKit. */}
          {poster && !imgError ? (
            <img
              src={poster}
              alt={title}
              className="w-full h-full object-cover"
              style={{ transition: "transform 500ms ease" }}
              onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.05)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
              onError={() => setImgError(true)}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #0B1220, #0F1A2E)" }}>
              <Play className="w-8 h-8" style={{ color: "#8899AA" }} />
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{
              background: "linear-gradient(180deg, transparent 40%, rgba(5, 8, 22, 0.95) 100%)",
              /* FIX: No will-change here — the opacity CSS transition handles this fine.
                 will-change:opacity on every card overlay = 8+ extra GPU layers. */
            }} />

          {/* Hover glow border */}
          <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{
              boxShadow: "inset 0 0 0 1px rgba(0, 212, 255, 0.4), 0 0 30px rgba(0, 212, 255, 0.15)",
            }} />

          {/* Top badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            <span className="text-[10px] font-700 uppercase tracking-wider px-1.5 py-0.5 rounded"
              style={{
                background: type === "anime" ? "rgba(139, 92, 246, 0.85)" : type === "tv" ? "rgba(6, 255, 165, 0.85)" : "rgba(0, 212, 255, 0.85)",
                color: "#050816",
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                backdropFilter: "blur(4px)",
              }}>
              {type === "anime" ? "ANIME" : type === "tv" ? "TV" : "FILM"}
            </span>
          </div>

          {/* Rating */}
          {rating && parseFloat(rating) > 0 && (
            <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded"
              style={{
                background: "rgba(5, 8, 22, 0.85)",
                backdropFilter: "blur(4px)",
                border: "1px solid rgba(255, 215, 0, 0.3)",
              }}>
              <Star className="w-2.5 h-2.5 fill-current" style={{ color: "#FFD700" }} />
              <span className="text-[10px] font-700"
                style={{ color: "#FFD700", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>
                {rating}
              </span>
            </div>
          )}

          {/* Progress bar */}
          {progress !== undefined && progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1"
              style={{ background: "rgba(0, 212, 255, 0.15)" }}>
              <div className="h-full transition-all"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, #00D4FF, #8B5CF6)",
                }} />
            </div>
          )}

          {/* Hover actions */}
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200">
            <div className="flex items-center gap-2">
              <Link href={watchHref}>
                <motion.div
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg flex-1 justify-center cursor-pointer"
                  style={{
                    background: "linear-gradient(135deg, #00D4FF, #8B5CF6)",
                    color: "#050816",
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 700,
                    fontSize: "0.7rem",
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Play className="w-3 h-3 fill-current" />
                  Watch
                </motion.div>
              </Link>
              <motion.button
                onClick={handleWatchlist}
                className="p-1.5 rounded-lg"
                style={{
                  background: inWatchlist ? "rgba(139, 92, 246, 0.3)" : "rgba(5, 8, 22, 0.8)",
                  border: `1px solid ${inWatchlist ? "rgba(139, 92, 246, 0.5)" : "rgba(0, 212, 255, 0.2)"}`,
                  color: inWatchlist ? "#8B5CF6" : "#8899AA",
                }}
                whileTap={{ scale: 0.9 }}
              >
                {inWatchlist ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Info below card */}
        <div className="mt-2 px-0.5">
          <h3 className="text-xs md:text-sm font-600 truncate leading-tight"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 600,
              color: "#F0F4FF",
            }}>
            {title}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            {year && (
              <span className="text-[10px] md:text-xs" style={{ color: "#8899AA" }}>{year}</span>
            )}
            {genres.length > 0 && (
              <>
                <span style={{ color: "#8899AA" }}>·</span>
                <span className="text-[10px] md:text-xs truncate" style={{ color: "#8899AA" }}>
                  {genres[0]}
                </span>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
