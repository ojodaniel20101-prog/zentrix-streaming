/*
  MovieBox-style TV Shows Page with carousel sliders and working filters
  Design: Dark cinematic theme with smooth animations
*/

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CarouselSlider from "@/components/CarouselSlider";
import ContentRow from "@/components/ContentRow";
import {
  getPopularTV, getTopRatedTV, getAiringTodayTV,
  getTrendingTV, getTVsByGenre, TV_GENRES, type TMDBMedia,
} from "@/lib/api";
import { Tv, ChevronLeft, ChevronRight, Loader2, Filter } from "lucide-react";



export default function TVPage() {
  const [popularShows, setPopularShows] = useState<TMDBMedia[]>([]);
  const [topRatedShows, setTopRatedShows] = useState<TMDBMedia[]>([]);
  const [trendingShows, setTrendingShows] = useState<TMDBMedia[]>([]);
  const [airingTodayShows, setAiringTodayShows] = useState<TMDBMedia[]>([]);
  const [genreShows, setGenreShows] = useState<TMDBMedia[]>([]);

  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState("popularity");
  const [loading, setLoading] = useState(true);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);
  const genres = Object.entries(TV_GENRES).map(([id, name]) => ({ id: Number(id), name }));

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [popular, topRated, trending, airingToday] = await Promise.all([
          getPopularTV(1),
          getTopRatedTV(1),
          getTrendingTV(1),
          getAiringTodayTV(1),
        ]);

        setPopularShows(popular.results);
        setTopRatedShows(topRated.results);
        setTrendingShows(trending.results);
        setAiringTodayShows(airingToday.results);
      } catch (error) {
        console.error("Error loading TV shows:", error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedGenre) {
      const loadGenreShows = async () => {
        try {
          const res = await getTVsByGenre(selectedGenre, 1);
          setGenreShows(res.results);
        } catch (error) {
          console.error("Error loading genre shows:", error);
        }
      };
      loadGenreShows();
    }
  }, [selectedGenre]);

  return (
    <div style={{ background: "#050816", minHeight: "100vh" }}>
      <Navbar />

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Tv className="w-8 h-8" style={{ color: "#00D4FF" }} />
            <h1
              className="text-4xl font-bold"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#F0F4FF" }}
            >
              TV Shows
            </h1>
          </div>
          <p className="text-sm" style={{ color: "#8899AA" }}>
            Binge-watch the best series from around the world
          </p>
        </motion.div>

        {/* Featured Carousel */}
        {!loading && trendingShows.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <CarouselSlider items={trendingShows.slice(0, 10)} contentType="tv" />
          </motion.div>
        )}

        {/* Filter Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 p-4 rounded-xl"
          style={{ background: "rgba(11, 18, 32, 0.8)", border: "1px solid rgba(0, 212, 255, 0.1)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5" style={{ color: "#00D4FF" }} />
            <h3 className="font-semibold" style={{ color: "#F0F4FF" }}>
              Filters
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Genre Filter */}
            <div>
              <label className="block text-xs font-semibold mb-2" style={{ color: "#8899AA" }}>
                Genre
              </label>
              <select
                value={selectedGenre || ""}
                onChange={(e) => setSelectedGenre(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  background: "rgba(0, 212, 255, 0.05)",
                  border: "1px solid rgba(0, 212, 255, 0.2)",
                  color: "#F0F4FF",
                }}
              >
                <option value="">All Genres</option>
                {genres.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
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

            {/* Sort */}
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
                <option value="popularity">Popularity</option>
                <option value="rating">Rating</option>
                <option value="first_air_date">Air Date</option>
                <option value="name">Title (A-Z)</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Category Rows */}
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-12 h-12 animate-spin" style={{ color: "#00D4FF" }} />
          </div>
        ) : (
          <>
            <ContentRow title="🔥 Trending Now" items={trendingShows} type="tv" loading={false} viewAllHref="/tv/browse" accentColor="#FF6B35" />
            <ContentRow title="⭐ Top Rated" items={topRatedShows} type="tv" loading={false} viewAllHref="/tv/browse" accentColor="#FF6B35" />
            <ContentRow title="📺 Popular Series" items={popularShows} type="tv" loading={false} viewAllHref="/tv/browse" accentColor="#FF6B35" />
            <ContentRow title="🎬 Airing Today" items={airingTodayShows} type="tv" loading={false} viewAllHref="/tv/browse" accentColor="#FF6B35" />
            {selectedGenre && (
              <ContentRow
                title={`${genres.find((g) => g.id === selectedGenre)?.name || "Genre"} Shows`}
                items={genreShows}
                type="tv"
                loading={false}
                viewAllHref="/tv/browse"
                accentColor="#FF6B35"
              />
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
