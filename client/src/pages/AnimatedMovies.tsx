/* ZENTRIX_TECH — Animated Movies & Shows Page
   Design: Studio-based filtering with trending, popular, latest content
   Data: TMDB animated movies from Disney, Pixar, DreamWorks, Illumination, etc.
*/

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import ContentRow from "@/components/ContentRow";
import Footer from "@/components/Footer";
import {
  getTrendingAll, getPopularMovies, getTopRatedMovies,
  type TMDBMedia,
} from "@/lib/api";
import { Sparkles, TrendingUp, Clock, Star, Film } from "lucide-react";

type StudioFilter = "all" | "disney" | "pixar" | "dreamworks" | "illumination" | "cartoon-network" | "nickelodeon";

const STUDIOS = [
  { id: "all", name: "All Studios", color: "#00D4FF" },
  { id: "disney", name: "Disney", color: "#1f2937" },
  { id: "pixar", name: "Pixar", color: "#7c3aed" },
  { id: "dreamworks", name: "DreamWorks", color: "#06FFA5" },
  { id: "illumination", name: "Illumination", color: "#FF6464" },
  { id: "cartoon-network", name: "Cartoon Network", color: "#8B5CF6" },
  { id: "nickelodeon", name: "Nickelodeon", color: "#FFB800" },
] as const;

