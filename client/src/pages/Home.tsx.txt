/* ZENTRIX_TECH — Home Page
   Design: Obsidian Forge — cinematic hero + content rows + featured sections
   Data: TMDB trending + AniList trending
*/

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ContentRow from "@/components/ContentRow";
import Footer from "@/components/Footer";
import ContinueWatchingRow from "@/components/ContinueWatchingRow";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import {
  getTrendingAll, getTrendingMovies, getTopRatedMovies,
  getNowPlayingMovies, getTrendingTV, getTopRatedTV,
  getTrendingAnime, getPopularAnime, getTopRatedAnime,
  type TMDBMedia, type AniListMedia,
} from "@/lib/api";
import { Flame, Star, Clock, Sword, Film, Tv, TrendingUp, MessageCircle, Users } from "lucide-react";

export default function Home() {
  const [heroItems, setHeroItems] = useState<(TMDBMedia | AniListMedia)[]>([]);
  const [trendingMovies, setTrendingMovies] = useState<TMDBMedia[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<TMDBMedia[]>([]);
  const [nowPlaying, setNowPlaying] = useState<TMDBMedia[]>([]);
  const [trendingTV, setTrendingTV] = useState<TMDBMedia[]>([]);
  const [topRatedTV, setTopRatedTV] = useState<TMDBMedia[]>([]);
  const [trendingAnime, setTrendingAnime] = useState<AniListMedia[]>([]);
  const [popularAnime, setPopularAnime] = useState<AniListMedia[]>([]);
  const [topAnime, setTopAnime] = useState<AniListMedia[]>([]);
  const [heroLoading, setHeroLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const { theme } = useTheme();
  const bg = theme === "dark" ? "#050816" : "#F0F4FF";

  useEffect(() => {
    // Load hero items first
    Promise.allSettled([
      getTrendingAll(1),
      getTrendingAnime(1, 5),
    ]).then(([allRes, animeRes]) => {
      const tmdbItems = allRes.status === "fulfilled"
        ? allRes.value.results.filter((r) => r.backdrop_path).slice(0, 6)
        : [];
      const animeItems = animeRes.status === "fulfilled"
        ? animeRes.value.Page.media.filter((a) => a.bannerImage).slice(0, 3)
        : [];
      setHeroItems([...tmdbItems.slice(0, 5), ...animeItems.slice(0, 3)]);
      setHeroLoading(false);
    });

    // Load content rows
    Promise.allSettled([
      getTrendingMovies(1),
      getTopRatedMovies(1),
      getNowPlayingMovies(1),
      getTrendingTV(1),
      getTopRatedTV(1),
      getTrendingAnime(1, 20),
      getPopularAnime(1, 20),
      getTopRatedAnime(1, 20),
    ]).then(([tMovies, topMovies, nowP, tTV, topTV, tAnime, pAnime, topAnime]) => {
      if (tMovies.status === "fulfilled") setTrendingMovies(tMovies.value.results.slice(0, 20));
      if (topMovies.status === "fulfilled") setTopRatedMovies(topMovies.value.results.slice(0, 20));
      if (nowP.status === "fulfilled") setNowPlaying(nowP.value.results.slice(0, 20));
      if (tTV.status === "fulfilled") setTrendingTV(tTV.value.results.slice(0, 20));
      if (topTV.status === "fulfilled") setTopRatedTV(topTV.value.results.slice(0, 20));
      if (tAnime.status === "fulfilled") setTrendingAnime(tAnime.value.Page.media.slice(0, 20));
      if (pAnime.status === "fulfilled") setPopularAnime(pAnime.value.Page.media.slice(0, 20));
      if (topAnime.status === "fulfilled") setTopAnime(topAnime.value.Page.media.slice(0, 20));
      setContentLoading(false);
    });
  }, []);

  return (
    <div style={{ background: bg, minHeight: "100vh" }}>
      <Navbar />

      {/* Hero */}
      <HeroSection items={heroItems} loading={heroLoading} />

      {/* Content Sections */}
      <div className="relative z-10" style={{ background: bg }}>
        
        {/* Continue Watching - Only for logged in users */}
        {isAuthenticated && <ContinueWatchingRow />}

        {/* Trending Movies */}
        <ContentRow
          title="Trending Movies"
          subtitle="This week's most watched films"
          items={trendingMovies}
          type="movie"
          loading={contentLoading}
          viewAllHref="/movies"
          accentColor="#00D4FF"
        />

        {/* Trending Anime */}
        <ContentRow
          title="Trending Anime"
          subtitle="Hot right now in the anime world"
          items={trendingAnime}
          type="anime"
          loading={contentLoading}
          viewAllHref="/anime"
          accentColor="#8B5CF6"
        />

        {/* Now Playing */}
        <ContentRow
          title="Now Playing"
          subtitle="Currently in cinemas"
          items={nowPlaying}
          type="movie"
          loading={contentLoading}
          viewAllHref="/movies"
          accentColor="#06FFA5"
        />

        {/* Trending TV */}
        <ContentRow
          title="Trending TV Shows"
          subtitle="Binge-worthy series right now"
          items={trendingTV}
          type="tv"
          loading={contentLoading}
          viewAllHref="/tv"
          accentColor="#00D4FF"
        />

        {/* Top Rated Anime */}
        <ContentRow
          title="All-Time Anime Classics"
          subtitle="Highest rated anime of all time"
          items={topAnime}
          type="anime"
          loading={contentLoading}
          viewAllHref="/anime"
          accentColor="#FF2D55"
        />

        {/* Top Rated Movies */}
        <ContentRow
          title="Top Rated Movies"
          subtitle="Cinema's greatest masterpieces"
          items={topRatedMovies}
          type="movie"
          loading={contentLoading}
          viewAllHref="/movies"
          accentColor="#8B5CF6"
        />

        {/* Popular Anime */}
        <ContentRow
          title="Most Popular Anime"
          subtitle="Fan favourites across all genres"
          items={popularAnime}
          type="anime"
          loading={contentLoading}
          viewAllHref="/anime"
          accentColor="#06FFA5"
        />

        {/* Top Rated TV */}
        <ContentRow
          title="Top Rated TV Shows"
          subtitle="The best television has to offer"
          items={topRatedTV}
          type="tv"
          loading={contentLoading}
          viewAllHref="/tv"
          accentColor="#00D4FF"
        />

        {/* Feature Banner */}
        <FeatureBanner />

        {/* Developer Credits & Social Links */}
        <DeveloperCredits />
      </div>

      <Footer />
    </div>
  );
}

function DeveloperCredits() {
  const developers = [
    { name: "XJUNIOR542", role: "Lead Developer" },
    { name: "UNKNOWN", role: "Developer" },
    { name: "Qwin Grace Unique Stanley", role: "Developer" },
    { name: "Leo vallor", role: "Developer" },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="rounded-2xl overflow-hidden p-8 sm:p-12"
        style={{
          background: "linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(255, 45, 85, 0.08) 100%)",
          border: "1px solid rgba(139, 92, 246, 0.2)",
        }}
      >
        <div className="mb-8">
          <div className="zx-section-label mb-2">DEVELOPMENT TEAM</div>
          <h2 className="text-2xl sm:text-3xl font-800" style={{
            fontFamily: "'Space Grotesk', sans-serif",
            color: "#F0F4FF",
            letterSpacing: "-0.02em",
          }}>
            Meet the Developers
          </h2>
        </div>

        {/* Developers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {developers.map((dev, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-4 rounded-lg"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(139, 92, 246, 0.3)",
              }}
            >
              <p className="font-600" style={{ color: "#00D4FF", fontSize: "14px" }}>{dev.name}</p>
              <p className="text-xs" style={{ color: "#8899AA", marginTop: "4px" }}>{dev.role}</p>
            </motion.div>
          ))}
        </div>

        {/* Social Links */}
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="https://chat.whatsapp.com/CgaMVqHUW2jDSAjt01Xfhl"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-600 transition-all hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #25D366, #128C7E)",
              color: "#fff",
              fontSize: "14px",
            }}
          >
            <Users className="w-4 h-4" />
            Join WhatsApp Group
          </a>
          <a
            href="https://whatsapp.com/channel/0029VbCjCq80LKZ4i4iWHq22"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-600 transition-all hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #00D4FF, #0099CC)",
              color: "#fff",
              fontSize: "14px",
            }}
          >
            <MessageCircle className="w-4 h-4" />
            Follow WhatsApp Channel
          </a>
        </div>
      </motion.div>
    </div>
  );
}

