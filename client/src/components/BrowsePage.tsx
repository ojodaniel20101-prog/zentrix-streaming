/**
 * BrowsePage Component - Infinite Scroll Browse with Advanced Filtering
 * Supports Movies, TV Shows, Anime, and Animations
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Loader2, Filter, X } from "lucide-react";
import MediaCard from "./MediaCard";
import {
  getFilteredMovies,
  getFilteredTVShows,
  getFilteredAnime,
  getFilteredAnimations,
  ANIMATION_STUDIOS,
  type MovieFilterParams,
  type TVFilterParams,
  type AnimeFilterParams,
  type AnimationFilterParams,
} from "@/lib/filterApi";
import { MOVIE_GENRES, TV_GENRES, ANIME_GENRES, type TMDBMedia, type AniListMedia } from "@/lib/api";

interface BrowsePageProps {
  type: "movie" | "tv" | "anime" | "animation";
  title: string;
}

export default function BrowsePage({ type, title }: BrowsePageProps) {
  const [items, setItems] = useState<(TMDBMedia | AniListMedia)[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Filter states
  const [sortBy, setSortBy] = useState<string>("popularity");
  const [selectedGenres, setSelectedGenres] = useState<(number | string)[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedStudio, setSelectedStudio] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  // Get genre options based on type
  const getGenreOptions = () => {
    if (type === "movie") return Object.entries(MOVIE_GENRES).map(([id, name]) => ({ id: Number(id), name }));
    if (type === "tv") return Object.entries(TV_GENRES).map(([id, name]) => ({ id: Number(id), name }));
    if (type === "anime") return Object.entries(ANIME_GENRES).map(([name]) => ({ id: name, name }));
    if (type === "animation") return Object.entries(MOVIE_GENRES).map(([id, name]) => ({ id: Number(id), name }));
    return [];
  };

  // Fetch items based on filters
  const fetchItems = useCallback(
    async (pageNum: number, reset: boolean = false) => {
      if (loading || (!hasMore && !reset)) return;

      setLoading(true);
      try {
        let response: any;

        if (type === "movie") {
          response = await getFilteredMovies({
            page: pageNum,
            sortBy: sortBy as any,
            genres: selectedGenres as number[],
            year: selectedYear || undefined,
          });
        } else if (type === "tv") {
          response = await getFilteredTVShows({
            page: pageNum,
            sortBy: sortBy as any,
            genres: selectedGenres as number[],
            year: selectedYear || undefined,
            status: selectedStatus as any,
          });
        } else if (type === "anime") {
          response = await getFilteredAnime({
            page: pageNum,
            sortBy: sortBy as any,
            genres: selectedGenres as string[],
            year: selectedYear || undefined,
          });
        } else if (type === "animation") {
          response = await getFilteredAnimations({
            page: pageNum,
            sortBy: sortBy as any,
            genres: [16, ...selectedGenres.filter((g) => g !== 16)] as number[],
            year: selectedYear || undefined,
            studio: selectedStudio || undefined,
          });
        }

        const newItems = type === "anime" ? response.Page.media : response.results;
        const totalPages = type === "anime" ? 100 : response.total_pages; // AniList doesn't provide total_pages

        if (reset) {
          setItems(newItems);
        } else {
          setItems((prev) => [...prev, ...newItems]);
        }

        setHasMore(pageNum < totalPages);
        setPage(pageNum);
      } catch (error) {
        console.error("Error fetching items:", error);
      } finally {
        setLoading(false);
      }
    },
    [type, sortBy, selectedGenres, selectedYear, selectedStatus, selectedStudio, loading, hasMore]
  );

  // Initial load
  useEffect(() => {
    fetchItems(1, true);
  }, [type, sortBy, selectedGenres, selectedYear, selectedStatus, selectedStudio]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchItems(page + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [page, hasMore, loading, fetchItems]);

  // Handle filter changes
  const handleGenreToggle = (genreId: number | string) => {
    setSelectedGenres((prev) =>
      prev.includes(genreId) ? prev.filter((g) => g !== genreId) : [...prev, genreId]
    );
    setPage(1);
  };

  const handleResetFilters = () => {
    setSortBy("popularity");
    setSelectedGenres([]);
    setSelectedYear(null);
    setSelectedStatus(null);
    setSelectedStudio(null);
    setPage(1);
  };

  const genreOptions = getGenreOptions();

  return (
    <div style={{ background: "#050816", minHeight: "100vh" }}>
      {/* Header */}
      <div className="pt-24 pb-8 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold mb-2" style={{ color: "#F0F4FF" }}>
            {title}
          </h1>
          <p className="text-sm" style={{ color: "#8899AA" }}>
            Showing {items.length} results
          </p>
        </motion.div>
      </div>

      {/* Filter Bar */}
      <div className="px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto mb-8">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg mb-4"
          style={{
            background: "rgba(0, 212, 255, 0.1)",
            border: "1px solid rgba(0, 212, 255, 0.2)",
            color: "#00D4FF",
          }}
        >
          <Filter className="w-5 h-5" />
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-lg mb-8"
            style={{ background: "rgba(11, 18, 32, 0.8)", border: "1px solid rgba(0, 212, 255, 0.1)" }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Sort By */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: "#8899AA" }}>
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{
                    background: "rgba(0, 212, 255, 0.05)",
                    border: "1px solid rgba(0, 212, 255, 0.2)",
                    color: "#F0F4FF",
                  }}
                >
                  {type === "anime" ? (
                    <>
                      <option value="trending">Trending</option>
                      <option value="popular">Popular</option>
                      <option value="latest">Latest</option>
                      <option value="rating">Rating</option>
                    </>
                  ) : (
                    <>
                      <option value="popularity">Popularity</option>
                      <option value="rating">Rating</option>
                      {type !== "animation" && <option value="release_date">Release Date</option>}
                      <option value="title">Title (A-Z)</option>
                    </>
                  )}
                </select>
              </div>

              {/* Year Filter */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: "#8899AA" }}>
                  Year
                </label>
                <select
                  value={selectedYear || ""}
                  onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{
                    background: "rgba(0, 212, 255, 0.05)",
                    border: "1px solid rgba(0, 212, 255, 0.2)",
                    color: "#F0F4FF",
                  }}
                >
                  <option value="">All Years</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter (for TV/Anime) */}
              {(type === "tv" || type === "anime") && (
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: "#8899AA" }}>
                    Status
                  </label>
                  <select
                    value={selectedStatus || ""}
                    onChange={(e) => setSelectedStatus(e.target.value || null)}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{
                      background: "rgba(0, 212, 255, 0.05)",
                      border: "1px solid rgba(0, 212, 255, 0.2)",
                      color: "#F0F4FF",
                    }}
                  >
                    <option value="">All Status</option>
                    {type === "tv" ? (
                      <>
                        <option value="current">Currently Airing</option>
                        <option value="ended">Ended</option>
                        <option value="returning">Returning Soon</option>
                      </>
                    ) : (
                      <>
                        <option value="ONGOING">Ongoing</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="NOT_YET_RELEASED">Not Yet Released</option>
                      </>
                    )}
                  </select>
                </div>
              )}

              {/* Studio Filter (for Animation) */}
              {type === "animation" && (
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: "#8899AA" }}>
                    Studio
                  </label>
                  <select
                    value={selectedStudio || ""}
                    onChange={(e) => setSelectedStudio(e.target.value || null)}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{
                      background: "rgba(0, 212, 255, 0.05)",
                      border: "1px solid rgba(0, 212, 255, 0.2)",
                      color: "#F0F4FF",
                    }}
                  >
                    <option value="">All Studios</option>
                    {Object.keys(ANIMATION_STUDIOS).map((studio) => (
                      <option key={studio} value={studio}>
                        {studio}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Genre Filter */}
            <div className="mb-4">
              <label className="block text-xs font-semibold mb-2" style={{ color: "#8899AA" }}>
                Genres
              </label>
              <div className="flex flex-wrap gap-2">
                {genreOptions.map((genre) => (
                  <button
                    key={genre.id}
                    onClick={() => handleGenreToggle(genre.id)}
                    className="px-3 py-1 rounded-full text-sm transition-all"
                    style={{
                      background: selectedGenres.includes(genre.id)
                        ? "rgba(0, 212, 255, 0.3)"
                        : "rgba(0, 212, 255, 0.1)",
                      border: `1px solid rgba(0, 212, 255, ${selectedGenres.includes(genre.id) ? 0.5 : 0.2})`,
                      color: "#00D4FF",
                    }}
                  >
                    {genre.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset Button */}
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
              style={{
                background: "rgba(255, 100, 100, 0.1)",
                border: "1px solid rgba(255, 100, 100, 0.2)",
                color: "#FF6464",
              }}
            >
              <X className="w-4 h-4" />
              Reset Filters
            </button>
          </motion.div>
        )}
      </div>

      {/* Content Grid */}
      <div className="px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto pb-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {items.map((item) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <MediaCard item={item} type={type === "anime" ? "anime" : type === "animation" ? "movie" : (type as "movie" | "tv")} />
            </motion.div>
          ))}
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="flex justify-center mt-8">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#00D4FF" }} />
          </div>
        )}

        {/* Infinite Scroll Trigger */}
        <div ref={observerTarget} className="h-10 mt-8" />

        {/* No More Results */}
        {!hasMore && items.length > 0 && (
          <div className="text-center mt-8">
            <p style={{ color: "#8899AA" }}>No more results to load</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && items.length === 0 && (
          <div className="text-center py-12">
            <p style={{ color: "#8899AA" }}>No results found. Try adjusting your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
