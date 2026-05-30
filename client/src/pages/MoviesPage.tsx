/*
  MovieBox-style Movies Page with carousel sliders and working filters
  Design: Dark cinematic theme with smooth animations and responsive grid
*/

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CarouselSlider from "@/components/CarouselSlider";
import ContentRow from "@/components/ContentRow";
import {
  getPopularMovies, getTopRatedMovies, getNowPlayingMovies,
  getUpcomingMovies, getMoviesByGenre, MOVIE_GENRES, type TMDBMedia,
} from "@/lib/api";
import { Film, ChevronLeft, ChevronRight, Loader2, Filter } from "lucide-react";



export default function MoviesPage() {
  const [popularMovies, setPopularMovies] = useState<TMDBMedia[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<TMDBMedia[]>([]);
  const [nowPlayingMovies, setNowPlayingMovies] = useState<TMDBMedia[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<TMDBMedia[]>([]);
  const [genreMovies, setGenreMovies] = useState<TMDBMedia[]>([]);

  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState("popularity");
  const [loading, setLoading] = useState(true);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);
  const genres = Object.entries(MOVIE_GENRES).map(([id, name]) => ({ id: Number(id), name }));

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [popular, topRated, nowPlaying, upcoming] = await Promise.all([
          getPopularMovies(1),
          getTopRatedMovies(1),
          getNowPlayingMovies(1),
          getUpcomingMovies(1),
        ]);

        setPopularMovies(popular.results);
        setTopRatedMovies(topRated.results);
        setNowPlayingMovies(nowPlaying.results);
        setUpcomingMovies(upcoming.results);
      } catch (error) {
        console.error("Error loading movies:", error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedGenre) {
      const loadGenreMovies = async () => {
        try {
          const res = await getMoviesByGenre(selectedGenre, 1);
          setGenreMovies(res.results);
        } catch (error) {
          console.error("Error loading genre movies:", error);
        }
      };
      loadGenreMovies();
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
            <Film className="w-8 h-8" style={{ color: "#00D4FF" }} />
            <h1
              className="text-4xl font-bold"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#F0F4FF" }}
            >
              Movies
            </h1>
          </div>
          <p className="text-sm" style={{ color: "#8899AA" }}>
            Discover thousands of films from every genre and era
          </p>
        </motion.div>

        {/* Featured Carousel */}
        {!loading && popularMovies.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <CarouselSlider items={popularMovies.slice(0, 10)} contentType="movie" />
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
                <option value="release_date">Release Date</option>
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
            <ContentRow title="🔥 Trending Now" items={popularMovies} type="movie" loading={false} viewAllHref="/movies/browse" accentColor="#00D4FF" />
            <ContentRow title="⭐ Top Rated" items={topRatedMovies} type="movie" loading={false} viewAllHref="/movies/browse" accentColor="#00D4FF" />
            <ContentRow title="🎬 Now Playing" items={nowPlayingMovies} type="movie" loading={false} viewAllHref="/movies/browse" accentColor="#00D4FF" />
            <ContentRow title="🚀 Coming Soon" items={upcomingMovies} type="movie" loading={false} viewAllHref="/movies/browse" accentColor="#00D4FF" />
            {selectedGenre && (
              <ContentRow
                title={`${genres.find((g) => g.id === selectedGenre)?.name || "Genre"} Movies`}
                items={genreMovies}
                type="movie"
                loading={false}
                viewAllHref="/movies/browse"
                accentColor="#00D4FF"
              />
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
