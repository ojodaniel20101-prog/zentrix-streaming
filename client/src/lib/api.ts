/* ZENTRIX_TECH — API Service Layer (Enhanced v2)
   TMDB: https://api.themoviedb.org/3 (public key)
   AniList: https://graphql.anilist.co (GraphQL, no auth required)
*/

const TMDB_API_KEY = "8265bd1679663a7ea12ac168da84d2e8";
const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMG = "https://image.tmdb.org/t/p";
// Use server-side proxy to avoid CORS issues with AniList
const ANILIST_BASE = "/api/anilist";

export const tmdbImg = (path: string | null, size: string = "w500") =>
  path ? `${TMDB_IMG}/${size}${path}` : null;

export const tmdbBackdrop = (path: string | null) =>
  path ? `${TMDB_IMG}/original${path}` : null;

async function tmdbFetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${TMDB_BASE}${endpoint}`);
  url.searchParams.set("api_key", TMDB_API_KEY);
  url.searchParams.set("language", "en-US");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
  return res.json();
}

export interface TMDBMedia {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  runtime?: number;
  episode_run_time?: number[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  status?: string;
  tagline?: string;
  original_language?: string;
  popularity?: number;
  media_type?: string;
  seasons?: TMDBSeason[];
  videos?: { results: TMDBVideo[] };
  credits?: { cast: TMDBCast[]; crew: TMDBCrew[] };
  similar?: { results: TMDBMedia[] };
  recommendations?: { results: TMDBMedia[] };
  imdb_id?: string;
  networks?: { id: number; name: string; logo_path: string | null }[];
  production_companies?: { id: number; name: string; logo_path: string | null }[];
  budget?: number;
  revenue?: number;
  spoken_languages?: { english_name: string; iso_639_1: string }[];
  content_ratings?: { results: { iso_3166_1: string; rating: string }[] };
  "watch/providers"?: {
    results: {
      US?: {
        flatrate?: { provider_name: string; logo_path: string }[];
        rent?: { provider_name: string; logo_path: string }[];
        buy?: { provider_name: string; logo_path: string }[];
      };
    };
  };
  images?: {
    backdrops: { file_path: string; width: number; height: number }[];
    posters: { file_path: string; width: number; height: number }[];
  };
  keywords?: { keywords?: { id: number; name: string }[]; results?: { id: number; name: string }[] };
}

export interface TMDBSeason {
  id: number;
  season_number: number;
  episode_count: number;
  name: string;
  overview: string;
  poster_path: string | null;
  air_date: string;
}

export interface TMDBEpisode {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string;
  vote_average: number;
  runtime?: number;
  guest_stars?: TMDBCast[];
  crew?: TMDBCrew[];
}

export interface TMDBVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

export interface TMDBCast {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface TMDBCrew {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBSeasonDetails {
  id: number;
  name: string;
  overview: string;
  season_number: number;
  air_date: string;
  poster_path: string | null;
  episodes: TMDBEpisode[];
}

export const getTrendingMovies = (page = 1) =>
  tmdbFetch<{ results: TMDBMedia[]; total_pages: number }>("/trending/movie/week", { page: String(page) });

export const getPopularMovies = (page = 1) =>
  tmdbFetch<{ results: TMDBMedia[]; total_pages: number }>("/movie/popular", { page: String(page) });

export const getTopRatedMovies = (page = 1) =>
  tmdbFetch<{ results: TMDBMedia[]; total_pages: number }>("/movie/top_rated", { page: String(page) });

export const getNowPlayingMovies = (page = 1) =>
  tmdbFetch<{ results: TMDBMedia[]; total_pages: number }>("/movie/now_playing", { page: String(page) });

export const getUpcomingMovies = (page = 1) =>
  tmdbFetch<{ results: TMDBMedia[]; total_pages: number }>("/movie/upcoming", { page: String(page) });

export const getMovieDetails = (id: number) =>
  tmdbFetch<TMDBMedia>(`/movie/${id}`, {
    append_to_response: "videos,credits,similar,recommendations,images,keywords,watch/providers",
  });

export const getMoviesByGenre = (genreId: number, page = 1) =>
  tmdbFetch<{ results: TMDBMedia[]; total_pages: number }>("/discover/movie", {
    with_genres: String(genreId), sort_by: "popularity.desc", page: String(page),
  });

export const getTrendingTV = (page = 1) =>
  tmdbFetch<{ results: TMDBMedia[]; total_pages: number }>("/trending/tv/week", { page: String(page) });

export const getPopularTV = (page = 1) =>
  tmdbFetch<{ results: TMDBMedia[]; total_pages: number }>("/tv/popular", { page: String(page) });

export const getTopRatedTV = (page = 1) =>
  tmdbFetch<{ results: TMDBMedia[]; total_pages: number }>("/tv/top_rated", { page: String(page) });

export const getAiringTodayTV = (page = 1) =>
  tmdbFetch<{ results: TMDBMedia[]; total_pages: number }>("/tv/airing_today", { page: String(page) });

export const getTVDetails = (id: number) =>
  tmdbFetch<TMDBMedia>(`/tv/${id}`, {
    append_to_response: "videos,credits,similar,recommendations,images,keywords,content_ratings,watch/providers",
  });

export const getTVSeason = (tvId: number, seasonNumber: number) =>
  tmdbFetch<TMDBSeasonDetails>(`/tv/${tvId}/season/${seasonNumber}`);

export const getTVsByGenre = (genreId: number, page = 1) =>
  tmdbFetch<{ results: TMDBMedia[]; total_pages: number }>("/discover/tv", {
    with_genres: String(genreId), sort_by: "popularity.desc", page: String(page),
  });

export const searchMulti = (query: string, page = 1) =>
  tmdbFetch<{ results: TMDBMedia[]; total_pages: number }>("/search/multi", {
    query, page: String(page), include_adult: "false",
  });

export const searchMovies = (query: string, page = 1) =>
  tmdbFetch<{ results: TMDBMedia[]; total_pages: number }>("/search/movie", { query, page: String(page) });

export const searchTV = (query: string, page = 1) =>
  tmdbFetch<{ results: TMDBMedia[]; total_pages: number }>("/search/tv", { query, page: String(page) });

export const getMovieGenres = () => tmdbFetch<{ genres: TMDBGenre[] }>("/genre/movie/list");
export const getTVGenres = () => tmdbFetch<{ genres: TMDBGenre[] }>("/genre/tv/list");

export const getTrendingAll = (page = 1) =>
  tmdbFetch<{ results: TMDBMedia[]; total_pages: number }>("/trending/all/day", { page: String(page) });

export interface AniListMedia {
  id: number;
  idMal?: number;
  title: { romaji: string; english: string | null; native: string };
  description: string | null;
  coverImage: { large: string; extraLarge: string; color: string | null };
  bannerImage: string | null;
  averageScore: number | null;
  popularity: number;
  episodes: number | null;
  duration: number | null;
  status: string;
  season: string | null;
  seasonYear: number | null;
  startDate: { year: number | null; month: number | null; day: number | null };
  genres: string[];
  format: string;
  studios?: { nodes: { name: string; isAnimationStudio: boolean }[] };
  trailer?: { id: string; site: string } | null;
  nextAiringEpisode?: { episode: number; airingAt: number } | null;
  relations?: {
    edges: {
      relationType: string;
      node: { id: number; idMal?: number; title: { romaji: string; english: string | null; native: string }; format: string; episodes?: number | null; duration?: number | null; coverImage: { large: string }; bannerImage?: string | null };
    }[];
  };
  characters?: {
    edges: {
      node: { id: number; name: { full: string }; image: { large: string } };
      role: string;
      voiceActors: { id: number; name: { full: string }; image: { large: string } }[];
    }[];
  };
  recommendations?: {
    nodes: {
      mediaRecommendation: {
        id: number;
        title: { romaji: string; english: string | null };
        coverImage: { large: string };
        averageScore: number | null;
        episodes: number | null;
        format: string;
      } | null;
    }[];
  };
  streamingEpisodes?: {
    title: string;
    thumbnail: string;
    url: string;
    site: string;
  }[];
  airingSchedule?: {
    nodes: {
      episode: number;
      airingAt: number;
    }[];
  };
  tags?: { name: string; rank: number }[];
  staff?: {
    edges: {
      node: { id: number; name: { full: string }; image: { large: string } };
      role: string;
    }[];
  };
}

async function anilistFetch<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const res = await fetch(ANILIST_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query, variables }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`AniList error: ${res.status}`);
    const data = await res.json();
    if (data.errors) throw new Error(data.errors[0].message);
    return data.data;
  } finally {
    clearTimeout(timeout);
  }
}

const ANIME_FIELDS = `
  id idMal
  title { romaji english native }
  description(asHtml: false)
  coverImage { large extraLarge color }
  bannerImage
  averageScore popularity episodes duration
  status season seasonYear
  startDate { year month day }
  genres format
  studios { nodes { name isAnimationStudio } }
  trailer { id site }
  nextAiringEpisode { episode airingAt }
  streamingEpisodes { title thumbnail url site }
  airingSchedule(perPage: 100) { nodes { episode airingAt } }
