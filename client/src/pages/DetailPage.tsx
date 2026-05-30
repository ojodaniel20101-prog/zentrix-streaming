/* ZENTRIX_TECH — Detail Page (Enhanced v2)
   New features: Watch Providers, Keywords, Full production info,
   Enhanced seasons browser, Better recommendations, Images gallery
*/

import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import ContentRow from "@/components/ContentRow";
import Footer from "@/components/Footer";
import AnimeDownloadButton from "@/components/AnimeDownloadButton";
import MovieDownloadButton from "@/components/MovieDownloadButton";
import { useWatchlist } from "@/contexts/WatchlistContext";
import {
  getMovieDetails, getTVDetails, getAnimeDetails,
  tmdbImg, tmdbBackdrop, getMediaTitle, getMediaYear, getMediaRuntime,
  type TMDBMedia, type AniListMedia,
} from "@/lib/api";
import {
  Play, Bookmark, BookmarkCheck, Star, Clock, Calendar,
  Globe, Tv, Film, Sword, ChevronRight, ExternalLink, Youtube,
  Users, Award, TrendingUp, Info, DollarSign, Tag, Monitor,
  ChevronLeft, Check, X, Image as ImageIcon, Layers,
} from "lucide-react";
import { Link } from "wouter";

type MediaType = "movie" | "tv" | "anime";

