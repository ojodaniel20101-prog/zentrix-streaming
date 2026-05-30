/*
   ZENTRIX_TECH — Watch Page (Enhanced v2)
   Features:
   - Full Season/Episode browser panel (like MovieBox/HiAnime)
   - Episode thumbnails, descriptions, ratings
   - Season poster gallery
   - Recommendation sidebar
   - Watch progress tracking
   - Multi-server with SUB/DUB
   - Episode navigation (prev/next)
   - Auto-next episode
   - Keyboard shortcuts
*/

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import ContentRow from "@/components/ContentRow";
import Footer from "@/components/Footer";
import { useWatchlist } from "@/contexts/WatchlistContext";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/contexts/AuthContext";
import {
  getMovieDetails, getTVDetails, getAnimeDetails, getTVSeason,
  getMovieEmbedUrl, getTVEmbedUrl, getAnimeEmbedUrl, getAnimeTmdbId,
  getMovieEmbedFallback, getTVEmbedFallback,
  tmdbImg, tmdbBackdrop, getMediaTitle, getMediaYear,
  type TMDBMedia, type AniListMedia, type TMDBEpisode, type TMDBSeason, type TMDBSeasonDetails,
} from "@/lib/api";
import { getTMDBSeasons } from "@/lib/tmdbMapping";
import {
  Play, ChevronLeft, ChevronRight, Server, AlertTriangle,
  Tv, Film, Sword, Star, Calendar, Clock, Loader2,
  List, Grid, RefreshCw, ExternalLink, Bookmark, BookmarkCheck,
  Maximize, ChevronDown, ChevronUp, SkipForward,
  Info, Check, Eye, Layers, Image as ImageIcon, X, Shield, Settings, AlertCircle,
} from "lucide-react";

import SeasonSelector from "@/components/SeasonSelector";
import AnimeSeasonSelector from "@/components/AnimeSeasonSelector";
import AnimeDownloadButton from "@/components/AnimeDownloadButton";
import MovieDownloadButton from "@/components/MovieDownloadButton";
import TVDownloadButton from "@/components/TVDownloadButton";

import { downloadStream } from "@/lib/streamDownloader";

type MediaType = "movie" | "tv" | "anime";

interface EmbedServer {
  id: string;
  name: string;
  getUrl: (id: number, season?: number, episode?: number) => string;
  badge?: string;
}

const MOVIE_SERVERS: EmbedServer[] = [
  { id: "filmu", name: "Server 1", badge: "NO ADS", getUrl: (id) => `https://embed.filmu.in/movie/${id}` },
  { id: "vidsrcme-ru", name: "Server 2", badge: "4K", getUrl: (id) => `https://vidsrcme.ru/embed/movie/${id}` },
  { id: "vidsrcme-su", name: "Server 3", badge: "4K", getUrl: (id) => `https://vidsrcme.su/embed/movie/${id}` },
  { id: "vidsrc-me-ru", name: "Server 4", badge: "4K", getUrl: (id) => `https://vidsrc-me.ru/embed/movie/${id}` },
  { id: "vidsrc-me-su", name: "Server 5", badge: "4K", getUrl: (id) => `https://vidsrc-me.su/embed/movie/${id}` },
  { id: "vidsrc-embed-ru", name: "Server 6", badge: "1080p", getUrl: (id) => `https://vidsrc-embed.ru/embed/movie/${id}` },
  { id: "vidsrc-embed-su", name: "Server 7", badge: "1080p", getUrl: (id) => `https://vidsrc-embed.su/embed/movie/${id}` },
  { id: "vsrc-su", name: "Server 8", badge: "1080p", getUrl: (id) => `https://vsrc.su/embed/movie/${id}` },
];