export default function AnimatedMovies() {
  const [activeStudio, setActiveStudio] = useState<StudioFilter>("all");
  const [trendingAnimated, setTrendingAnimated] = useState<TMDBMedia[]>([]);
  const [popularAnimated, setPopularAnimated] = useState<TMDBMedia[]>([]);
  const [topRatedAnimated, setTopRatedAnimated] = useState<TMDBMedia[]>([]);
  const [latestAnimated, setLatestAnimated] = useState<TMDBMedia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load animated content
    Promise.allSettled([
      getTrendingAll(1),
      getPopularMovies(1),
      getTopRatedMovies(1),
      getPopularMovies(1), // For latest (would need date filter in real API)
    ]).then(([trendRes, popRes, topRes, latestRes]) => {
      // Filter for animated content (genre_id: 16)
      if (trendRes.status === "fulfilled") {
        const animated = trendRes.value.results
          .filter((m: any) => m.genre_ids?.includes(16))
          .slice(0, 20);
        setTrendingAnimated(animated);
      }
      if (popRes.status === "fulfilled") {
        const animated = popRes.value.results
          .filter((m: any) => m.genre_ids?.includes(16))
          .slice(0, 20);
        setPopularAnimated(animated);
      }
      if (topRes.status === "fulfilled") {
        const animated = topRes.value.results
          .filter((m: any) => m.genre_ids?.includes(16))
          .slice(0, 20);
        setTopRatedAnimated(animated);
      }
      if (latestRes.status === "fulfilled") {
        const animated = latestRes.value.results
          .filter((m: any) => m.genre_ids?.includes(16))
          .slice(0, 20);
        setLatestAnimated(animated);
      }
      setLoading(false);
    });
  }, []);

  const activeStudioColor = STUDIOS.find((s) => s.id === activeStudio)?.color || "#00D4FF";

  return (
    <div style={{ background: "#050816", minHeight: "100vh" }}>
      <Navbar />

      {/* Hero Section */}
      <div className="relative py-12 px-4 sm:px-6 lg:px-8" style={{ background: "linear-gradient(135deg, rgba(0, 212, 255, 0.08) 0%, rgba(139, 92, 246, 0.12) 100%)" }}>
        <div className="max-w-[1440px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Film className="w-8 h-8" style={{ color: "#00D4FF" }} />
              <h1 className="text-4xl sm:text-5xl font-800" style={{
                fontFamily: "'Space Grotesk', sans-serif",
                color: "#F0F4FF",
                letterSpacing: "-0.02em",
              }}>
                Animated Movies & Shows
              </h1>
            </div>
            <p className="text-lg" style={{ color: "#8899AA", maxWidth: "600px" }}>
              Discover the best animated content from Disney, Pixar, DreamWorks, Illumination, and more studios worldwide.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Studio Filter */}
      <div className="sticky top-16 z-30 py-4 px-4 sm:px-6 lg:px-8" style={{ background: "rgba(5, 8, 22, 0.95)", borderBottom: "1px solid rgba(139,92,246,0.1)" }}>
        <div className="max-w-[1440px] mx-auto">
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#8899AA" }}>Filter by Studio</p>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {STUDIOS.map((studio) => (
              <motion.button
                key={studio.id}
                onClick={() => setActiveStudio(studio.id as StudioFilter)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all flex-shrink-0"
                style={{
                  background: activeStudio === studio.id
                    ? `${studio.color}25`
                    : "rgba(255,255,255,0.05)",
                  color: activeStudio === studio.id ? studio.color : "#8899AA",
                  border: activeStudio === studio.id
                    ? `1px solid ${studio.color}50`
                    : "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {studio.name}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="relative z-10" style={{ background: "#050816" }}>
        {/* Trending Animated */}
        <ContentRow
          title="Trending Animated"
          subtitle="Most watched animated content right now"
          items={trendingAnimated}
          type="movie"
          loading={loading}
          viewAllHref="/animated-movies"
          accentColor="#00D4FF"
        />

        {/* Popular Animated */}
        <ContentRow
          title="Popular Animated Movies"
          subtitle="Fan favorites across all studios"
          items={popularAnimated}
          type="movie"
          loading={loading}
          viewAllHref="/animated-movies"
          accentColor="#8B5CF6"
        />

        {/* Top Rated Animated */}
        <ContentRow
          title="Top Rated Animated"
          subtitle="Highest rated animated films"
          items={topRatedAnimated}
          type="movie"
          loading={loading}
          viewAllHref="/animated-movies"
          accentColor="#06FFA5"
        />

        {/* Latest Animated Releases */}
        <ContentRow
          title="Latest Releases"
          subtitle="New animated content"
          items={latestAnimated}
          type="movie"
          loading={loading}
          viewAllHref="/animated-movies"
          accentColor="#FF6464"
        />

        {/* Studio Spotlight */}
        <StudioSpotlight activeStudio={activeStudio} activeColor={activeStudioColor} />
      </div>

      <Footer />
    </div>
  );
}

function StudioSpotlight({ activeStudio, activeColor }: { activeStudio: StudioFilter; activeColor: string }) {
  const spotlights: Record<StudioFilter, { title: string; description: string; examples: string[] }> = {
    all: {
      title: "All Animation Studios",
      description: "Explore animated content from studios worldwide",
      examples: ["Disney", "Pixar", "DreamWorks", "Illumination"],
    },
    disney: {
      title: "Disney Animation",
      description: "Magical storytelling from The Walt Disney Company",
      examples: ["Frozen", "Moana", "Zootopia", "Tangled"],
    },
    pixar: {
      title: "Pixar Animation",
      description: "Innovative and emotionally resonant stories",
      examples: ["Toy Story", "Inside Out", "Coco", "Soul"],
    },
    dreamworks: {
      title: "DreamWorks Animation",
      description: "Action-packed adventures and comedy",
      examples: ["Shrek", "Kung Fu Panda", "How to Train Your Dragon", "Madagascar"],
    },
    illumination: {
      title: "Illumination Entertainment",
      description: "Family-friendly comedy and adventure",
      examples: ["Despicable Me", "Minions", "The Secret Life of Pets", "Sing"],
    },
    "cartoon-network": {
      title: "Cartoon Network",
      description: "Classic and contemporary animated series",
      examples: ["The Powerpuff Girls", "Dexter's Laboratory", "Ben 10", "Samurai Jack"],
    },
    nickelodeon: {
      title: "Nickelodeon Animation",
      description: "Iconic animated shows and movies",
      examples: ["SpongeBob SquarePants", "Avatar: The Last Airbender", "Rugrats", "The Loud House"],
    },
  };

  const spotlight = spotlights[activeStudio];

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="rounded-2xl overflow-hidden p-8 sm:p-12"
        style={{
          background: `linear-gradient(135deg, ${activeColor}15 0%, ${activeColor}08 100%)`,
          border: `1px solid ${activeColor}30`,
        }}
      >
        <div className="flex items-start gap-4 mb-6">
          <Sparkles className="w-8 h-8 flex-shrink-0" style={{ color: activeColor }} />
          <div>
            <h2 className="text-2xl sm:text-3xl font-800 mb-2" style={{
              fontFamily: "'Space Grotesk', sans-serif",
              color: "#F0F4FF",
            }}>
              {spotlight.title}
            </h2>
            <p style={{ color: "#8899AA" }}>{spotlight.description}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {spotlight.examples.map((example) => (
            <span
              key={example}
              className="px-3 py-1.5 rounded-full text-sm font-medium"
              style={{
                background: `${activeColor}20`,
                color: activeColor,
                border: `1px solid ${activeColor}40`,
              }}
            >
              {example}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
