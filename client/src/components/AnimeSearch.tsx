/*
  Anime Search Component
  Separate from movie search - searches AniList and GoGoAnime
  Includes search history and suggestions
*/

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, Clock, TrendingUp } from "lucide-react";
import { searchAnime, getTrendingAnime, type AniListMedia } from "@/lib/api";

interface AnimeSearchProps {
  onClose?: () => void;
  onSelectAnime?: (anime: AniListMedia) => void;
}

export default function AnimeSearch({ onClose, onSelectAnime }: AnimeSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AniListMedia[]>([]);
  const [suggestions, setSuggestions] = useState<AniListMedia[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("animeSearchHistory");
    if (saved) {
      setSearchHistory(JSON.parse(saved));
    }
  }, []);

  // Load trending anime as suggestions
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const trending = await getTrendingAnime(1, 10);
        setSuggestions(trending.Page?.media || []);
      } catch (error) {
        console.error("Error loading suggestions:", error);
      }
    };
    loadSuggestions();
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!query.trim()) {
      setResults([]);
      setShowSuggestions(true);
      return;
    }

    setShowSuggestions(false);
    setIsLoading(true);

    debounceTimer.current = setTimeout(async () => {
      try {
        const searchResults = await searchAnime(query, 1);
        setResults(searchResults.Page?.media || []);
      } catch (error) {
        console.error("Error searching anime:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query]);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    if (searchQuery.trim() && !searchHistory.includes(searchQuery)) {
      const newHistory = [searchQuery, ...searchHistory].slice(0, 10);
      setSearchHistory(newHistory);
      localStorage.setItem("animeSearchHistory", JSON.stringify(newHistory));
    }
  };

  const handleSelectAnime = (anime: AniListMedia) => {
    if (onSelectAnime) {
      onSelectAnime(anime);
    }
    if (onClose) {
      onClose();
    }
  };

  const handleClearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem("animeSearchHistory");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        className="mx-auto mt-20 max-w-2xl rounded-xl overflow-hidden"
        style={{ background: "rgba(11, 18, 32, 0.95)", border: "1px solid rgba(0, 212, 255, 0.2)" }}
      >
        {/* Search Input */}
        <div className="p-4 border-b" style={{ borderColor: "rgba(0, 212, 255, 0.1)" }}>
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg" style={{ background: "rgba(0, 212, 255, 0.05)" }}>
            <Search className="w-5 h-5" style={{ color: "#00D4FF" }} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search anime..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm"
              style={{ color: "#F0F4FF" }}
              autoFocus
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  setShowSuggestions(true);
                }}
                className="p-1 hover:opacity-80"
              >
                <X className="w-5 h-5" style={{ color: "#8899AA" }} />
              </button>
            )}
          </div>
        </div>

        {/* Results / Suggestions */}
        <div className="max-h-[60vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center py-12"
              >
                <div className="w-8 h-8 border-2 border-transparent border-t-cyan-400 rounded-full animate-spin" />
              </motion.div>
            ) : results.length > 0 ? (
              <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {results.map((anime) => (
                  <motion.button
                    key={anime.id}
                    onClick={() => handleSelectAnime(anime)}
                    className="w-full px-4 py-3 flex gap-3 hover:bg-opacity-50 transition-colors text-left"
                    style={{ background: "rgba(0, 212, 255, 0.02)" }}
                    whileHover={{ background: "rgba(0, 212, 255, 0.1)" }}
                  >
                    {/* Poster */}
                    {anime.coverImage?.large && (
                      <img
                        src={anime.coverImage.large}
                        alt={anime.title?.english || anime.title?.romaji || ""}
                        className="w-12 h-16 rounded object-cover flex-shrink-0"
                      />
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate" style={{ color: "#F0F4FF" }}>
                        {anime.title?.english || anime.title?.romaji || "Unknown"}
                      </h3>
                      <p className="text-xs line-clamp-1" style={{ color: "#8899AA" }}>
                        {anime.description?.replace(/<[^>]*>/g, "").slice(0, 100)}...
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: "#00D4FF" }}>
                        {anime.averageScore && <span>⭐ {(anime.averageScore / 10).toFixed(1)}</span>}
                        {anime.episodes && <span>📺 {anime.episodes} eps</span>}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            ) : showSuggestions ? (
              <motion.div key="suggestions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Search History */}
                {searchHistory.length > 0 && (
                  <div className="p-4 border-b" style={{ borderColor: "rgba(0, 212, 255, 0.1)" }}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" style={{ color: "#00D4FF" }} />
                        <h3 className="text-xs font-semibold" style={{ color: "#8899AA" }}>
                          Recent Searches
                        </h3>
                      </div>
                      <button
                        onClick={handleClearHistory}
                        className="text-xs hover:opacity-80"
                        style={{ color: "#00D4FF" }}
                      >
                        Clear
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {searchHistory.map((term) => (
                        <button
                          key={term}
                          onClick={() => handleSearch(term)}
                          className="px-3 py-1 rounded-full text-xs transition-colors"
                          style={{
                            background: "rgba(0, 212, 255, 0.1)",
                            color: "#00D4FF",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(0, 212, 255, 0.2)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "rgba(0, 212, 255, 0.1)";
                          }}
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending Suggestions */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4" style={{ color: "#00D4FF" }} />
                    <h3 className="text-xs font-semibold" style={{ color: "#8899AA" }}>
                      Trending Anime
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {suggestions.map((anime) => (
                      <motion.button
                        key={anime.id}
                        onClick={() => handleSelectAnime(anime)}
                        className="text-left rounded-lg overflow-hidden group"
                        whileHover={{ scale: 1.02 }}
                      >
                        {anime.coverImage?.large && (
                          <div className="relative overflow-hidden rounded-lg mb-2">
                            <img
                              src={anime.coverImage.large}
                              alt={anime.title?.english || anime.title?.romaji || ""}
                              className="w-full h-32 object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors" />
                          </div>
                        )}
                        <h4 className="text-xs font-semibold line-clamp-2" style={{ color: "#F0F4FF" }}>
                          {anime.title?.english || anime.title?.romaji || "Unknown"}
                        </h4>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <Search className="w-12 h-12 mb-3 opacity-30" style={{ color: "#00D4FF" }} />
                <p className="text-sm" style={{ color: "#8899AA" }}>
                  No anime found
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