function FeatureBanner() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative rounded-2xl overflow-hidden p-8 sm:p-12"
        style={{
          background: "linear-gradient(135deg, rgba(0, 212, 255, 0.08) 0%, rgba(139, 92, 246, 0.12) 50%, rgba(6, 255, 165, 0.06) 100%)",
          border: "1px solid rgba(0, 212, 255, 0.15)",
        }}
      >
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{ background: "radial-gradient(circle, #8B5CF6, transparent)" }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10 blur-3xl"
          style={{ background: "radial-gradient(circle, #00D4FF, transparent)" }} />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="zx-section-label mb-2">ZENTRIX_TECH PLATFORM</div>
            <h2 className="text-2xl sm:text-3xl font-800 mb-3"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 800,
                color: "#F0F4FF",
                letterSpacing: "-0.02em",
              }}>
              Movies, TV Shows & Anime
              <br />
              <span style={{
                background: "linear-gradient(135deg, #00D4FF, #8B5CF6)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                All in One Place
              </span>
            </h2>
            <p className="text-sm" style={{ color: "#8899AA", fontFamily: "'Inter', sans-serif", maxWidth: "400px" }}>
              Discover thousands of movies, binge-worthy TV series, and the best anime — with real-time metadata, ratings, and seamless playback.
            </p>
          </div>
          <div className="flex flex-col gap-3 flex-shrink-0">
            <div className="flex items-center gap-3">
              {[
                { icon: Film, label: "Movies", color: "#00D4FF" },
                { icon: Tv, label: "TV Shows", color: "#06FFA5" },
                { icon: Sword, label: "Anime", color: "#8B5CF6" },
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                  <span className="text-xs font-600"
                    style={{ color: "#F0F4FF", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