`;

export const getTrendingAnime = (page = 1, perPage = 20) =>
  anilistFetch<{ Page: { media: AniListMedia[] } }>(
    `query($page: Int, $perPage: Int) { Page(page: $page, perPage: $perPage) { media(sort: TRENDING_DESC, type: ANIME, isAdult: false) { ${ANIME_FIELDS} } } }`,
    { page, perPage }
  );

export const getPopularAnime = (page = 1, perPage = 20) =>
  anilistFetch<{ Page: { media: AniListMedia[] } }>(
    `query($page: Int, $perPage: Int) { Page(page: $page, perPage: $perPage) { media(sort: POPULARITY_DESC, type: ANIME, isAdult: false) { ${ANIME_FIELDS} } } }`,
    { page, perPage }
  );

export const getTopRatedAnime = (page = 1, perPage = 20) =>
  anilistFetch<{ Page: { media: AniListMedia[] } }>(
    `query($page: Int, $perPage: Int) { Page(page: $page, perPage: $perPage) { media(sort: SCORE_DESC, type: ANIME, isAdult: false) { ${ANIME_FIELDS} } } }`,
    { page, perPage }
  );

export const getSeasonalAnime = (season: string, year: number, page = 1, perPage = 20) =>
  anilistFetch<{ Page: { media: AniListMedia[] } }>(
    `query($season: MediaSeason, $year: Int, $page: Int, $perPage: Int) { Page(page: $page, perPage: $perPage) { media(season: $season, seasonYear: $year, type: ANIME, isAdult: false, sort: POPULARITY_DESC) { ${ANIME_FIELDS} } } }`,
    { season, year, page, perPage }
  );

export const getAnimeDetails = (id: number) =>
  anilistFetch<{ Media: AniListMedia }>(
    `query($id: Int) {
      Media(id: $id, type: ANIME) {
        ${ANIME_FIELDS}
        tags { name rank }
        relations { edges { relationType node { id idMal title { romaji english native } format episodes duration coverImage { large } bannerImage } } }
        characters(sort: ROLE, perPage: 12) {
          edges { node { id name { full } image { large } } role voiceActors(language: JAPANESE) { id name { full } image { large } } }
        }
        staff(sort: RELEVANCE, perPage: 8) { edges { node { id name { full } image { large } } role } }
        recommendations(perPage: 10) {
          nodes { mediaRecommendation { id title { romaji english } coverImage { large } averageScore episodes format } }
        }
      }
    }`,
    { id }
  );

export const searchAnime = (search: string, page = 1, perPage = 20) =>
  anilistFetch<{ Page: { media: AniListMedia[] } }>(
    `query($search: String, $page: Int, $perPage: Int) { Page(page: $page, perPage: $perPage) { media(search: $search, type: ANIME, isAdult: false) { ${ANIME_FIELDS} } } }`,
    { search, page, perPage }
  );

export const getAnimeByGenre = (genre: string, page = 1, perPage = 20) =>
  anilistFetch<{ Page: { media: AniListMedia[] } }>(
    `query($genre: String, $page: Int, $perPage: Int) { Page(page: $page, perPage: $perPage) { media(genre: $genre, type: ANIME, isAdult: false, sort: POPULARITY_DESC) { ${ANIME_FIELDS} } } }`,
    { genre, page, perPage }
  );

export const getMovieEmbedUrl = (tmdbId: number): string =>
  `https://vidsrc.wiki/embed/movie/${tmdbId}`;

