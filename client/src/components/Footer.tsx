/* ZENTRIX_TECH — Footer Component */

import { Link } from "wouter";
import { Sparkles, Github, Twitter, Instagram } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-16 border-t" style={{ borderColor: "rgba(0, 212, 255, 0.08)" }}>
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #00D4FF, #8B5CF6)" }}>
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-800 text-base"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 800,
                  background: "linear-gradient(135deg, #00D4FF, #8B5CF6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                ZENTRIX TECH
              </span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "#8899AA", fontFamily: "'Inter', sans-serif" }}>
              World-class cinematic streaming platform. Movies, TV shows, and anime in stunning quality.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-xs font-700 uppercase tracking-widest mb-4"
              style={{ color: "#00D4FF", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>
              Browse
            </h4>
            <ul className="space-y-2">
              {[
                { href: "/movies", label: "Movies" },
                { href: "/tv", label: "TV Shows" },
                { href: "/anime", label: "Anime" },
                { href: "/watchlist", label: "Watchlist" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>
                    <span className="text-sm cursor-pointer transition-colors hover:text-white"
                      style={{ color: "#8899AA", fontFamily: "'Inter', sans-serif" }}>
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Genres */}
          <div>
            <h4 className="text-xs font-700 uppercase tracking-widest mb-4"
              style={{ color: "#8B5CF6", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>
              Genres
            </h4>
            <ul className="space-y-2">
              {["Action", "Drama", "Sci-Fi", "Thriller", "Comedy", "Horror"].map((g) => (
                <li key={g}>
                  <span className="text-sm" style={{ color: "#8899AA", fontFamily: "'Inter', sans-serif" }}>
                    {g}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-xs font-700 uppercase tracking-widest mb-4"
              style={{ color: "#06FFA5", fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>
              Info
            </h4>
            <ul className="space-y-2">
              {["About", "Privacy Policy", "Terms of Service", "Contact"].map((item) => (
                <li key={item}>
                  <span className="text-sm cursor-pointer transition-colors hover:text-white"
                    style={{ color: "#8899AA", fontFamily: "'Inter', sans-serif" }}>
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderColor: "rgba(0, 212, 255, 0.06)" }}>
          <p className="text-xs" style={{ color: "#8899AA", fontFamily: "'Inter', sans-serif" }}>
            © 2025 ZENTRIX_TECH. All content metadata sourced from TMDB & AniList.
          </p>
          <p className="text-xs" style={{ color: "#8899AA", fontFamily: "'Inter', sans-serif" }}>
            Built with ❤️ for cinephiles and anime fans
          </p>
        </div>
      </div>
    </footer>
  );
}
