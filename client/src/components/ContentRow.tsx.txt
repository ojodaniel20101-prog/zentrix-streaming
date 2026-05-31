/* ZENTRIX_TECH — ContentRow Component
   Design: Obsidian Forge — horizontal scroll row with section header
   Features: lazy loading, scroll arrows, staggered reveals
   Mobile Fix v2: Removed conflicting perspective/preserve-3d/translateZ combo
   that caused scanline/tearing on Android & iOS WebKit.
   GPU compositing is now isolated to the container only, not child cards.
*/

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import MediaCard from "./MediaCard";
import type { TMDBMedia, AniListMedia } from "@/lib/api";

interface ContentRowProps {
  title: string;
  subtitle?: string;
  items: (TMDBMedia | AniListMedia)[];
  type: "movie" | "tv" | "anime";
  loading?: boolean;
  viewAllHref?: string;
  accentColor?: string;
  size?: "sm" | "md" | "lg";
}

function SkeletonCard({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const w = size === "sm" ? "w-[100px] md:w-[140px]" : size === "lg" ? "w-[220px]" : "w-[100px] md:w-[170px]";
  const h = size === "sm" ? "h-[150px] md:h-[200px]" : size === "lg" ? "h-[310px]" : "h-[150px] md:h-[240px]";
  return (
    <div className={`${w} flex-shrink-0`}>
      <div className={`${h} rounded-xl zx-skeleton`} />
      <div className="mt-2 h-4 rounded zx-skeleton w-4/5" />
      <div className="mt-1 h-3 rounded zx-skeleton w-2/5" />
    </div>
  );
}

export default function ContentRow({
  title,
  subtitle,
  items,
  type,
  loading = false,
  viewAllHref,
  accentColor = "#00D4FF",
  size = "md",
}: ContentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = dir === "left" ? -600 : 600;
    el.scrollBy({ left: amount, behavior: "smooth" });
  };

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  return (
    <section className="py-2 sm:py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 rounded-full" style={{ background: accentColor }} />
            <h2 className="text-base sm:text-xl font-bold sm:font-700"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                color: "#F0F4FF",
                letterSpacing: "-0.01em",
              }}>
              {title}
            </h2>
          </div>
          {subtitle && (
            <p className="hidden sm:block text-xs mt-0.5 ml-4"
              style={{ color: "#8899AA", fontFamily: "'Inter', sans-serif" }}>
              {subtitle}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            onClick={() => scroll("left")}
            className="hidden sm:flex p-1.5 rounded-lg transition-all"
            style={{
              background: canScrollLeft ? "rgba(0, 212, 255, 0.08)" : "rgba(255,255,255,0.03)",
              border: "1px solid rgba(0, 212, 255, 0.1)",
              color: canScrollLeft ? "#00D4FF" : "#8899AA",
              opacity: canScrollLeft ? 1 : 0.4,
            }}
            whileTap={{ scale: 0.9 }}
            disabled={!canScrollLeft}
          >
            <ChevronLeft className="w-4 h-4" />
          </motion.button>
          <motion.button
            onClick={() => scroll("right")}
            className="hidden sm:flex p-1.5 rounded-lg transition-all"
            style={{
              background: canScrollRight ? "rgba(0, 212, 255, 0.08)" : "rgba(255,255,255,0.03)",
              border: "1px solid rgba(0, 212, 255, 0.1)",
              color: canScrollRight ? "#00D4FF" : "#8899AA",
              opacity: canScrollRight ? 1 : 0.4,
            }}
            whileTap={{ scale: 0.9 }}
            disabled={!canScrollRight}
          >
            <ChevronRight className="w-4 h-4" />
          </motion.button>
          {viewAllHref && (
            <Link href={viewAllHref}>
              <motion.div
                className="flex items-center gap-1 text-[10px] sm:text-xs font-600 cursor-pointer ml-1"
                style={{
                  color: accentColor,
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 600,
                }}
                whileHover={{ gap: "6px" }}
              >
                View All <ArrowRight className="w-3.5 h-3.5" />
              </motion.div>
            </Link>
          )}
        </div>
      </div>

      {/* Scroll Container
          FIX: Do NOT combine perspective + preserve-3d + overflow:scroll on the same element.
          That triggers a WebKit compositing conflict causing scanline artifacts on mobile.
          Use a single contain:paint wrapper instead — no 3D context is opened.
      */}
      <div
        className="relative"
      >
        {/* Left fade */}
        {canScrollLeft && (
          <div
            className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
            style={{
              background: "linear-gradient(90deg, #050816, transparent)",
            }}
          />
        )}
        {/* Right fade */}
        {canScrollRight && (
          <div
            className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
            style={{
              background: "linear-gradient(270deg, #050816, transparent)",
            }}
          />
        )}

        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="flex gap-2 overflow-x-auto pb-4 px-3 sm:px-6 lg:px-8"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            scrollSnapType: "x mandatory",
            /* FIX: WebkitOverflowScrolling:touch is now deprecated and causes
               compositing conflicts when combined with framer-motion transforms.
               Remove it — modern iOS handles momentum scrolling without this flag. */
            WebkitOverflowScrolling: "auto",
            /* FIX: Do NOT add translateZ(0), perspective, or preserve-3d here.
               overflow:scroll + 3D context = tearing on mobile WebKit. */
          }}
        >
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} size={size} />)
            : items.map((item, i) => (
                /* FIX: No per-card backfaceVisibility or translateZ wrappers.
                   Each extra composited layer on mobile costs GPU tile memory.
                   Cards are already composited individually by framer-motion's
                   whileHover — adding outer wrappers doubles the layer count. */
                <MediaCard
                  key={item.id}
                  item={item}
                  type={type}
                  index={i}
                  size={size}
                />
              ))}
        </div>
      </div>
    </section>
  );
}