export default function DetailPage() {
  const params = useParams<{ type: string; id: string }>();
  const type = params.type as MediaType;
  const id = Number(params.id);
  const [, navigate] = useLocation();

  const [data, setData] = useState<TMDBMedia | AniListMedia | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "cast" | "seasons" | "related" | "media">("overview");
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();

  useEffect(() => {
    setLoading(true);
    setError(false);
    setData(null);
    const load = async () => {
      try {
        if (type === "movie") {
          const res = await getMovieDetails(id);
          setData(res);
          const trailer = res.videos?.results.find(v => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser"));
          if (trailer) setTrailerKey(trailer.key);
        } else if (type === "tv") {
          const res = await getTVDetails(id);
          setData(res);
          const trailer = res.videos?.results.find(v => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser"));
          if (trailer) setTrailerKey(trailer.key);
        } else {
          const res = await getAnimeDetails(id);
          setData(res.Media);
          if (res.Media.trailer?.site === "youtube") setTrailerKey(res.Media.trailer.id);
        }
      } catch { setError(true); }
      setLoading(false);
    };
    load();
  }, [type, id]);

  if (loading) {
    return (
      <div style={{ background: "#050816", minHeight: "100vh" }}>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full border-2 animate-spin mx-auto mb-4" style={{ borderColor: "rgba(0,212,255,0.3)", borderTopColor: "#00D4FF" }} />
            <p className="text-sm" style={{ color: "#8899AA" }}>Loading details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ background: "#050816", minHeight: "100vh" }}>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Info className="w-12 h-12 mx-auto mb-4" style={{ color: "#8899AA" }} />
            <h2 className="text-xl font-bold mb-2" style={{ color: "#F0F4FF" }}>Content not found</h2>
            <button onClick={() => navigate("/")} className="mt-4 text-sm" style={{ color: "#00D4FF" }}>← Go Home</button>
          </div>
        </div>
      </div>
    );
  }

  const isAnime = type === "anime";
  const tmdb = !isAnime ? (data as TMDBMedia) : null;
  const anime = isAnime ? (data as AniListMedia) : null;

  const title = isAnime ? (anime!.title.english || anime!.title.romaji) : getMediaTitle(tmdb!);
  const originalTitle = isAnime ? anime!.title.native : (tmdb!.title !== tmdb!.name && (tmdb!.title || tmdb!.name));
  const overview = isAnime ? (anime!.description?.replace(/<[^>]*>/g, "") || "") : tmdb!.overview;
  const backdrop = isAnime ? (anime!.bannerImage || anime!.coverImage.extraLarge) : tmdbBackdrop(tmdb!.backdrop_path);
  const poster = isAnime ? anime!.coverImage.extraLarge : tmdbImg(tmdb!.poster_path, "w500");
  const rating = isAnime ? (anime!.averageScore ? (anime!.averageScore / 10).toFixed(1) : null) : (tmdb!.vote_average ? tmdb!.vote_average.toFixed(1) : null);
  const year = isAnime ? String(anime!.seasonYear || "") : getMediaYear(tmdb!);
  const runtime = isAnime ? (anime!.duration ? `${anime!.duration}m/ep` : null) : getMediaRuntime(tmdb!);
  const genres = isAnime ? anime!.genres : (tmdb!.genres?.map(g => g.name) || []);
  const status = isAnime ? anime!.status : tmdb!.status;
  const episodes = isAnime ? anime!.episodes : null;
  const seasons = !isAnime && type === "tv" ? tmdb!.number_of_seasons : null;
  const cast = !isAnime ? (tmdb!.credits?.cast?.slice(0, 16) || []) : [];
  const crew = !isAnime ? (tmdb!.credits?.crew || []) : [];
  const director = crew.find(c => c.job === "Director");
  const writers = crew.filter(c => c.job === "Writer" || c.job === "Screenplay").slice(0, 2);
  const similar = !isAnime ? (tmdb!.similar?.results?.slice(0, 12) || []) : [];
  const recommendations = !isAnime ? (tmdb!.recommendations?.results?.slice(0, 12) || []) : [];
  const animeChars = isAnime ? (anime!.characters?.edges?.slice(0, 12) || []) : [];
  const animeRelated = isAnime ? (anime!.relations?.edges?.slice(0, 8) || []) : [];
  const animeRecs = isAnime ? (anime!.recommendations?.nodes?.map(n => n.mediaRecommendation).filter(Boolean) || []) : [];
  const animeStaff = isAnime ? (anime!.staff?.edges?.slice(0, 6) || []) : [];
  const animeStudio = isAnime ? anime!.studios?.nodes?.find(s => s.isAnimationStudio)?.name : null;
  const animeTags = isAnime ? (anime!.tags?.slice(0, 12) || []) : [];
  const keywords = !isAnime ? (tmdb!.keywords?.keywords || tmdb!.keywords?.results || []).slice(0, 12) : [];
  const backdrops = !isAnime ? (tmdb!.images?.backdrops?.slice(0, 12) || []) : [];
  const posters = !isAnime ? (tmdb!.images?.posters?.slice(0, 8) || []) : [];
  const videos = !isAnime ? (tmdb!.videos?.results?.filter(v => v.site === "YouTube").slice(0, 6) || []) : [];
  const watchProviders = !isAnime ? tmdb!["watch/providers"]?.results?.US : null;
  const budget = !isAnime ? tmdb!.budget : null;
  const revenue = !isAnime ? tmdb!.revenue : null;
  const networks = !isAnime && type === "tv" ? (tmdb!.networks || []) : [];
  const contentRating = !isAnime && type === "tv" ? tmdb!.content_ratings?.results?.find(r => r.iso_3166_1 === "US")?.rating : null;

  const inWatchlist = isInWatchlist(id, type);

  const handleWatchlist = () => {
    if (inWatchlist) {
      removeFromWatchlist(id, type);
    } else {
      addToWatchlist({ id, type, title, poster: poster || "", rating: parseFloat(rating || "0"), year, addedAt: Date.now() });
    }
  };

  const animeArcs = isAnime ? (anime!.relations?.edges?.filter(e => e.relationType === "SEQUEL" || e.relationType === "PREQUEL" || e.relationType === "SIDE_STORY" || e.relationType === "ALTERNATIVE") || []) : [];

  const tabs = [
    { id: "overview", label: "Overview" },
    ...(cast.length > 0 || animeChars.length > 0 ? [{ id: "cast", label: isAnime ? "Characters" : "Cast" }] : []),
    ...(type === "tv" && tmdb?.seasons ? [{ id: "seasons", label: "Seasons" }] : []),
    ...(isAnime && animeArcs.length > 0 ? [{ id: "seasons", label: "Seasons/Arcs" }] : []),
    ...((similar.length > 0 || recommendations.length > 0 || animeRelated.length > 0 || animeRecs.length > 0) ? [{ id: "related", label: "Related" }] : []),
    ...((backdrops.length > 0 || videos.length > 0) ? [{ id: "media", label: "Gallery" }] : []),
  ] as { id: typeof activeTab; label: string }[];

  const formatMoney = (n: number) => {
    if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
    return `$${n.toLocaleString()}`;
  };

  return (
    <div style={{ background: "#050816", minHeight: "100vh" }}>
      <Navbar />

      {/* Hero Backdrop */}
      <div className="relative h-[50vh] sm:h-[60vh] overflow-hidden">
        {backdrop && <img src={backdrop} alt={title} className="w-full h-full object-cover" style={{ filter: "brightness(0.4) saturate(1.2)" }} />}
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 30%, #050816 100%)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(5,8,22,0.6) 0%, transparent 60%)" }} />
      </div>

      {/* Content */}
      <div className="relative -mt-40 z-10 px-4 sm:px-6 lg:px-8 max-w-[1440px] mx-auto pb-8">
        <div className="flex flex-col sm:flex-row gap-8">
          {/* Poster */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex-shrink-0">
            <div className="w-48 sm:w-56 rounded-2xl overflow-hidden shadow-2xl" style={{ border: "2px solid rgba(0,212,255,0.15)" }}>
              {poster ? (
                <img src={poster} alt={title} className="w-full aspect-[2/3] object-cover" />
              ) : (
                <div className="w-full aspect-[2/3] flex items-center justify-center" style={{ background: "rgba(11,18,32,0.8)" }}>
                  <Film className="w-12 h-12" style={{ color: "#8899AA" }} />
                </div>
              )}
            </div>
            {/* Watch providers */}
            {watchProviders?.flatrate && watchProviders.flatrate.length > 0 && (
              <div className="mt-3">
                <p className="text-xs uppercase tracking-wider mb-2" style={{ color: "#8899AA", fontWeight: 700 }}>Stream On</p>
                <div className="flex flex-wrap gap-1.5">
                  {watchProviders.flatrate.slice(0, 4).map(p => (
                    <div key={p.provider_name} className="w-8 h-8 rounded-lg overflow-hidden" title={p.provider_name}>
                      <img src={`https://image.tmdb.org/t/p/w92${p.logo_path}`} alt={p.provider_name} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Main Info */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="flex-1 min-w-0 pt-24 sm:pt-0">
            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-bold mb-1" style={{ color: "#FFFFFF", fontFamily: "'Space Grotesk', sans-serif" }}>{title}</h1>
            {originalTitle && originalTitle !== title && (
              <p className="text-sm mb-3" style={{ color: "#8899AA" }}>{String(originalTitle)}</p>
            )}
            {tmdb?.tagline && <p className="text-sm italic mb-3" style={{ color: "#8899AA" }}>"{tmdb.tagline}"</p>}

            {/* Meta row */}
            <div className="flex items-center gap-4 flex-wrap mb-4">
              {rating && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.3)" }}>
                  <Star className="w-4 h-4 fill-current" style={{ color: "#FFD700" }} />
                  <span className="font-bold text-sm" style={{ color: "#FFD700" }}>{rating}</span>
                  {!isAnime && tmdb!.vote_count > 0 && <span className="text-xs" style={{ color: "#8899AA" }}>({tmdb!.vote_count.toLocaleString()})</span>}
                </div>
              )}
              {year && <span className="flex items-center gap-1 text-sm" style={{ color: "#8899AA" }}><Calendar className="w-4 h-4" />{year}</span>}
              {runtime && <span className="flex items-center gap-1 text-sm" style={{ color: "#8899AA" }}><Clock className="w-4 h-4" />{runtime}</span>}
              {contentRating && <span className="px-2 py-0.5 rounded text-xs font-bold" style={{ background: "rgba(255,100,100,0.1)", color: "#FF6464", border: "1px solid rgba(255,100,100,0.3)" }}>{contentRating}</span>}
              <span className="px-2 py-1 rounded text-xs font-bold" style={{ background: type === "movie" ? "rgba(255,100,100,0.2)" : type === "tv" ? "rgba(100,200,255,0.2)" : "rgba(200,100,255,0.2)", color: type === "movie" ? "#FF6464" : type === "tv" ? "#64C8FF" : "#C864FF" }}>
                {type === "movie" ? "FILM" : type === "tv" ? "TV SERIES" : "ANIME"}
              </span>
              {status && <span className="text-xs px-2 py-1 rounded" style={{ background: "rgba(6,255,165,0.08)", color: "#06FFA5", border: "1px solid rgba(6,255,165,0.2)" }}>{status}</span>}
              {seasons && <span className="text-sm" style={{ color: "#8899AA" }}>{seasons} Season{seasons > 1 ? "s" : ""}</span>}
              {episodes && <span className="text-sm" style={{ color: "#8899AA" }}>{episodes} Episodes</span>}
            </div>

            {/* Genres */}
            {genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {genres.map(g => (
                  <span key={g} className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "rgba(0,212,255,0.08)", color: "#00D4FF", border: "1px solid rgba(0,212,255,0.2)" }}>{g}</span>
                ))}
              </div>
            )}

            {/* Overview snippet */}
            <p className="text-sm leading-relaxed mb-5 max-w-2xl" style={{ color: "rgba(240,244,255,0.8)" }}>
              {overview ? (overview.length > 300 ? overview.substring(0, 300) + "..." : overview) : "No overview available."}
            </p>

            {/* People */}
            {(director || writers.length > 0 || animeStudio) && (
              <div className="flex flex-wrap gap-4 mb-5 text-sm">
                {director && <div><span style={{ color: "#8899AA" }}>Director: </span><span style={{ color: "#F0F4FF" }}>{director.name}</span></div>}
                {writers.length > 0 && <div><span style={{ color: "#8899AA" }}>Written by: </span><span style={{ color: "#F0F4FF" }}>{writers.map(w => w.name).join(", ")}</span></div>}
                {animeStudio && <div><span style={{ color: "#8899AA" }}>Studio: </span><span style={{ color: "#F0F4FF" }}>{animeStudio}</span></div>}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <Link href={`/watch/${type}/${id}`}>
                  <motion.div className="flex items-center gap-2 px-6 py-3 rounded-xl cursor-pointer font-bold text-sm" style={{ background: "linear-gradient(135deg, #00D4FF, #8B5CF6)", color: "#050816", boxShadow: "0 8px 30px rgba(0,212,255,0.25)" }} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Play className="w-4 h-4 fill-current" />Watch Now
                  </motion.div>
                </Link>
                
                <div className="min-w-[140px]">
                  {type === "anime" && (
                    <AnimeDownloadButton animeTitle={title} episodeNumber={1} />
                  )}
                  
                  {type === "movie" && (
                    <MovieDownloadButton movieTitle={title} />
                  )}
                </div>
              </div>
              {trailerKey && (
                <motion.button onClick={() => setTrailerOpen(true)} className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm" style={{ background: "rgba(255,255,255,0.06)", color: "#F0F4FF", border: "1px solid rgba(255,255,255,0.1)" }} whileTap={{ scale: 0.97 }}>
                  <Youtube className="w-4 h-4" style={{ color: "#FF2D55" }} />Trailer
                </motion.button>
              )}
              <motion.button onClick={handleWatchlist} className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm" style={{ background: inWatchlist ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.06)", color: inWatchlist ? "#8B5CF6" : "#F0F4FF", border: `1px solid ${inWatchlist ? "rgba(139,92,246,0.35)" : "rgba(255,255,255,0.1)"}` }} whileTap={{ scale: 0.97 }}>
                {inWatchlist ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                {inWatchlist ? "Saved" : "Watchlist"}
              </motion.button>
            </div>

            {/* Box office */}
            {(budget && budget > 0 || revenue && revenue > 0) && (
              <div className="flex gap-4 mt-4 flex-wrap">
                {budget && budget > 0 && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" style={{ color: "#8899AA" }} />
                    <span className="text-xs" style={{ color: "#8899AA" }}>Budget:</span>
                    <span className="text-xs font-semibold" style={{ color: "#F0F4FF" }}>{formatMoney(budget)}</span>
                  </div>
                )}
                {revenue && revenue > 0 && (
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" style={{ color: "#06FFA5" }} />
                    <span className="text-xs" style={{ color: "#8899AA" }}>Revenue:</span>
                    <span className="text-xs font-semibold" style={{ color: "#06FFA5" }}>{formatMoney(revenue)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Networks */}
            {networks.length > 0 && (
              <div className="flex items-center gap-3 mt-4">
                <Monitor className="w-4 h-4" style={{ color: "#8899AA" }} />
                <span className="text-xs" style={{ color: "#8899AA" }}>Network:</span>
                {networks.slice(0, 2).map(n => (
                  <span key={n.id} className="text-xs font-semibold" style={{ color: "#F0F4FF" }}>{n.name}</span>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Tab nav */}
        <div className="mt-10 border-b sticky top-0 z-20" style={{ borderColor: "rgba(0,212,255,0.1)", background: "#050816" }}>
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="px-5 py-3 text-sm font-semibold whitespace-nowrap transition-all relative" style={{ color: activeTab === tab.id ? "#00D4FF" : "#8899AA" }}>
                {tab.label}
                {activeTab === tab.id && <motion.div layoutId="detail-tab" className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: "#00D4FF" }} />}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="mt-6">
          {activeTab === "overview" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl">
              <p className="text-base leading-relaxed" style={{ color: "rgba(240,244,255,0.85)" }}>
                {overview || "No overview available."}
              </p>

              {/* Info grid */}
              <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {isAnime && animeStudio && <InfoBlock label="Studio" value={animeStudio} />}
                {isAnime && anime?.format && <InfoBlock label="Format" value={anime.format} />}
                {isAnime && anime?.season && anime?.seasonYear && <InfoBlock label="Season" value={`${anime.season} ${anime.seasonYear}`} />}
                {!isAnime && tmdb?.original_language && <InfoBlock label="Language" value={tmdb.original_language.toUpperCase()} />}
                {!isAnime && tmdb?.status && <InfoBlock label="Status" value={tmdb.status} />}
                {!isAnime && type === "tv" && tmdb?.number_of_episodes && <InfoBlock label="Episodes" value={String(tmdb.number_of_episodes)} />}
                {director && <InfoBlock label="Director" value={director.name} />}
                {!isAnime && tmdb?.imdb_id && <InfoBlock label="IMDb" value={tmdb.imdb_id} />}
                {isAnime && anime?.startDate?.year && <InfoBlock label="Start Year" value={String(anime.startDate.year)} />}
              </div>

              {/* Keywords / Tags */}
              {(keywords.length > 0 || animeTags.length > 0) && (
                <div className="mt-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: "#8899AA" }}>
                    <Tag className="w-3.5 h-3.5" />{isAnime ? "Tags" : "Keywords"}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {(isAnime ? animeTags.map(t => t.name) : keywords.map(k => k.name)).map(kw => (
                      <span key={kw} className="px-2 py-0.5 rounded-full text-xs" style={{ background: "rgba(255,255,255,0.04)", color: "#8899AA", border: "1px solid rgba(255,255,255,0.08)" }}>{kw}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Anime staff */}
              {isAnime && animeStaff.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#8899AA" }}>Staff</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {animeStaff.map(s => (
                      <div key={s.node.id} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: "rgba(11,18,32,0.6)", border: "1px solid rgba(255,255,255,0.05)" }}>
                        <img src={s.node.image.large} alt={s.node.name.full} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate" style={{ color: "#F0F4FF" }}>{s.node.name.full}</p>
                          <p className="text-[10px] truncate" style={{ color: "#8899AA" }}>{s.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Watch Providers full list */}
              {watchProviders && (
                <div className="mt-6 p-4 rounded-xl" style={{ background: "rgba(11,18,32,0.6)", border: "1px solid rgba(0,212,255,0.1)" }}>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: "#8899AA" }}>
                    <Monitor className="w-3.5 h-3.5" />Where to Watch (US)
                  </h3>
                  {watchProviders.flatrate && watchProviders.flatrate.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs mb-2" style={{ color: "#8899AA" }}>Stream</p>
                      <div className="flex flex-wrap gap-2">
                        {watchProviders.flatrate.map(p => (
                          <div key={p.provider_name} className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.12)" }}>
                            <img src={`https://image.tmdb.org/t/p/w45${p.logo_path}`} alt={p.provider_name} className="w-5 h-5 rounded" />
                            <span className="text-xs" style={{ color: "#F0F4FF" }}>{p.provider_name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {watchProviders.rent && watchProviders.rent.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs mb-1.5" style={{ color: "#8899AA" }}>Rent / Buy</p>
                      <div className="flex flex-wrap gap-2">
                        {watchProviders.rent.slice(0, 4).map(p => (
                          <div key={p.provider_name} className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                            <img src={`https://image.tmdb.org/t/p/w45${p.logo_path}`} alt={p.provider_name} className="w-5 h-5 rounded" />
                            <span className="text-xs" style={{ color: "#8899AA" }}>{p.provider_name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "cast" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {!isAnime && cast.map(person => (
                  <div key={person.id} className="text-center">
                    <div className="w-full aspect-square rounded-xl overflow-hidden mb-2" style={{ background: "rgba(11,18,32,0.8)", border: "1px solid rgba(0,212,255,0.08)" }}>
                      {person.profile_path ? (
                        <img src={tmdbImg(person.profile_path, "w185") || ""} alt={person.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Users className="w-8 h-8" style={{ color: "#8899AA" }} /></div>
                      )}
                    </div>
                    <p className="text-xs font-semibold truncate" style={{ color: "#F0F4FF" }}>{person.name}</p>
                    <p className="text-xs truncate" style={{ color: "#8899AA" }}>{person.character}</p>
                  </div>
                ))}
                {isAnime && animeChars.map(edge => (
                  <div key={edge.node.id} className="text-center">
                    <div className="w-full aspect-square rounded-xl overflow-hidden mb-2" style={{ background: "rgba(11,18,32,0.8)", border: "1px solid rgba(139,92,246,0.12)" }}>
                      <img src={edge.node.image.large} alt={edge.node.name.full} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-xs font-semibold truncate" style={{ color: "#F0F4FF" }}>{edge.node.name.full}</p>
                    <p className="text-xs truncate" style={{ color: "#8899AA" }}>{edge.role}</p>
                    {edge.voiceActors?.[0] && (
                      <p className="text-[10px] truncate mt-0.5" style={{ color: "#8B5CF6" }}>VA: {edge.voiceActors[0].name.full}</p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "seasons" && type === "tv" && tmdb?.seasons && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {tmdb.seasons.filter(s => s.season_number > 0).map(season => (
                  <Link key={season.id} href={`/watch/tv/${id}?season=${season.season_number}&episode=1`}>
                    <motion.div className="rounded-xl overflow-hidden cursor-pointer" style={{ background: "rgba(11,18,32,0.8)", border: "1px solid rgba(0,212,255,0.08)" }} whileHover={{ borderColor: "rgba(0,212,255,0.3)", y: -4 }}>
                      <div className="aspect-[2/3] relative">
                        {season.poster_path ? (
                          <img src={tmdbImg(season.poster_path, "w300") || ""} alt={season.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
                            <Tv className="w-8 h-8" style={{ color: "#8899AA" }} />
                          </div>
                        )}
                        <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center" style={{ background: "rgba(0,212,255,0.15)" }}>
                          <Play className="w-8 h-8" style={{ color: "#00D4FF" }} />
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="font-semibold text-sm truncate" style={{ color: "#F0F4FF" }}>{season.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#8899AA" }}>{season.episode_count} episodes</p>
                        {season.air_date && <p className="text-xs" style={{ color: "#8899AA" }}>{season.air_date.substring(0, 4)}</p>}
                        {season.overview && <p className="text-[10px] mt-1 line-clamp-2" style={{ color: "#8899AA" }}>{season.overview}</p>}
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "seasons" && isAnime && animeArcs.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="space-y-3">
                {animeArcs.map((arc) => (
                  <Link key={arc.node.id} href={`/detail/anime/${arc.node.id}`}>
                    <motion.div className="flex gap-4 p-4 rounded-xl cursor-pointer" style={{ background: "rgba(11,18,32,0.8)", border: "1px solid rgba(139,92,246,0.12)" }} whileHover={{ borderColor: "rgba(139,92,246,0.3)", x: 4 }}>
                      <div className="w-24 h-32 rounded-lg flex-shrink-0 overflow-hidden" style={{ background: "rgba(0,0,0,0.4)" }}>
                        <img src={arc.node.coverImage.large} alt={arc.node.title.english || arc.node.title.romaji} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#8B5CF6" }}>{arc.relationType === "SEQUEL" ? "Sequel" : arc.relationType === "PREQUEL" ? "Prequel" : arc.relationType === "SIDE_STORY" ? "Side Story" : "Alternative"}</p>
                            <h4 className="text-sm font-bold mt-1" style={{ color: "#F0F4FF" }}>{arc.node.title.english || arc.node.title.romaji}</h4>
                          </div>
                          <ChevronRight className="w-5 h-5 flex-shrink-0 mt-1" style={{ color: "#8899AA" }} />
                        </div>
                        <p className="text-xs" style={{ color: "#8899AA" }}>{arc.node.format}{arc.node.episodes ? ` • ${arc.node.episodes} episodes` : ""}</p>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "related" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {(recommendations.length > 0 || similar.length > 0) && (
                <div className="mb-8">
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "#8899AA" }}>Recommended For You</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {(recommendations.length > 0 ? recommendations : similar).slice(0, 12).map(item => (
                      <Link key={item.id} href={`/detail/${type}/${item.id}`}>
                        <motion.div className="rounded-xl overflow-hidden cursor-pointer" style={{ border: "1px solid rgba(255,255,255,0.06)" }} whileHover={{ scale: 1.04, borderColor: "rgba(0,212,255,0.3)" }}>
                          <div className="aspect-[2/3] relative">
                            {item.poster_path ? (
                              <img src={tmdbImg(item.poster_path, "w300") || ""} alt={getMediaTitle(item)} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center" style={{ background: "rgba(11,18,32,0.8)" }}>
                                <Film className="w-6 h-6" style={{ color: "#8899AA" }} />
                              </div>
                            )}
                          </div>
                          <div className="p-2" style={{ background: "rgba(11,18,32,0.8)" }}>
                            <p className="text-xs font-semibold truncate" style={{ color: "#F0F4FF" }}>{getMediaTitle(item)}</p>
                            {item.vote_average > 0 && <p className="text-[10px] flex items-center gap-0.5 mt-0.5" style={{ color: "#FFD700" }}><Star className="w-2.5 h-2.5" />{item.vote_average.toFixed(1)}</p>}
                          </div>
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {similar.length > 0 && recommendations.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "#8899AA" }}>More Like This</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {similar.slice(0, 6).map(item => (
                      <Link key={item.id} href={`/detail/${type}/${item.id}`}>
                        <motion.div className="rounded-xl overflow-hidden cursor-pointer" style={{ border: "1px solid rgba(255,255,255,0.06)" }} whileHover={{ scale: 1.04 }}>
                          <div className="aspect-[2/3]">
                            {item.poster_path ? <img src={tmdbImg(item.poster_path, "w300") || ""} alt={getMediaTitle(item)} className="w-full h-full object-cover" /> : <div className="w-full h-full" style={{ background: "rgba(11,18,32,0.8)" }} />}
                          </div>
                          <div className="p-2" style={{ background: "rgba(11,18,32,0.8)" }}>
                            <p className="text-xs font-semibold truncate" style={{ color: "#F0F4FF" }}>{getMediaTitle(item)}</p>
                          </div>
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {isAnime && (animeRecs.length > 0 || animeRelated.length > 0) && (
                <div>
                  {animeRecs.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "#8899AA" }}>Recommended</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {(animeRecs as any[]).slice(0, 10).map((r: any) => (
                          <Link key={r.id} href={`/detail/anime/${r.id}`}>
                            <motion.div className="rounded-xl overflow-hidden cursor-pointer" style={{ border: "1px solid rgba(139,92,246,0.15)" }} whileHover={{ scale: 1.04 }}>
                              <div className="aspect-[2/3]"><img src={r.coverImage.large} alt={r.title.english || r.title.romaji} className="w-full h-full object-cover" /></div>
                              <div className="p-2" style={{ background: "rgba(11,18,32,0.8)" }}>
                                <p className="text-xs font-semibold truncate" style={{ color: "#F0F4FF" }}>{r.title.english || r.title.romaji}</p>
                                {r.averageScore && <p className="text-[10px] flex items-center gap-0.5 mt-0.5" style={{ color: "#FFD700" }}><Star className="w-2.5 h-2.5" />{(r.averageScore / 10).toFixed(1)}</p>}
                              </div>
                            </motion.div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  {animeRelated.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "#8899AA" }}>Related Series</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {animeRelated.map(edge => (
                          <Link key={edge.node.id} href={`/detail/anime/${edge.node.id}`}>
                            <motion.div className="rounded-xl overflow-hidden cursor-pointer" style={{ border: "1px solid rgba(139,92,246,0.1)" }} whileHover={{ borderColor: "rgba(139,92,246,0.4)", y: -2 }}>
                              <img src={edge.node.coverImage.large} alt={edge.node.title.english || edge.node.title.romaji} className="w-full aspect-[3/4] object-cover" />
                              <div className="p-2">
                                <p className="text-xs font-semibold truncate" style={{ color: "#F0F4FF" }}>{edge.node.title.english || edge.node.title.romaji}</p>
                                <p className="text-xs" style={{ color: "#8B5CF6" }}>{edge.relationType}</p>
                              </div>
                            </motion.div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "media" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {videos.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "#8899AA" }}>Videos</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {videos.map(v => (
                      <a key={v.id} href={`https://www.youtube.com/watch?v=${v.key}`} target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden relative group" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                        <img src={`https://img.youtube.com/vi/${v.key}/hqdefault.jpg`} alt={v.name} className="w-full aspect-video object-cover group-hover:opacity-70 transition-opacity" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(255,45,85,0.8)" }}>
                            <Play className="w-5 h-5 fill-current text-white ml-1" />
                          </div>
                        </div>
                        <div className="p-2" style={{ background: "rgba(11,18,32,0.9)" }}>
                          <p className="text-xs font-semibold truncate" style={{ color: "#F0F4FF" }}>{v.name}</p>
                          <p className="text-[10px]" style={{ color: "#8899AA" }}>{v.type}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {backdrops.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: "#8899AA" }}>Images</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {backdrops.map((b, i) => (
                      <motion.div key={i} className="rounded-xl overflow-hidden cursor-pointer aspect-video" onClick={() => { setGalleryIdx(i); setGalleryOpen(true); }} whileHover={{ scale: 1.02 }}>
                        <img src={tmdbImg(b.file_path, "w780") || ""} alt={`Backdrop ${i+1}`} className="w-full h-full object-cover" />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Trailer Modal */}
      {trailerOpen && trailerKey && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: "rgba(5,8,22,0.95)", backdropFilter: "blur(16px)" }} onClick={() => setTrailerOpen(false)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(0,212,255,0.2)" }} onClick={e => e.stopPropagation()}>
            <iframe src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`} className="w-full h-full" allow="autoplay; fullscreen" allowFullScreen />
          </motion.div>
          <button className="absolute top-4 right-4 text-white" onClick={() => setTrailerOpen(false)}><X className="w-6 h-6" /></button>
        </div>
      )}

      {/* Gallery Modal */}
      {galleryOpen && backdrops.length > 0 && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: "rgba(5,8,22,0.97)" }} onClick={() => setGalleryOpen(false)}>
          <button className="absolute top-4 right-4 text-white z-10" onClick={() => setGalleryOpen(false)}><X className="w-6 h-6" /></button>
          <button className="absolute left-4 text-white z-10" onClick={e => { e.stopPropagation(); setGalleryIdx(i => Math.max(0, i-1)); }}><ChevronLeft className="w-8 h-8" /></button>
          <button className="absolute right-4 text-white z-10" onClick={e => { e.stopPropagation(); setGalleryIdx(i => Math.min(backdrops.length-1, i+1)); }}><ChevronRight className="w-8 h-8" /></button>
          <motion.img key={galleryIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} src={tmdbImg(backdrops[galleryIdx]?.file_path, "original") || ""} alt="" className="max-w-[90vw] max-h-[80vh] object-contain rounded-xl" onClick={e => e.stopPropagation()} />
          <p className="absolute bottom-4 text-xs" style={{ color: "#8899AA" }}>{galleryIdx + 1} / {backdrops.length}</p>
        </div>
      )}

      <Footer />
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl" style={{ background: "rgba(11,18,32,0.6)", border: "1px solid rgba(0,212,255,0.08)" }}>
      <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#8899AA" }}>{label}</p>
      <p className="text-sm font-semibold" style={{ color: "#F0F4FF" }}>{value}</p>
    </div>
  );
}
