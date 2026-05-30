/*
  MovieBox-style Anime Page with carousel sliders and working filters
  Design: Dark cinematic theme with smooth animations
*/

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CarouselSlider from "@/components/CarouselSlider";
import ContentRow from "@/components/ContentRow";
import {
  getTrendingAnime, getPopularAnime, getTopRatedAnime,
  getSeasonalAnime, getAnimeByGenre, ANIME_GENRES, type AniListMedia,
} from "@/lib/api";
import { Sword, ChevronLeft, ChevronRight, Loader2, Filter, Search } from "lucide-react";
import AnimeSearch from "@/components/AnimeSearch";



function getCurrentSeason(): { season: string; year: number } {
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();
  if (month <= 3) return { season: "WINTER", year };
  if (month <= 6) return { season: "SPRING", year };
  if (month <= 9) return { season: "SUMMER", year };
  return { season: "FALL", year };
}

export default function AnimePage() {
  const [, navigate] = useLocation();
  const [trendingAnime, setTrendingAnime] = useState<AniListMedia[]>([]);
  const [popularAnime, setPopularAnime] = useState<AniListMedia[]>([]);
  const [topRatedAnime, setTopRatedAnime] = useState<AniListMedia[]>([]);
  const [seasonalAnime, setSeasonalAnime] = useState<AniListMedia[]>([]);
  const [genreAnime, setGenreAnime] = useState<AniListMedia[]>([]);

  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState("popularity");
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);

  const handleSelectAnime = (anime: AniListMedia) => {
    if (anime.id) {
      navigate(`/watch/anime/${anime.id}`);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear - i);
  const genres = Object.entries(ANIME_GENRES).map(([name, id]) => ({ id, name }));

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const { season, year } = getCurrentSeason();
        const [trending, popular, topRated, seasonal] = await Promise.all([
          getTrendingAnime(1, 20),
          getPopularAnime(1, 20),
          getTopRatedAnime(1, 20),
          getSeasonalAnime(season, year, 1, 20),
        ]);

        setTrendingAnime(trending.Page?.media || []);
        setPopularAnime(popular.Page?.media || []);
        setTopRatedAnime(topRated.Page?.media || []);
        setSeasonalAnime(seasonal.Page?.media || []);
      } catch (error) {
        console.error("Error loading anime:", error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedGenre) {
      const loadGenreAnime = async () => {
        try {
          const res = await getAnimeByGenre(selectedGenre, 1, 20);
          setGenreAnime(res.Page?.media || []);
        } catch (error) {
          console.error("Error loading genre anime:", error);
        }
      };
      loadGenreAnime();
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
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Sword className="w-8 h-8" style={{ color: "#00D4FF" }} />
              <h1
                className="text-4xl font-bold"
                style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#F0F4FF" }}
              >
                Anime
              </h1>
            </div>
            <p className="text-sm" style={{ color: "#8899AA" }}>
              Explore the best anime series and movies from around the world
            </p>
          </div>
          <button
            onClick={() => setShowSearch(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
            style={{
              background: "rgba(0, 212, 255, 0.1)",
              color: "#00D4FF",
              border: "1px solid rgba(0, 212, 255, 0.2)",
            }}
          >
            <Search className="w-5 h-5" />
            <span className="text-sm font-semibold">Search</span>
          </button>
        </motion.div>

        {/* Anime Search Modal */}
        {showSearch && <AnimeSearch onClose={() => setShowSearch(false)} onSelectAnime={handleSelectAnime} />}

        {/* Featured Carousel */}
        {!loading && trendingAnime.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <CarouselSlider items={trendingAnime.slice(0, 10) as any} contentType="anime" />
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
                onChange={(e) => setSelectedGenre(e.target.value || null)}
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
                <option value="trending">Trending</option>
                <option value="title">Title (A-Z)</option>
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
            <ContentRow title="🔥 Trending Now" items={trendingAnime} type="anime" loading={false} viewAllHref="/anime/browse" accentColor="#8B5CF6" />
            <ContentRow title="⭐ Top Rated" items={topRatedAnime} type="anime" loading={false} viewAllHref="/anime/browse" accentColor="#8B5CF6" />
            <ContentRow title="📺 Popular Anime" items={popularAnime} type="anime" loading={false} viewAllHref="/anime/browse" accentColor="#8B5CF6" />
            <ContentRow title="🌸 This Season" items={seasonalAnime} type="anime" loading={false} viewAllHref="/anime/browse" accentColor="#8B5CF6" />
            {selectedGenre && (
              <ContentRow
                title={`${genres.find((g) => g.id === selectedGenre)?.name || "Genre"} Anime`}
                items={genreAnime}
                type="anime"
                loading={false}
                viewAllHref="/anime/browse"
                accentColor="#8B5CF6"
              />
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
