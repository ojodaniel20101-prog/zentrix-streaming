/*
  Enhanced BrowsePage with URL Params Sync and Missing Filters
  Features:
  - Infinite scroll with 24 items per batch
  - All filters synced to URL for shareable links
  - Missing filters: Season (anime), Country/Quality (movies), Network (TV)
  - Smooth lazy loading and scroll detection
*/

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import MediaCard from "@/components/MediaCard";
import { Loader2, Filter, X } from "lucide-react";

interface BrowsePageEnhancedProps {
  contentType: "movie" | "tv" | "anime" | "animation";
  fetchFunction: (filters: Record<string, any>, page: number) => Promise<{ results: any[]; total_pages: number }>;
  filterOptions: {
    genres?: Array<{ id: string | number; name: string }>;
    years?: number[];
    seasons?: string[];
    statuses?: string[];
    studios?: string[];
    countries?: string[];
    qualities?: string[];
    networks?: string[];
    sortOptions?: Array<{ value: string; label: string }>;
  };
}

export default function BrowsePageEnhanced({
  contentType,
  fetchFunction,
  filterOptions,
}: BrowsePageEnhancedProps) {
  const [, navigate] = useLocation();
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filters state
  const [filters, setFilters] = useState({
    genre: "",
    year: "",
    season: "",
    status: "",
    studio: "",
    country: "",
    quality: "",
    network: "",
    sortBy: "popularity",
  });

  const observerTarget = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync filters to URL params
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    window.history.replaceState({}, "", `?${params.toString()}`);
  }, [filters]);

  // Load initial filters from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlFilters: Record<string, string> = {};
    params.forEach((value, key) => {
      urlFilters[key] = value;
    });
    if (Object.keys(urlFilters).length > 0) {
      setFilters((prev) => ({ ...prev, ...urlFilters }));
    }
  }, []);

  // Fetch content
  const fetchContent = useCallback(
    async (pageNum: number, reset = false) => {
      if (isLoading || (pageNum > totalPages && !reset)) return;

      setIsLoading(true);
      try {
        const response = await fetchFunction(filters, pageNum);
        const { results, total_pages } = response;

        setItems((prev) => (reset ? results : [...prev, ...results]));
        setTotalPages(total_pages);
        setPage(pageNum);
        setHasMore(pageNum < total_pages);
      } catch (error) {
        console.error("Error fetching content:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [filters, fetchFunction, isLoading, totalPages]
  );

  // Reset and fetch when filters change
  useEffect(() => {
    setPage(1);
    setItems([]);
    fetchContent(1, true);
  }, [filters]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          fetchContent(page + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [page, hasMore, isLoading, fetchContent]);

  const handleFilterChange = (filterName: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      genre: "",
      year: "",
      season: "",
      status: "",
      studio: "",
      country: "",
      quality: "",
      network: "",
      sortBy: "popularity",
    });
  };

  const activeFilterCount = Object.values(filters).filter((v) => v && v !== "popularity").length;

  return (
    <div style={{ background: "#050816", minHeight: "100vh" }}>
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1
              className="text-4xl font-bold mb-2"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#F0F4FF" }}
            >
              Browse {contentType.charAt(0).toUpperCase() + contentType.slice(1)}
            </h1>
            <p className="text-sm" style={{ color: "#8899AA" }}>
              {items.length} results found
            </p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors relative"
            style={{
              background: "rgba(0, 212, 255, 0.1)",
              color: "#00D4FF",
              border: "1px solid rgba(0, 212, 255, 0.2)",
            }}
          >
            <Filter className="w-5 h-5" />
            Filters
            {activeFilterCount > 0 && (
              <span
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold"
                style={{ background: "#FF6B6B", color: "white" }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>
        </motion.div>

        {/* Filter Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-8 p-4 rounded-xl"
            style={{ background: "rgba(11, 18, 32, 0.8)", border: "1px solid rgba(0, 212, 255, 0.1)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: "#F0F4FF" }}>
                Filters
              </h3>
              {activeFilterCount > 0 && (
                <button
                  onClick={handleClearFilters}
                  className="text-xs font-semibold hover:opacity-80"
                  style={{ color: "#00D4FF" }}
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Genre Filter */}
              {filterOptions.genres && (
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: "#8899AA" }}>
                    Genre
                  </label>
                  <select
                    value={filters.genre}
                    onChange={(e) => handleFilterChange("genre", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{
                      background: "rgba(0, 212, 255, 0.05)",
                      border: "1px solid rgba(0, 212, 255, 0.2)",
                      color: "#F0F4FF",
                    }}
                  >
                    <option value="">All Genres</option>
                    {filterOptions.genres.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Year Filter */}
              {filterOptions.years && (
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: "#8899AA" }}>
                    Year
                  </label>
                  <select
                    value={filters.year}
                    onChange={(e) => handleFilterChange("year", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{
                      background: "rgba(0, 212, 255, 0.05)",
                      border: "1px solid rgba(0, 212, 255, 0.2)",
                      color: "#F0F4FF",
                    }}
                  >
                    <option value="">All Years</option>
                    {filterOptions.years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Season Filter (Anime) */}
              {filterOptions.seasons && (
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: "#8899AA" }}>
                    Season
                  </label>
                  <select
                    value={filters.season}
                    onChange={(e) => handleFilterChange("season", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{
                      background: "rgba(0, 212, 255, 0.05)",
                      border: "1px solid rgba(0, 212, 255, 0.2)",
                      color: "#F0F4FF",
                    }}
                  >
                    <option value="">All Seasons</option>
                    {filterOptions.seasons.map((season) => (
                      <option key={season} value={season}>
                        {season}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Status Filter */}
              {filterOptions.statuses && (
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: "#8899AA" }}>
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange("status", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{
                      background: "rgba(0, 212, 255, 0.05)",
                      border: "1px solid rgba(0, 212, 255, 0.2)",
                      color: "#F0F4FF",
                    }}
                  >
                    <option value="">All Status</option>
                    {filterOptions.statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Country Filter (Movies) */}
              {filterOptions.countries && (
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: "#8899AA" }}>
                    Country
                  </label>
                  <select
                    value={filters.country}
                    onChange={(e) => handleFilterChange("country", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{
                      background: "rgba(0, 212, 255, 0.05)",
                      border: "1px solid rgba(0, 212, 255, 0.2)",
                      color: "#F0F4FF",
                    }}
                  >
                    <option value="">All Countries</option>
                    {filterOptions.countries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Quality Filter (Movies) */}
              {filterOptions.qualities && (
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: "#8899AA" }}>
                    Quality
                  </label>
                  <select
                    value={filters.quality}
                    onChange={(e) => handleFilterChange("quality", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{
                      background: "rgba(0, 212, 255, 0.05)",
                      border: "1px solid rgba(0, 212, 255, 0.2)",
                      color: "#F0F4FF",
                    }}
                  >
                    <option value="">All Qualities</option>
                    {filterOptions.qualities.map((quality) => (
                      <option key={quality} value={quality}>
                        {quality}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Network Filter (TV) */}
              {filterOptions.networks && (
                <div>
                  <label className="block text-xs font-semibold mb-2" style={{ color: "#8899AA" }}>
                    Network
                  </label>
                  <select
                    value={filters.network}
                    onChange={(e) => handleFilterChange("network", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{
                      background: "rgba(0, 212, 255, 0.05)",
                      border: "1px solid rgba(0, 212, 255, 0.2)",
                      color: "#F0F4FF",
                    }}
                  >
                    <option value="">All Networks</option>
                    {filterOptions.networks.map((network) => (
                      <option key={network} value={network}>
                        {network}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sort By */}
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: "#8899AA" }}>
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{
                    background: "rgba(0, 212, 255, 0.05)",
                    border: "1px solid rgba(0, 212, 255, 0.2)",
                    color: "#F0F4FF",
                  }}
                >
                  {filterOptions.sortOptions?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        )}

        {/* Content Grid */}
        <div ref={containerRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
          {items.map((item) => (
            <motion.div key={`${item.id}-${page}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <MediaCard item={item} type={contentType === "animation" ? "movie" : contentType} />
            </motion.div>
          ))}
        </div>

        {/* Loading Indicator */}
        <div ref={observerTarget} className="flex justify-center py-8">
          {isLoading && <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#00D4FF" }} />}
          {!hasMore && items.length > 0 && (
            <p style={{ color: "#8899AA" }}>No more content to load</p>
          )}
        </div>
      </div>
    </div>
  );
}