export const getTVEmbedUrl = (tmdbId: number, season: number, episode: number): string =>
  `https://vidsrc.wiki/embed/tv/${tmdbId}/${season}/${episode}`;

export const getAnimeEmbedUrl = (animeId: number, episode: number = 1, language: string = "sub"): string =>
  `https://megaplay.buzz/stream/ani/${animeId}/${episode}/${language}`;

export const getMovieEmbedFallback = (tmdbId: number): string =>
  `https://vidsrc.wiki/embed/movie/${tmdbId}?autoplay=1`;

export const getTVEmbedFallback = (tmdbId: number, season: number, episode: number): string =>
  `https://vidsrc.wiki/embed/tv/${tmdbId}/${season}/${episode}?autoplay=1`;

export const getMediaTitle = (media: TMDBMedia) => media.title || media.name || "Unknown";

export const getMediaYear = (media: TMDBMedia) => {
  const date = media.release_date || media.first_air_date;
  return date ? date.substring(0, 4) : "";
};

export const getMediaRuntime = (media: TMDBMedia) => {
  if (media.runtime) return `${media.runtime}m`;
  if (media.episode_run_time?.[0]) return `${media.episode_run_time[0]}m/ep`;
  return null;
};

export const MOVIE_GENRES: Record<number, string> = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy",
  80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
  14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
  9648: "Mystery", 10749: "Romance", 878: "Sci-Fi", 10770: "TV Movie",
  53: "Thriller", 10752: "War", 37: "Western",
};