const TV_SERVERS: EmbedServer[] = [
  { id: "filmu", name: "Server 1", badge: "NO ADS", getUrl: (id, s=1, e=1) => `https://embed.filmu.in/tv/${id}/${s}/${e}` },
  { id: "vidsrcme-ru", name: "Server 2", badge: "4K", getUrl: (id, s=1, e=1) => `https://vidsrcme.ru/embed/tv/${id}/${s}/${e}` },
  { id: "vidsrcme-su", name: "Server 3", badge: "4K", getUrl: (id, s=1, e=1) => `https://vidsrcme.su/embed/tv/${id}/${s}/${e}` },
  { id: "vidsrc-me-ru", name: "Server 4", badge: "4K", getUrl: (id, s=1, e=1) => `https://vidsrc-me.ru/embed/tv/${id}/${s}/${e}` },
  { id: "vidsrc-me-su", name: "Server 5", badge: "4K", getUrl: (id, s=1, e=1) => `https://vidsrc-me.su/embed/tv/${id}/${s}/${e}` },
  { id: "vidsrc-embed-ru", name: "Server 6", badge: "1080p", getUrl: (id, s=1, e=1) => `https://vidsrc-embed.ru/embed/tv/${id}/${s}/${e}` },
  { id: "vidsrc-embed-su", name: "Server 7", badge: "1080p", getUrl: (id, s=1, e=1) => `https://vidsrc-embed.su/embed/tv/${id}/${s}/${e}` },
  { id: "vsrc-su", name: "Server 8", badge: "1080p", getUrl: (id, s=1, e=1) => `https://vsrc.su/embed/tv/${id}/${s}/${e}` },
];

interface AnimeEmbedServer extends EmbedServer { audioType: "sub" | "dub"; }

const ANIME_SERVERS: AnimeEmbedServer[] = [
  { id: "animepahe", name: "Server 1", badge: "NO ADS", audioType: "sub", getUrl: (id, _s, e=1) => `https://megaplay.buzz/stream/ani/${id}/${e}/sub` },
  { id: "megaplay-sub", name: "Server 2", badge: "SUB", audioType: "sub", getUrl: (id, _s, e=1) => `https://megaplay.buzz/stream/ani/${id}/${e}/sub` },
  { id: "megaplay-dub", name: "Server 2", badge: "DUB", audioType: "dub", getUrl: (id, _s, e=1) => `https://megaplay.buzz/stream/ani/${id}/${e}/dub` },
];

