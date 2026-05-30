/*
  Animated Movies/Shows Page with Curated Studio Collections
  Features: Disney, Pixar, DreamWorks, Illumination, Cartoon Network, Nickelodeon, Anime Movies
  Design: Dark cinematic theme with studio-specific styling
*/

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CarouselSlider from "@/components/CarouselSlider";
import ContentRow from "@/components/ContentRow";
import { getFilteredAnimations, ANIMATION_STUDIOS } from "@/lib/filterApi";
import type { TMDBMedia } from "@/lib/api";
import { Film, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";



export default function AnimatedMoviesPage() {
  const [studioContent, setStudioContent] = useState<Record<string, TMDBMedia[]>>({});
  const [loading, setLoading] = useState(true);
  const [featuredContent, setFeaturedContent] = useState<TMDBMedia[]>([]);
  const [trendingContent, setTrendingContent] = useState<TMDBMedia[]>([]);
  const [popularContent, setPopularContent] = useState<TMDBMedia[]>([]);
  const [topRatedContent, setTopRatedContent] = useState<TMDBMedia[]>([]);
  const [recentlyAddedContent, setRecentlyAddedContent] = useState<TMDBMedia[]>([]);

  const studios = [
    { name: "Disney", icon: "🏰" },
    { name: "Pixar", icon: "🎨" },
    { name: "DreamWorks", icon: "🎬" },
    { name: "Illumination", icon: "💡" },
    { name: "Cartoon Network", icon: "📺" },
    { name: "Nickelodeon", icon: "🎪" },
  ];

  useEffect(() => {
    const loadAnimationContent = async () => {
      setLoading(true);
      try {
        const results: Record<string, TMDBMedia[]> = {};
        const allContent: TMDBMedia[] = [];

        // Load studio collections
        for (const studio of studios) {
          const content = await getFilteredAnimations({
            genres: [16], // Animation genre
            studio: studio.name,
            page: 1,
          });
          results[studio.name] = content.results || [];
          allContent.push(...(content.results || []).slice(0, 5));
        }

        // Load carousel sections
        const trendingRes = await getFilteredAnimations({
          genres: [16],
          sortBy: "popularity",
          page: 1,
        });
        setTrendingContent(trendingRes.results?.slice(0, 10) || []);

        const popularRes = await getFilteredAnimations({
          genres: [16],
          sortBy: "popularity",
          page: 1,
        });
        setPopularContent(popularRes.results?.slice(0, 10) || []);

        const topRatedRes = await getFilteredAnimations({
          genres: [16],
          sortBy: "rating",
          page: 1,
        });
        setTopRatedContent(topRatedRes.results?.slice(0, 10) || []);

        const recentRes = await getFilteredAnimations({
          genres: [16],
          sortBy: "release_date",
          page: 1,
        });
        setRecentlyAddedContent(recentRes.results?.slice(0, 10) || []);

        setStudioContent(results);
        setFeaturedContent(allContent.slice(0, 10));
      } catch (error) {
        console.error("Error loading animation content:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAnimationContent();
  }, []);

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
              Animated Movies & Shows
            </h1>
          </div>
          <p className="text-sm" style={{ color: "#8899AA" }}>
            Discover amazing animated content from top studios
          </p>
        </motion.div>

        {/* Featured Carousel */}
        {!loading && featuredContent.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <CarouselSlider items={featuredContent.slice(0, 10)} contentType="movie" />
          </motion.div>
        )}

        {/* Carousel Sections */}
        {!loading && (
          <>
            {/* Trending Now */}
            {trendingContent.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-12"
              >
                <h2 className="text-2xl font-bold mb-4" style={{ color: "#F0F4FF" }}>
                  🔥 Trending Now
                </h2>
                <CarouselSlider items={trendingContent} contentType="movie" autoRotate={true} rotateInterval={6000} />
              </motion.div>
            )}

            {/* Popular This Week */}
            {popularContent.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-12"
              >
                <h2 className="text-2xl font-bold mb-4" style={{ color: "#F0F4FF" }}>
                  ⭐ Popular This Week
                </h2>
                <CarouselSlider items={popularContent} contentType="movie" autoRotate={true} rotateInterval={7000} />
              </motion.div>
            )}

            {/* Top Rated */}
            {topRatedContent.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-12"
              >
                <h2 className="text-2xl font-bold mb-4" style={{ color: "#F0F4FF" }}>
                  👑 Top Rated
                </h2>
                <CarouselSlider items={topRatedContent} contentType="movie" autoRotate={true} rotateInterval={8000} />
              </motion.div>
            )}

            {/* Recently Added */}
            {recentlyAddedContent.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="mb-12"
              >
                <h2 className="text-2xl font-bold mb-4" style={{ color: "#F0F4FF" }}>
                  ✨ Recently Added
                </h2>
                <CarouselSlider items={recentlyAddedContent} contentType="movie" autoRotate={true} rotateInterval={5000} />
              </motion.div>
            )}
          </>
        )}

        {/* Divider */}
        {!loading && (trendingContent.length > 0 || popularContent.length > 0) && (
          <div className="my-16 border-t" style={{ borderColor: "rgba(0, 212, 255, 0.1)" }} />
        )}

        {/* Studio Collections */}
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-12 h-12 animate-spin" style={{ color: "#00D4FF" }} />
          </div>
        ) : (
          <>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold mb-8"
              style={{ color: "#F0F4FF" }}
            >
              Studio Collections
            </motion.h2>
            {studios.map((studio) => (
              <ContentRow
                key={studio.name}
                title={`${studio.icon} ${studio.name}`}
                items={studioContent[studio.name] || []}
                type="movie"
                loading={loading}
                viewAllHref={`/animation/browse?studio=${studio.name}`}
                accentColor="#00D4FF"
              />
            ))}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