export const TV_GENRES: Record<number, string> = {
  10759: "Action & Adventure", 16: "Animation", 35: "Comedy",
  80: "Crime", 99: "Documentary", 18: "Drama", 10751: "Family",
  10762: "Kids", 9648: "Mystery", 10763: "News", 10764: "Reality",
  10765: "Sci-Fi & Fantasy", 10766: "Soap", 10767: "Talk",
  10768: "War & Politics", 37: "Western",
};

export const ANIME_GENRES: Record<string, string> = {
  "Action": "Action",
  "Adventure": "Adventure",
  "Comedy": "Comedy",
  "Drama": "Drama",
  "Fantasy": "Fantasy",
  "Horror": "Horror",
  "Mystery": "Mystery",
  "Romance": "Romance",
  "Sci-Fi": "Sci-Fi",
  "Slice of Life": "Slice of Life",
  "Sports": "Sports",
  "Supernatural": "Supernatural",
  "Thriller": "Thriller",
  "Mecha": "Mecha",
  "Psychological": "Psychological",
};

// New video server URLs - vidapi.ru
export const getMovieEmbedVidApi = (tmdbId: number): string =>
  `https://vidapi.ru/embed/movie/${tmdbId}`;

export const getTVEmbedVidApi = (tmdbId: number, season: number, episode: number): string =>
  `https://vidapi.ru/embed/tv/${tmdbId}/${season}/${episode}`;