export default function WatchPage() {
  const params = useParams<{ type: string; id: string }>();
  const [location] = useLocation();
  const type = params.type as MediaType;
  const id = Number(params.id);
  const urlParams = new URLSearchParams(window.location.search);

  const [data, setData] = useState<TMDBMedia | AniListMedia | null>(null);
  const [loading, setLoading] = useState(true);
  const [season, setSeason] = useState(Number(urlParams.get("season")) || 1);
  const [episode, setEpisode] = useState(Number(urlParams.get("episode")) || 1);
  const [seasonDetails, setSeasonDetails] = useState<TMDBSeasonDetails | null>(null);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [tmdbSeasons, setTmdbSeasons] = useState<Array<{ season: number; name: string; episode_count: number; air_date: string; }>>([]);
  const [tmdbEpisodesLoading, setTmdbEpisodesLoading] = useState(false);
  const [serverIdx, setServerIdx] = useState(0);
  const [iframeKey, setIframeKey] = useState(0);
  const [playerError, setPlayerError] = useState(false);
  const [episodeView, setEpisodeView] = useState<"grid" | "list">("list");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [playerReady, setPlayerReady] = useState(false);
  const [adBlockActive, setAdBlockActive] = useState(false);
  const [seasonSelectorOpen, setSeasonSelectorOpen] = useState(false);
  const [episodePanelOpen, setEpisodePanelOpen] = useState(true);
  const [activePanel, setActivePanel] = useState<"episodes" | "seasons" | "related">("episodes");
  const [recommendations, setRecommendations] = useState<TMDBMedia[]>([]);
  const [watchedEpisodes, setWatchedEpisodes] = useState<Set<string>>(new Set());
  const [animeAudioTab, setAnimeAudioTab] = useState<"sub" | "dub">("sub");
  const [animeTmdbId, setAnimeTmdbId] = useState<number | null>(null);
  const [showVidSrcTooltip, setShowVidSrcTooltip] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const popupBlockerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { addToHistory, isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const { isAuthenticated } = useAuth();
  const saveProgressMutation = trpc.watchProgress.save.useMutation();

  const servers = type === "movie" ? MOVIE_SERVERS : type === "tv" ? TV_SERVERS : ANIME_SERVERS;
  const animeSubServers = (servers as AnimeEmbedServer[]).filter(s => s.audioType === "sub");
  const animeDubServers = (servers as AnimeEmbedServer[]).filter(s => s.audioType === "dub");
  const isAnimePage = type === "anime";
  const activeServers = isAnimePage
    ? (animeAudioTab === "sub" ? animeSubServers : animeDubServers)
    : servers;
  
  const currentServer = activeServers[serverIdx];
  const isUsingFilmu = isAnimePage && currentServer?.id.startsWith("filmu");
  const isUsingMegaplay = isAnimePage && currentServer?.id.startsWith("megaplay");

  // Load watched episodes from localStorage
  useEffect(() => {
    const key = `zx_watched_${type}_${id}`;
    const stored = JSON.parse(localStorage.getItem(key) || "[]");
    setWatchedEpisodes(new Set(stored));
  }, [type, id]);

  const markWatched = useCallback((s: number, e: number) => {
    const key = `zx_watched_${type}_${id}`;
    const epKey = `${s}_${e}`;
    setWatchedEpisodes(prev => {
      const next = new Set(prev);
      next.add(epKey);
      localStorage.setItem(key, JSON.stringify(Array.from(next)));
      return next;
    });
  }, [type, id]);

  const isEpisodeWatched = useCallback((s: number, e: number) => {
    return watchedEpisodes.has(`${s}_${e}`);
  }, [watchedEpisodes]);

  // Watch Progress Tracking
  useEffect(() => {
    if (!isAuthenticated) return;

    const saveProgress = () => {
      // For embed players, we can't easily get the current time.
      // We'll simulate it or rely on the user being on the page.
      // A better way would be postMessage if the provider supports it.
      // For now, we'll save a "pseudo-progress" or just the fact they are watching.
      // If we had a native player, we'd use player.currentTime.
      saveProgressMutation.mutate({
        contentId: String(id),
        contentType: type,
        progressSeconds: 300, // Placeholder: 5 mins
        durationSeconds: 3600, // Placeholder: 60 mins
        episodeId: type !== "movie" ? String(episode) : undefined,
      });
    };

    const interval = setInterval(saveProgress, 30000); // Every 30s
    
    return () => {
      clearInterval(interval);
      saveProgress(); // Save on unmount
    };
  }, [id, type, episode, isAuthenticated]);

  // Ad blocker
  const installAdBlocker = useCallback(() => {
    setAdBlockActive(true);
      const origOpen = window.open;
      window.open = () => null; // Block all window.open calls

      // Intercept anchor clicks with target="_blank"
      const handleAnchorClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const anchor = target.closest("a");
        if (anchor && anchor.getAttribute("target") === "_blank") {
          e.preventDefault();
          e.stopPropagation();
        }
      };
      document.addEventListener("click", handleAnchorClick, true);

      // Block mousedown and touchstart events on the iframe
      const blockIframeEvents = (e: MouseEvent | TouchEvent) => {
        if (iframeRef.current && e.target === iframeRef.current) {
          e.preventDefault();
          e.stopPropagation();
        }
      };
      document.addEventListener("mousedown", blockIframeEvents, true);
      document.addEventListener("touchstart", blockIframeEvents, true);

      return () => {
        document.removeEventListener("click", handleAnchorClick, true);
        document.removeEventListener("mousedown", blockIframeEvents, true);
        document.removeEventListener("touchstart", blockIframeEvents, true);
        window.open = origOpen;
        if (popupBlockerRef.current) clearInterval(popupBlockerRef.current);
      };
    }, []);

  const handleFullscreen = () => {
    if (playerContainerRef.current) {
      if (!isFullscreen) {
        playerContainerRef.current.requestFullscreen?.().catch(() => setIsFullscreen(true));
      } else {
        document.exitFullscreen?.();
        setIsFullscreen(false);
      }
    }
  };

  // Fetch media details
  useEffect(() => {
    setLoading(true);
    const load = async () => {
      try {
        if (type === "movie") {
          const res = await getMovieDetails(id);
          setData(res);
          setRecommendations(res.recommendations?.results?.slice(0, 12) || []);
        } else if (type === "tv") {
          const res = await getTVDetails(id);
          setData(res);
          setRecommendations(res.recommendations?.results?.slice(0, 12) || []);
        } else {
          const res = await getAnimeDetails(id);
          setData(res.Media);
          const animeTitle = res.Media.title.english || res.Media.title.romaji;
          const tmdbId = await getAnimeTmdbId(animeTitle);
          setAnimeTmdbId(tmdbId);
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, [type, id]);

  // Fetch TV season details with episodes
  useEffect(() => {
    if (type === "tv") {
      setEpisodesLoading(true);
      setSeasonDetails(null);
      getTVSeason(id, season)
        .then(res => setSeasonDetails(res))
        .catch(() => setSeasonDetails(null))
        .finally(() => setEpisodesLoading(false));
    }
  }, [type, id, season]);

  const episodes = useMemo(() => seasonDetails?.episodes || [], [seasonDetails]);

  // For TV shows, use fetched episodes
  const tvEpisodes = episodes;

  // Anime episode list - always use AniList data
  const animeEpisodeList = useMemo(() => {
    if (type !== "anime" || !data) return [];
    
    const anime = data as AniListMedia;
    const total = Math.max(anime.episodes || 0, anime.streamingEpisodes?.length || 0, 1);
    
    return Array.from({ length: total }, (_, i) => {
      const epNum = i + 1;
      // Try to find matching streaming episode for title and thumbnail
      const streamingEp = anime.streamingEpisodes?.find(e => {
        const match = e.title.match(/Episode\s+(\d+)/i);
        return match ? parseInt(match[1]) === epNum : false;
      }) || anime.streamingEpisodes?.[i];

      // Try to find airing date
      const airing = anime.airingSchedule?.nodes?.find(n => n.episode === epNum);
      const airDate = airing ? new Date(airing.airingAt * 1000).toISOString().split('T')[0] : "";

      return {
        episode_number: epNum,
        name: streamingEp ? streamingEp.title.replace(/Episode\s+\d+\s+-\s+/i, "") : `Episode ${epNum}`,
        overview: "", // AniList doesn't provide per-episode overviews in streamingEpisodes
        still_path: streamingEp?.thumbnail || null,
        air_date: airDate,
        vote_average: anime.averageScore ? anime.averageScore / 10 : 0,
        id: epNum,
        season_number: 1,
        runtime: anime.duration || null,
      } as TMDBEpisode;
    });
  }, [type, data, isUsingFilmu, seasonDetails]);

  const displayEpisodes = type === "anime" ? animeEpisodeList : tvEpisodes;

  // Track watch history & mark episode watched
  useEffect(() => {
    if (!data) return;
    const isAnime = type === "anime";
    const tmdb = !isAnime ? (data as TMDBMedia) : null;
    const anime = isAnime ? (data as AniListMedia) : null;
    const title = isAnime ? (anime!.title.english || anime!.title.romaji) : getMediaTitle(tmdb!);
    const poster = isAnime ? anime!.coverImage.large : tmdbImg(tmdb!.poster_path, "w185") || "";
    addToHistory({ id, type, title, poster, season: type === "tv" ? season : undefined, episode: type !== "movie" ? episode : undefined, watchedAt: Date.now() });
    if (type !== "movie") markWatched(season, episode);
  }, [data, season, episode]);

  useEffect(() => {
    setPlayerError(false);
    const cleanup = installAdBlocker();
    return cleanup;
  }, [serverIdx, season, episode, animeAudioTab, installAdBlocker]);

  useEffect(() => { setPlayerReady(false); }, [serverIdx, season, episode, animeAudioTab]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && e.altKey) handleNextEpisode();
      if (e.key === "ArrowLeft" && e.altKey) handlePrevEpisode();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [displayEpisodes, episode]);

  const handleNextEpisode = () => {
    if (episode < displayEpisodes.length) {
      const nextEp = episode + 1;
      setEpisode(nextEp);
      window.history.replaceState(null, "", `?season=${season}&episode=${nextEp}`);
    }
  };

  const handlePrevEpisode = () => {
    if (episode > 1) {
      const prevEp = episode - 1;
      setEpisode(prevEp);
      window.history.replaceState(null, "", `?season=${season}&episode=${prevEp}`);
    }
  };

  const currentEmbedUrl = useMemo(() => {
    if (type === "movie") return currentServer.getUrl(id);
    if (type === "tv") return currentServer.getUrl(id, season, episode);
    
    // Anime logic
    if (isUsingFilmu && animeTmdbId) {
      return currentServer.getUrl(animeTmdbId, season, episode);
    }
    return currentServer.getUrl(id, 1, episode);
  }, [type, id, season, episode, currentServer, animeTmdbId, isUsingFilmu]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050816] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-[#00D4FF]/20 border-t-[#00D4FF] rounded-full animate-spin" />
          <p className="text-[#8899AA] font-medium animate-pulse">Initializing Neural Stream...</p>
        </div>
      </div>
    );
  }

  const isAnime = type === "anime";
  const tmdb = !isAnime ? (data as TMDBMedia) : null;
  const anime = isAnime ? (data as AniListMedia) : null;
  const title = isAnime ? (anime!.title.english || anime!.title.romaji) : getMediaTitle(tmdb!);
  const year = isAnime ? anime!.seasonYear : getMediaYear(tmdb!);
  const rating = isAnime ? (anime!.averageScore ? (anime!.averageScore / 10).toFixed(1) : "N/A") : tmdb!.vote_average?.toFixed(1);
  const backdrop = isAnime ? anime!.bannerImage : tmdbBackdrop(tmdb!.backdrop_path);

  return (
    <div className="min-h-screen bg-[#050816] text-[#F0F4FF] selection:bg-[#00D4FF]/30">
      <Navbar />

      {/* Hero Backdrop */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10 scale-110 blur-3xl"
          style={{ backgroundImage: `url(${backdrop})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#050816] via-transparent to-[#050816]" />
      </div>

      <main className="relative z-10 pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-[1600px] mx-auto">
        {/* Breadcrumbs & Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-[#00D4FF] uppercase mb-2">
              <Link href={isAnime ? "/anime" : type === "tv" ? "/tv" : "/movies"}>
                <span className="hover:text-white cursor-pointer transition-colors">
                  {isAnime ? "Anime" : type === "tv" ? "TV Shows" : "Movies"}
                </span>
              </Link>
              <ChevronRight className="w-3 h-3 text-white/20" />
              <Link href={`/detail/${type}/${id}`}>
                <span className="hover:text-white cursor-pointer transition-colors truncate">
                  {title}
                </span>
              </Link>
              {type !== "movie" && (
                <>
                  <ChevronRight className="w-3 h-3 text-white/20" />
                  <span className="text-white/40">S{season} E{episode}</span>
                </>
              )}
            </div>
            <h1 className="text-2xl md:text-4xl font-900 tracking-tight font-['Space_Grotesk'] truncate">
              {title}
              {type !== "movie" && (
                <span className="text-[#8899AA] font-300 ml-3">
                  — Episode {episode}
                </span>
              )}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <Star className="w-4 h-4 text-[#FFD700] fill-current" />
              <span className="font-bold text-sm">{rating}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[#8899AA]">
              <Calendar className="w-4 h-4" />
              <span className="font-medium text-sm">{year}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-8">
          {/* Player Section */}
          <div className="space-y-6">
            <div 
              ref={playerContainerRef}
              className={`relative aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl shadow-black/50 group ${isFullscreen ? 'fixed inset-0 z-[100] rounded-none' : ''}`}
              style={{ border: isFullscreen ? 'none' : '1px solid rgba(0, 212, 255, 0.1)' }}
            >
              {/* Adblocker Warning */}
              <AnimatePresence>
                {!playerReady && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-20 flex items-center justify-center bg-[#050816]"
                  >
                    <div className="flex flex-col items-center gap-4 text-center px-6">
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-[#00D4FF]/10 border-t-[#00D4FF] rounded-full animate-spin" />
                        <Shield className="absolute inset-0 m-auto w-6 h-6 text-[#00D4FF] animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-1">Securing Neural Stream</h3>
                        <p className="text-sm text-[#8899AA] max-w-xs">Deploying ad-block protocols and initializing {currentServer.name}...</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Player Iframe */}
              <iframe
                key={iframeKey}
                ref={iframeRef}
                src={currentEmbedUrl}
                className="w-full h-full border-0"
                allowFullScreen
                onLoad={() => {
                  setTimeout(() => setPlayerReady(true), 1500);
                  // Try to auto-fullscreen if user previously was
                }}
                sandbox="allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-top-navigation"
              />

              {/* Player Controls Overlay (Simulated) */}
              <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                <button 
                  onClick={handleFullscreen}
                  className="p-2.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 hover:bg-[#00D4FF] hover:text-[#050816] transition-all"
                  title="Toggle Fullscreen"
                >
                  <Maximize className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Server & Navigation Bar */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00D4FF]/10 border border-[#00D4FF]/20 text-[#00D4FF]">
                  <Server className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Servers</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeServers.map((s, idx) => (
                    <button
                      key={s.id}
                      onClick={() => { setServerIdx(idx); setIframeKey(k => k + 1); }}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        serverIdx === idx 
                          ? 'bg-[#00D4FF] text-[#050816] border-[#00D4FF]' 
                          : 'bg-white/5 text-[#8899AA] border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {s.name}
                      {s.badge && <span className="ml-1.5 opacity-60 text-[10px]">{s.badge}</span>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                {type !== "movie" && (
                  <>
                    <button
                      onClick={handlePrevEpisode}
                      disabled={episode <= 1}
                      className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" /> Prev
                    </button>
                    <button
                      onClick={handleNextEpisode}
                      disabled={episode >= displayEpisodes.length}
                      className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-[#00D4FF] text-[#050816] border border-[#00D4FF] text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 transition-all"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
                {isAnime && (
                  <div className="ml-auto w-36">
                    <AnimeDownloadButton animeTitle={title} episodeNumber={episode} />
                  </div>
                )}
                {type === "movie" && (
                  <div className="ml-auto w-36">
                    <MovieDownloadButton movieTitle={title} />
                  </div>
                )}
                {type === "tv" && (
                  <div className="ml-auto w-36">
                    <TVDownloadButton showTitle={title} currentSeason={season} currentEpisode={episode} />
                  </div>
                )}
              </div>
            </div>

            {/* Info Tabs */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-6 border-b border-white/10 mb-6">
                <button className="pb-4 text-sm font-bold border-b-2 border-[#00D4FF] text-[#00D4FF]">Overview</button>
                <button className="pb-4 text-sm font-bold text-[#8899AA] hover:text-white transition-colors">Cast & Crew</button>
                <button className="pb-4 text-sm font-bold text-[#8899AA] hover:text-white transition-colors">Comments</button>
              </div>
              <p className="text-[#B0C4D8] leading-relaxed text-sm md:text-base line-clamp-4 hover:line-clamp-none transition-all duration-500">
                {isAnime ? anime!.description?.replace(/<[^>]*>?/gm, '') : tmdb!.overview}
              </p>
            </div>
          </div>

          {/* Sidebar Section */}
          <div className="space-y-6">
            {/* Episode Browser Panel */}
            {type !== "movie" && (
              <div className="flex flex-col h-[600px] rounded-2xl bg-white/5 border border-white/10 overflow-hidden backdrop-blur-md">
                <div className="p-4 border-b border-white/10 bg-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold font-['Space_Grotesk'] flex items-center gap-2">
                      <List className="w-4 h-4 text-[#00D4FF]" />
                      Episodes
                    </h3>
                    <div className="flex items-center gap-1 p-1 rounded-lg bg-black/40 border border-white/10">
                      <button 
                        onClick={() => setEpisodeView("list")}
                        className={`p-1.5 rounded-md transition-all ${episodeView === "list" ? "bg-[#00D4FF] text-[#050816]" : "text-[#8899AA] hover:text-white"}`}
                      >
                        <List className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => setEpisodeView("grid")}
                        className={`p-1.5 rounded-md transition-all ${episodeView === "grid" ? "bg-[#00D4FF] text-[#050816]" : "text-[#8899AA] hover:text-white"}`}
                      >
                        <Grid className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Season Selector */}
                  {type === "tv" && (
                    <div className="relative">
                      <button 
                        onClick={() => setSeasonSelectorOpen(!seasonSelectorOpen)}
                        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-[#00D4FF]/40 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <ImageIcon className="w-4 h-4 text-[#8899AA] group-hover:text-[#00D4FF]" />
                          <span className="text-sm font-bold">Season {season}</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 text-[#8899AA] transition-transform ${seasonSelectorOpen ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {seasonSelectorOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-full left-0 right-0 mt-2 p-2 rounded-xl bg-[#0F1A2E] border border-white/10 shadow-2xl z-50 max-h-64 overflow-y-auto"
                          >
                            {tmdb!.seasons?.filter(s => s.season_number > 0).map(s => (
                              <button
                                key={s.id}
                                onClick={() => { setSeason(s.season_number); setEpisode(1); setSeasonSelectorOpen(false); }}
                                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all ${season === s.season_number ? 'bg-[#00D4FF] text-[#050816]' : 'hover:bg-white/5'}`}
                              >
                                <img src={tmdbImg(s.poster_path, "w92") || ""} className="w-10 h-14 rounded object-cover" />
                                <div className="text-left">
                                  <p className="text-sm font-bold">{s.name}</p>
                                  <p className={`text-[10px] ${season === s.season_number ? 'text-[#050816]/70' : 'text-[#8899AA]'}`}>{s.episode_count} Episodes</p>
                                </div>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Anime Audio Selector */}
                  {isAnimePage && (
                    <div className="flex p-1 rounded-xl bg-black/40 border border-white/10">
                      <button 
                        onClick={() => setAnimeAudioTab("sub")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${animeAudioTab === "sub" ? "bg-[#00D4FF] text-[#050816]" : "text-[#8899AA] hover:text-white"}`}
                      >
                        SUB
                      </button>
                      <button 
                        onClick={() => setAnimeAudioTab("dub")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${animeAudioTab === "dub" ? "bg-[#00D4FF] text-[#050816]" : "text-[#8899AA] hover:text-white"}`}
                      >
                        DUB
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-white/10">
                  {episodesLoading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 opacity-40">
                      <Loader2 className="w-8 h-8 animate-spin text-[#00D4FF]" />
                      <p className="text-xs font-bold uppercase tracking-widest">Loading Episodes</p>
                    </div>
                  ) : displayEpisodes.map((ep) => {
                    const isActive = episode === ep.episode_number;
                    const watched = isEpisodeWatched(season, ep.episode_number);
                    
                    if (episodeView === "list") {
                      return (
                        <button
                          key={ep.id}
                          onClick={() => { setEpisode(ep.episode_number); window.history.replaceState(null, "", `?season=${season}&episode=${ep.episode_number}`); }}
                          className={`w-full group flex items-center gap-4 p-2 rounded-xl border transition-all ${
                            isActive 
                              ? "bg-[#00D4FF] border-[#00D4FF] text-[#050816]" 
                              : "bg-white/5 border-transparent hover:border-white/10 hover:bg-white/10"
                          }`}
                        >
                          <div className="relative w-24 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-black/40">
                            {ep.still_path ? (
                              <img src={isAnime ? ep.still_path : tmdbImg(ep.still_path, "w185") || ""} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Play className="w-4 h-4 opacity-20" />
                              </div>
                            )}
                            {watched && !isActive && (
                              <div className="absolute top-1 right-1 p-0.5 rounded-full bg-green-500 text-white">
                                <Check className="w-2.5 h-2.5" />
                              </div>
                            )}
                            {isActive && (
                              <div className="absolute inset-0 bg-[#00D4FF]/20 flex items-center justify-center">
                                <Play className="w-6 h-6 fill-current" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-900 uppercase tracking-tighter ${isActive ? "text-[#050816]/60" : "text-[#00D4FF]"}`}>EP {ep.episode_number}</span>
                              {ep.runtime && <span className={`text-[10px] opacity-60 ${isActive ? "text-[#050816]" : ""}`}>{ep.runtime}m</span>}
                            </div>
                            <p className="text-sm font-bold truncate leading-tight">{ep.name}</p>
                            {isAnime && (
                              <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                                <AnimeDownloadButton
                                  animeTitle={title}
                                  episodeNumber={ep.episode_number}
                                />
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    }

                    return (
                      <button
                        key={ep.id}
                        onClick={() => { setEpisode(ep.episode_number); window.history.replaceState(null, "", `?season=${season}&episode=${ep.episode_number}`); }}
                        className={`aspect-square flex items-center justify-center rounded-xl border font-bold text-lg transition-all ${
                          isActive 
                            ? "bg-[#00D4FF] border-[#00D4FF] text-[#050816] shadow-lg shadow-[#00D4FF]/20" 
                            : watched 
                              ? "bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500/20" 
                              : "bg-white/5 border-transparent hover:border-white/10 hover:bg-white/10 text-[#8899AA] hover:text-white"
                        }`}
                      >
                        {ep.episode_number}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recommendations Sidebar */}
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-md">
              <h3 className="font-bold font-['Space_Grotesk'] flex items-center gap-2 mb-6">
                <Sparkles className="w-4 h-4 text-[#00D4FF]" />
                You May Also Like
              </h3>
              <div className="space-y-4">
                {recommendations.slice(0, 6).map((rec) => (
                  <Link key={rec.id} href={`/detail/${type}/${rec.id}`}>
                    <div className="flex gap-4 group cursor-pointer">
                      <div className="w-16 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-white/5 border border-white/10 group-hover:border-[#00D4FF]/40 transition-all">
                        <img src={tmdbImg(rec.poster_path, "w92") || ""} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      </div>
                      <div className="flex-1 py-1">
                        <h4 className="text-sm font-bold group-hover:text-[#00D4FF] transition-colors line-clamp-2">{getMediaTitle(rec)}</h4>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-[#FFD700]">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            {rec.vote_average?.toFixed(1)}
                          </div>
                          <span className="text-[10px] text-[#8899AA]">{getMediaYear(rec)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />


    </div>
  );
}

// Icon helper components
function Sparkles(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
  );
}
