/* ZENTRIX_TECH — Search Page */

import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { motion } from "framer-motion";

import Navbar from "@/components/Navbar";
import MediaCard from "@/components/MediaCard";
import Footer from "@/components/Footer";
import {
  searchMovies, searchTV, searchAnime, getMediaTitle,
  type TMDBMedia, type AniListMedia,
} from "@/lib/api";
import { Search, Film, Tv, Sword, Loader2 } from "lucide-react";

type TabType = "all" | "movies" | "tv" | "anime";

export default function SearchPage() {
  const trackSearchMutation = trpc.analytics.trackSearch.useMutation();
  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [inputValue, setInputValue] = useState(initialQuery);
  const [tab, setTab] = useState<TabType>("all");
  const [movies, setMovies] = useState<TMDBMedia[]>([]);
  const [tvShows, setTVShows] = useState<TMDBMedia[]>([]);
  const [animeList, setAnimeList] = useState<AniListMedia[]>([]);
  const [loading, setLoading] = useState(false);

  const doSearch = useCallback(async (q: string) => {
    // Track search for analytics (works for signed-in and anonymous)
    const sessionId = localStorage.getItem("zx_session_id") || (() => {
      const sid = Math.random().toString(36).slice(2);
      localStorage.setItem("zx_session_id", sid);
      return sid;
    })();
    trackSearchMutation.mutate({ query: q, sessionId });
    if (!q.trim()) return;
    setLoading(true);
    try {
      const [mRes, tRes, aRes] = await Promise.allSettled([
        searchMovies(q, 1),
        searchTV(q, 1),
        searchAnime(q, 1, 20),
      ]);
      if (mRes.status === "fulfilled") setMovies(mRes.value.results.slice(0, 20));
      if (tRes.status === "fulfilled") setTVShows(tRes.value.results.slice(0, 20));
      if (aRes.status === "fulfilled") setAnimeList(aRes.value.Page.media.slice(0, 20));
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    if (query) doSearch(query);
  }, [query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(inputValue);
  };

  const allResults = [
    ...movies.map((m) => ({ item: m, type: "movie" as const })),
    ...tvShows.map((t) => ({ item: t, type: "tv" as const })),
    ...animeList.map((a) => ({ item: a, type: "anime" as const })),
  ];

  const displayItems =
    tab === "movies" ? movies.map((m) => ({ item: m, type: "movie" as const })) :
    tab === "tv" ? tvShows.map((t) => ({ item: t, type: "tv" as const })) :
    tab === "anime" ? animeList.map((a) => ({ item: a, type: "anime" as const })) :
    allResults;

  const tabs = [
    { id: "all" as TabType, label: "All", count: allResults.length, color: "#00D4FF" },
    { id: "movies" as TabType, label: "Movies", count: movies.length, icon: Film, color: "#00D4FF" },
    { id: "tv" as TabType, label: "TV Shows", count: tvShows.length, icon: Tv, color: "#06FFA5" },
    { id: "anime" as TabType, label: "Anime", count: animeList.length, icon: Sword, color: "#8B5CF6" },
  ];

  return (
    <div style={{ background: "#050816", minHeight: "100vh" }}>
      <Navbar />
      <div className="pt-24 pb-8 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto">
        {/* Search Bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <form onSubmit={handleSearch} className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "#00D4FF" }} />
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Search movies, TV shows, anime..."
              className="w-full pl-12 pr-16 py-4 rounded-xl text-base outline-none"
              style={{
                background: "rgba(11, 18, 32, 0.9)",
                border: "1px solid rgba(0, 212, 255, 0.2)",
                color: "#F0F4FF",
                fontFamily: "'Inter', sans-serif",
                boxShadow: "0 0 30px rgba(0, 212, 255, 0.08)",
              }}
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-lg text-sm font-600"
              style={{
                background: "linear-gradient(135deg, #00D4FF, #8B5CF6)",
                color: "#050816",
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
              }}
            >
              Search
            </button>
          </form>
          {query && (
            <p className="mt-3 text-sm" style={{ color: "#8899AA" }}>
              {loading ? "Searching..." : `${allResults.length} results for "${query}"`}
            </p>
          )}
        </motion.div>

        {/* Tabs */}
        {query && !loading && (
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-600 whitespace-nowrap transition-all"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 600,
                  background: tab === t.id ? `rgba(${t.color === "#00D4FF" ? "0,212,255" : t.color === "#06FFA5" ? "6,255,165" : "139,92,246"}, 0.12)` : "rgba(11, 18, 32, 0.6)",
                  color: tab === t.id ? t.color : "#8899AA",
                  border: `1px solid ${tab === t.id ? t.color + "44" : "rgba(255,255,255,0.06)"}`,
                }}
              >
                {t.label}
                <span className="text-xs px-1.5 py-0.5 rounded"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    color: tab === t.id ? t.color : "#8899AA",
                  }}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" style={{ color: "#00D4FF" }} />
              <p className="text-sm" style={{ color: "#8899AA" }}>Searching across movies, TV & anime...</p>
            </div>
          </div>
        ) : !query ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Search className="w-12 h-12 mx-auto mb-4" style={{ color: "#8899AA" }} />
              <h2 className="text-xl font-700 mb-2"
                style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: "#F0F4FF" }}>
                Search ZENTRIX_TECH
              </h2>
              <p className="text-sm" style={{ color: "#8899AA" }}>
                Find movies, TV shows, and anime
              </p>
            </div>
          </div>
        ) : displayItems.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Search className="w-12 h-12 mx-auto mb-4" style={{ color: "#8899AA" }} />
              <h2 className="text-xl font-700 mb-2"
                style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: "#F0F4FF" }}>
                No results found
              </h2>
              <p className="text-sm" style={{ color: "#8899AA" }}>
                Try a different search term
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {displayItems.map(({ item, type }, i) => (
              <div key={`${type}-${item.id}`} className="flex justify-center">
                <MediaCard item={item} type={type} index={i % 12} size="md" />
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
