/**
 * CarouselSlider Component - Auto-rotating carousel with smooth transitions
 * Used for featured content on category pages
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { tmdbBackdrop, tmdbImg } from "@/lib/api";
import { Link } from "wouter";

interface CarouselItem {
  id: number;
  title?: string | { romaji?: string; english?: string };
  name?: string;
  overview?: string;
  description?: string;
  backdrop_path?: string | null;
  poster_path?: string | null;
  coverImage?: { large?: string; medium?: string };
  bannerImage?: string;
  vote_average?: number;
  averageScore?: number;
  release_date?: string;
  first_air_date?: string;
  startDate?: { year?: number; month?: number; day?: number };
  media_type?: string;
  type?: string;
}

interface CarouselSliderProps {
  items: CarouselItem[];
  autoRotate?: boolean;
  rotateInterval?: number;
  contentType?: "movie" | "tv" | "anime";
}

export default function CarouselSlider({
  items,
  autoRotate = true,
  rotateInterval = 5000,
  contentType = "movie",
}: CarouselSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-rotate effect
  useEffect(() => {
    if (!autoRotate || items.length === 0) return;

    timerRef.current = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, rotateInterval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoRotate, rotateInterval, items.length]);

  const handlePrevious = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % items.length);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  if (items.length === 0) return null;

  const currentItem = items[currentIndex];
  const title = typeof currentItem.title === "string" 
    ? currentItem.title 
    : (currentItem.title?.romaji || currentItem.title?.english || currentItem.name || "Unknown");
  const year = (currentItem.release_date || currentItem.first_air_date || currentItem.startDate?.year?.toString() || "").substring(0, 4);
  const backdropUrl = currentItem.backdrop_path 
    ? tmdbBackdrop(currentItem.backdrop_path) 
    : currentItem.bannerImage;
  const posterUrl = currentItem.poster_path 
    ? tmdbImg(currentItem.poster_path, "w300") 
    : currentItem.coverImage?.large;

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  return (
    <div className="relative w-full h-96 sm:h-[500px] md:h-[600px] rounded-2xl overflow-hidden group">
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={currentIndex}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 300, damping: 30 },
            opacity: { duration: 0.5 },
          }}
          className="absolute inset-0"
        >
          {/* Background Image */}
          {backdropUrl && (
            <img
              src={backdropUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60" />

          {/* Content */}
          <div className="absolute inset-0 flex items-end p-6 sm:p-8 md:p-12">
            <div className="max-w-2xl">
              {/* Poster */}
              {posterUrl && (
                <img
                  src={posterUrl}
                  alt={title}
                  className="w-32 sm:w-40 md:w-48 rounded-lg mb-4 shadow-2xl"
                />
              )}

              {/* Title & Info */}
              <div className="mb-4">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2" style={{ color: "#F0F4FF" }}>
                  {title}
                </h2>
                <div className="flex items-center gap-4 text-sm sm:text-base" style={{ color: "#8899AA" }}>
                  {year && <span>{year}</span>}
                  {(currentItem.vote_average || currentItem.averageScore) && (
                    <span className="flex items-center gap-1">
                      ⭐ {currentItem.vote_average ? currentItem.vote_average.toFixed(1) : (currentItem.averageScore ? (currentItem.averageScore / 10).toFixed(1) : '0')}
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <p
                className="text-sm sm:text-base line-clamp-3 mb-6"
                style={{ color: "#B0C4DE" }}
              >
                {currentItem.overview}
              </p>

              {/* CTA Button */}
              <Link href={`/watch/${contentType}/${currentItem.id}`}>
                <button
                  className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105"
                  style={{
                    background: "rgba(0, 212, 255, 0.9)",
                    color: "#050816",
                  }}
                >
                  <Play className="w-5 h-5" />
                  Watch Now
                </button>
              </Link>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <button
        onClick={handlePrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: "rgba(0, 212, 255, 0.2)" }}
      >
        <ChevronLeft className="w-6 h-6" style={{ color: "#00D4FF" }} />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: "rgba(0, 212, 255, 0.2)" }}
      >
        <ChevronRight className="w-6 h-6" style={{ color: "#00D4FF" }} />
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {items.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setDirection(index > currentIndex ? 1 : -1);
              setCurrentIndex(index);
            }}
            className="w-2 h-2 rounded-full transition-all"
            style={{
              background: index === currentIndex ? "#00D4FF" : "rgba(0, 212, 255, 0.3)",
              width: index === currentIndex ? "24px" : "8px",
            }}
          />
        ))}
      </div>
    </div>
  );
}
