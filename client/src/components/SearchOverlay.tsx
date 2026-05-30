/* ZENTRIX_TECH — Search Overlay Component
   Design: Obsidian Forge — full-screen glass overlay with real-time search
   Features: multi-type search, suggestions, trending, history
*/

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, TrendingUp, Clock, Film, Tv, Sword, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { searchMulti, searchAnime, tmdbImg, getMediaTitle, getMediaYear, type TMDBMedia, type AniListMedia } from "@/lib/api";

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

const TRENDING_SEARCHES = [
  "Avengers", "One Piece", "Breaking Bad", "Attack on Titan",
  "The Batman", "Demon Slayer", "Stranger Things", "Jujutsu Kaisen",
];

export default function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<(TMDBMedia | AniListMedia)[]>([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      try {
        const stored = localStorage.getItem("zx_search_history");
        if (stored) setHistory(JSON.parse(stored).slice(0, 5));
      } catch {}
    } else {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const [tmdbRes, aniRes] = await Promise.allSettled([
        searchMulti(q, 1),
        searchAnime(q, 1, 5),
      ]);
      const tmdbItems = tmdbRes.status === "fulfilled"
        ? tmdbRes.value.results.filter((r) => r.media_type !== "person").slice(0, 8)
        : [];
      const aniItems = aniRes.status === "fulfilled"
        ? aniRes.value.Page.media.slice(0, 4)
        : [];
      setResults([...tmdbItems, ...aniItems]);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, doSearch]);

  const handleSelect = (item: TMDBMedia | AniListMedia) => {
    const isAnime = "title" in item && typeof item.title === "object";
    const isTMDB = "media_type" in item || "vote_average" in item;

    let type: string;
    let id: number;

    if (isAnime && !isTMDB) {
      type = "anime";
      id = (item as AniListMedia).id;
    } else {
      const tmdb = item as TMDBMedia;
      type = tmdb.media_type === "tv" || tmdb.name ? "tv" : "movie";
      id = tmdb.id;
    }

    // Save to history
    const title = isAnime && !isTMDB
      ? ((item as AniListMedia).title.english || (item as AniListMedia).title.romaji)
      : getMediaTitle(item as TMDBMedia);
    const newHistory = [title, ...history.filter((h) => h !== title)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem("zx_search_history", JSON.stringify(newHistory));

    navigate(`/detail/${type}/${id}`);
    onClose();
  };

  const handleTrendingClick = (term: string) => {
    setQuery(term);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("zx_search_history");
  };

  const isTMDB = (item: TMDBMedia | AniListMedia): item is TMDBMedia =>
    "vote_average" in item;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4"
          style={{ background: "rgba(5, 8, 22, 0.92)", backdropFilter: "blur(16px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="w-full max-w-2xl"
          >
            {/* Search Input */}
            <div className="relative flex items-center"
              style={{
                background: "rgba(11, 18, 32, 0.95)",
                border: "1px solid rgba(0, 212, 255, 0.3)",
                borderRadius: "0.75rem",
                boxShadow: "0 0 40px rgba(0, 212, 255, 0.15)",
              }}>
              <Search className="absolute left-4 w-5 h-5" style={{ color: "#00D4FF" }} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") onClose();
                  if (e.key === "Enter" && query.trim()) {
                    navigate(`/search?q=${encodeURIComponent(query)}`);
                    onClose();
                  }
                }}
                placeholder="Search movies, TV shows, anime..."
                className="w-full bg-transparent pl-12 pr-12 py-4 text-base outline-none"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  color: "#F0F4FF",
                  fontSize: "1rem",
                }}
              />
              {loading ? (
                <Loader2 className="absolute right-4 w-5 h-5 animate-spin" style={{ color: "#8899AA" }} />
              ) : query ? (
                <button onClick={() => setQuery("")} className="absolute right-4">
                  <X className="w-5 h-5" style={{ color: "#8899AA" }} />
                </button>
              ) : (
                <button onClick={onClose} className="absolute right-4">
                  <X className="w-5 h-5" style={{ color: "#8899AA" }} />
                </button>
              )}
            </div>

            {/* Results / Suggestions */}
            <motion.div
              className="mt-2 rounded-xl overflow-hidden"
              style={{
                background: "rgba(11, 18, 32, 0.98)",
                border: "1px solid rgba(0, 212, 255, 0.12)",
                backdropFilter: "blur(20px)",
              }}
            >
              {/* Search Results */}
              {results.length > 0 && (
                <div className="py-2">
                  {results.map((item, i) => {
                    const isT = isTMDB(item);
                    const title = isT
                      ? getMediaTitle(item)
                      : ((item as AniListMedia).title.english || (item as AniListMedia).title.romaji);
                    const poster = isT
                      ? tmdbImg(item.poster_path, "w92")
                      : (item as AniListMedia).coverImage?.large || (item as AniListMedia).coverImage?.extraLarge || "";
                    const type = isT
                      ? (item.media_type === "tv" || item.name ? "TV" : "Movie")
                      : "Anime";
                    const year = isT
                      ? getMediaYear(item)
                      : String((item as AniListMedia).seasonYear || "");
                    const rating = isT
                      ? item.vote_average?.toFixed(1)
                      : ((item as AniListMedia).averageScore
                          ? ((item as AniListMedia).averageScore! / 10).toFixed(1)
                          : null);

                    return (
                      <motion.button
                        key={`${type}-${item.id}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => handleSelect(item)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                        style={{ color: "#F0F4FF" }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background = "rgba(0, 212, 255, 0.06)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background = "transparent";
                        }}
                      >
                        <div className="w-10 h-14 rounded-md overflow-hidden flex-shrink-0"
                          style={{ background: "rgba(0, 212, 255, 0.1)" }}>
                          {poster && (
                            <img src={poster} alt={title} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate"
                            style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                            {title}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs px-1.5 py-0.5 rounded"
                              style={{
                                background: type === "Anime" ? "rgba(139, 92, 246, 0.15)" : "rgba(0, 212, 255, 0.1)",
                                color: type === "Anime" ? "#8B5CF6" : "#00D4FF",
                                fontFamily: "'Space Grotesk', sans-serif",
                                fontWeight: 600,
                                fontSize: "0.65rem",
                                letterSpacing: "0.05em",
                              }}>
                              {type}
                            </span>
                            {year && <span className="text-xs" style={{ color: "#8899AA" }}>{year}</span>}
                            {rating && (
                              <span className="text-xs" style={{ color: "#FFD700" }}>★ {rating}</span>
                            )}
                          </div>
                        </div>
                        <Search className="w-4 h-4 flex-shrink-0" style={{ color: "#8899AA" }} />
                      </motion.button>
                    );
                  })}
                  <div className="px-4 py-2 border-t" style={{ borderColor: "rgba(0, 212, 255, 0.08)" }}>
                    <button
                      onClick={() => { navigate(`/search?q=${encodeURIComponent(query)}`); onClose(); }}
                      className="text-sm w-full text-left"
                      style={{ color: "#00D4FF", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}
                    >
                      See all results for "{query}" →
                    </button>
                  </div>
                </div>
              )}

              {/* Empty state with suggestions */}
              {!query && (
                <div className="py-4">
                  {/* History */}
                  {history.length > 0 && (
                    <div className="px-4 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-700 uppercase tracking-widest"
                          style={{ color: "#8899AA", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>
                          Recent
                        </span>
                        <button onClick={clearHistory} className="text-xs" style={{ color: "#8899AA" }}>
                          Clear
                        </button>
                      </div>
                      {history.map((h) => (
                        <button
                          key={h}
                          onClick={() => setQuery(h)}
                          className="flex items-center gap-3 w-full px-2 py-2 rounded-lg text-sm text-left"
                          style={{ color: "#8899AA" }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.background = "rgba(0, 212, 255, 0.05)";
                            (e.currentTarget as HTMLElement).style.color = "#F0F4FF";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background = "transparent";
                            (e.currentTarget as HTMLElement).style.color = "#8899AA";
                          }}
                        >
                          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                          {h}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Trending */}
                  <div className="px-4">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-3.5 h-3.5" style={{ color: "#00D4FF" }} />
                      <span className="text-xs font-700 uppercase tracking-widest"
                        style={{ color: "#8899AA", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>
                        Trending
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {TRENDING_SEARCHES.map((term) => (
                        <button
                          key={term}
                          onClick={() => handleTrendingClick(term)}
                          className="px-3 py-1.5 rounded-full text-xs transition-all"
                          style={{
                            background: "rgba(0, 212, 255, 0.06)",
                            border: "1px solid rgba(0, 212, 255, 0.15)",
                            color: "#8899AA",
                            fontFamily: "'Space Grotesk', sans-serif",
                            fontWeight: 600,
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLElement).style.background = "rgba(0, 212, 255, 0.12)";
                            (e.currentTarget as HTMLElement).style.color = "#00D4FF";
                            (e.currentTarget as HTMLElement).style.borderColor = "rgba(0, 212, 255, 0.4)";
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLElement).style.background = "rgba(0, 212, 255, 0.06)";
                            (e.currentTarget as HTMLElement).style.color = "#8899AA";
                            (e.currentTarget as HTMLElement).style.borderColor = "rgba(0, 212, 255, 0.15)";
                          }}
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* No results */}
              {query && !loading && results.length === 0 && (
                <div className="py-10 text-center">
                  <Search className="w-8 h-8 mx-auto mb-3" style={{ color: "#8899AA" }} />
                  <p className="text-sm" style={{ color: "#8899AA" }}>
                    No results for "{query}"
                  </p>
                  <p className="text-xs mt-1" style={{ color: "#8899AA" }}>
                    Try a different search term
                  </p>
                </div>
              )}
            </motion.div>

            {/* Keyboard hint */}
            <div className="flex items-center justify-center gap-4 mt-3">
              <span className="text-xs" style={{ color: "#8899AA" }}>
                <kbd className="px-1.5 py-0.5 rounded text-xs"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  ↵
                </kbd>
                {" "}to search
              </span>
              <span className="text-xs" style={{ color: "#8899AA" }}>
                <kbd className="px-1.5 py-0.5 rounded text-xs"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  ESC
                </kbd>
                {" "}to close
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