// New video server URLs - ezvidapi.com
export const getMovieEmbedEzVidApi = (tmdbId: number): string =>
  `https://ezvidapi.com/embed/movie/${tmdbId}`;

export const getTVEmbedEzVidApi = (tmdbId: number, season: number, episode: number): string =>
  `https://ezvidapi.com/embed/tv/${tmdbId}/${season}/${episode}`;

// New video server URLs - cinezo.live
export const getMovieEmbedCinezo = (tmdbId: number): string =>
  `https://cinezo.live/embed/movie/${tmdbId}`;

export const getTVEmbedCinezo = (tmdbId: number, season: number, episode: number): string =>
  `https://cinezo.live/embed/tv/${tmdbId}/${season}/${episode}`;

// New video server URLs - vidzen.fun
export const getMovieEmbedVidzen = (tmdbId: number): string =>
  `https://vidzen.fun/embed/movie/${tmdbId}`;

export const getTVEmbedVidzen = (tmdbId: number, season: number, episode: number): string =>
  `https://vidzen.fun/embed/tv/${tmdbId}/${season}/${episode}`;

// Megaplay.buzz with MAL ID support
export const getAnimeEmbedMegaplayMAL = (malId: number, episode: number = 1, language: string = "sub"): string =>
  `https://megaplay.buzz/stream/mal/${malId}/${episode}/${language}`;

// Megaplay.buzz with Anikoto episode ID support
export const getAnimeEmbedMegaplayAnikoto = (episodeId: string, language: string = "sub"): string =>
  `https://megaplay.buzz/stream/s-2/${episodeId}/${language}`;

// Get anime seasons from relations (for multi-season anime)
export const getAnimeSeasons = async (id: number): Promise<Array<{ season_number: number; name: string; episode_count: number; id: number }>> => {
  try {
    const data = await getAnimeDetails(id);
    const anime = data.Media;
    
    // Start with the main anime as Season 1
    const seasons: Array<{ season_number: number; name: string; episode_count: number; id: number }> = [
      { season_number: 1, name: anime.title.romaji, episode_count: anime.episodes || 24, id: anime.id }
    ];
    
    // Look for sequels in relations
    if (anime.relations?.edges) {
      let seasonNum = 2;
      const visited = new Set([id]);
      
      // Find and add sequels
      for (const edge of anime.relations.edges) {
        if (edge.relationType === "SEQUEL" && !visited.has(edge.node.id) && seasonNum <= 5) {
          seasons.push({
            season_number: seasonNum,
            name: edge.node.title.romaji,
            episode_count: (edge.node as any).episodes || 24,
            id: edge.node.id
          });
          visited.add(edge.node.id);
          seasonNum++;
        }
      }
    }
    
    return seasons;
  } catch (error) {
    console.error("Error fetching anime seasons:", error);
    return [];
  }
};


// Cache for anime title to TMDB ID mapping
const animeToTmdbCache = new Map<string, number>();

/**
 * Search TMDB for anime by title and return the TMDB TV ID
 * Anime titles on TMDB are typically listed as TV shows
 */
export const getAnimeTmdbId = async (animeTitle: string): Promise<number | null> => {
  const cacheKey = animeTitle.toLowerCase();
  if (animeToTmdbCache.has(cacheKey)) {
    return animeToTmdbCache.get(cacheKey) || null;
  }
  
  try {
    const results = await searchTV(animeTitle, 1);
    if (results.results && results.results.length > 0) {
      const tmdbId = results.results[0].id;
      animeToTmdbCache.set(cacheKey, tmdbId);
      return tmdbId;
    }
  } catch (error) {
    console.error(`Failed to get TMDB ID for anime "${animeTitle}":`, error);
  }
  
  animeToTmdbCache.set(cacheKey, 0);
  return null;
};
