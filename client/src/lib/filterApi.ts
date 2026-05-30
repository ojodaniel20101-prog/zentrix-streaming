/**
 * Enhanced Filtering API for Movies, TV Shows, Anime, and Animations
 * Handles pagination, sorting, and advanced filtering
 */

import { TMDBMedia, AniListMedia } from "./api";

const TMDB_API_KEY = "8265bd1679663a7ea12ac168da84d2e8";
const TMDB_BASE = "https://api.themoviedb.org/3";

async function tmdbFetch<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T> {
  const url = new URL(`${TMDB_BASE}${endpoint}`);
  url.searchParams.set("api_key", TMDB_API_KEY);
  url.searchParams.set("language", "en-US");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB error: ${res.status}`);
  return res.json();
}

async function anilistFetch<T>(query: string, variables: Record<string, any> = {}): Promise<T> {
  const res = await fetch("/api/anilist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`AniList error: ${res.status}`);
  const data = await res.json();
  if (data.errors) throw new Error(data.errors[0].message);
  return data.data;
}

// ============= MOVIES FILTERING =============

export interface MovieFilterParams {
  page?: number;
  sortBy?: "popularity" | "rating" | "release_date" | "title";
  genres?: number[];
  year?: number;
  country?: string;
  quality?: string;
}

export const getFilteredMovies = async (params: MovieFilterParams): Promise<{ results: TMDBMedia[]; total_pages: number }> => {
  const {
    page = 1,
    sortBy = "popularity",
    genres,
    year,
    country,
  } = params;

  const sortMap: Record<string, string> = {
    popularity: "popularity.desc",
    rating: "vote_average.desc",
    release_date: "release_date.desc",
    title: "title.asc",
  };

  const queryParams: Record<string, string | number> = {
    page,
    sort_by: sortMap[sortBy],
    include_adult: "false",
    "vote_count.gte": 100,
  };

  if (genres && genres.length > 0) {
    queryParams.with_genres = genres.join(",");
  }

  if (year) {
    queryParams["primary_release_year"] = year;
  }

  if (country) {
    queryParams["region"] = country;
  }

  return tmdbFetch<{ results: TMDBMedia[]; total_pages: number }>("/discover/movie", queryParams);
};

// ============= TV SHOWS FILTERING =============

export interface TVFilterParams {
  page?: number;
  sortBy?: "popularity" | "rating" | "first_air_date" | "name";
  genres?: number[];
  year?: number;
  network?: string;
  status?: "returning" | "planned" | "current" | "ended";
}

export const getFilteredTVShows = async (params: TVFilterParams): Promise<{ results: TMDBMedia[]; total_pages: number }> => {
  const {
    page = 1,
    sortBy = "popularity",
    genres,
    year,
    status,
  } = params;

  const sortMap: Record<string, string> = {
    popularity: "popularity.desc",
    rating: "vote_average.desc",
    first_air_date: "first_air_date.desc",
    name: "name.asc",
  };

  const queryParams: Record<string, string | number> = {
    page,
    sort_by: sortMap[sortBy],
    include_adult: "false",
    "vote_count.gte": 50,
  };

  if (genres && genres.length > 0) {
    queryParams.with_genres = genres.join(",");
  }

  if (year) {
    queryParams["first_air_date.gte"] = `${year}-01-01`;
    queryParams["first_air_date.lte"] = `${year}-12-31`;
  }

  if (status) {
    const statusMap: Record<string, number> = {
      returning: 1,
      planned: 2,
      current: 0,
      ended: 3,
    };
    queryParams.with_status = statusMap[status];
  }

  return tmdbFetch<{ results: TMDBMedia[]; total_pages: number }>("/discover/tv", queryParams);
};

// ============= ANIME FILTERING =============

export interface AnimeFilterParams {
  page?: number;
  sortBy?: "trending" | "popular" | "latest" | "rating";
  genres?: string[];
  year?: number;
  season?: string;
  status?: "ONGOING" | "COMPLETED" | "NOT_YET_RELEASED" | "CANCELLED";
}

const ANIME_FIELDS = `
  id
  idMal
  title { romaji english native }
  format
  episodes
  status
  description
  startDate { year month day }
  endDate { year month day }
  season
  seasonYear
  coverImage { extraLarge large medium color }
  bannerImage
  genres
  averageScore
  popularity
  trending
  relations { edges { relationType } }
  nextAiringEpisode { episode airingAt }
`;

export const getFilteredAnime = async (params: AnimeFilterParams): Promise<{ Page: { media: AniListMedia[] } }> => {
  const {
    page = 1,
    sortBy = "trending",
    genres,
    year,
    season,
    status,
  } = params;

  const sortMap: Record<string, string> = {
    trending: "TRENDING_DESC",
    popular: "POPULARITY_DESC",
    latest: "START_DATE_DESC",
    rating: "SCORE_DESC",
  };

  let query = `query($page: Int, $perPage: Int, $sort: [MediaSort], $genre: [String], $year: Int, $season: MediaSeason, $seasonYear: Int, $status: MediaStatus) {
    Page(page: $page, perPage: $perPage) {
      media(
        type: ANIME
        isAdult: false
        sort: [$sort]
        genre_in: $genre
        startDate_like: $year
        season: $season
        seasonYear: $seasonYear
        status: $status
      ) {
        ${ANIME_FIELDS}
      }
    }
  }`;

  const variables: Record<string, any> = {
    page,
    perPage: 24,
    sort: sortMap[sortBy],
  };

  if (genres && genres.length > 0) {
    variables.genre = genres;
  }

  if (year) {
    variables.year = `${year}%`;
  }

  if (season) {
    variables.season = season.toUpperCase();
    variables.seasonYear = year || new Date().getFullYear();
  }

  if (status) {
    variables.status = status;
  }

  return anilistFetch<{ Page: { media: AniListMedia[] } }>(query, variables);
};

// ============= ANIMATION FILTERING (TMDB) =============

export interface AnimationFilterParams {
  page?: number;
  sortBy?: "popularity" | "rating" | "release_date";
  genres?: number[];
  year?: number;
  studio?: string;
}

// Studio production company IDs in TMDB
export const ANIMATION_STUDIOS: Record<string, number> = {
  Disney: 2,
  Pixar: 3,
  DreamWorks: 521,
  Illumination: 6704,
  "Cartoon Network": 9993,
  Nickelodeon: 13,
};

export const getFilteredAnimations = async (params: AnimationFilterParams): Promise<{ results: TMDBMedia[]; total_pages: number }> => {
  const {
    page = 1,
    sortBy = "popularity",
    genres = [16], // Animation genre
    year,
    studio,
  } = params;

  const sortMap: Record<string, string> = {
    popularity: "popularity.desc",
    rating: "vote_average.desc",
    release_date: "release_date.desc",
  };

  const queryParams: Record<string, string | number> = {
    page,
    sort_by: sortMap[sortBy],
    include_adult: "false",
    with_genres: genres.join(","),
    "vote_count.gte": 50,
  };

  if (year) {
    queryParams["primary_release_year"] = year;
  }

  if (studio && ANIMATION_STUDIOS[studio]) {
    queryParams.with_companies = ANIMATION_STUDIOS[studio];
  }

  return tmdbFetch<{ results: TMDBMedia[]; total_pages: number }>("/discover/movie", queryParams);
};

// ============= SEARCH FUNCTIONS =============

export const searchMovies = async (query: string, page = 1): Promise<{ results: TMDBMedia[]; total_pages: number }> => {
  return tmdbFetch<{ results: TMDBMedia[]; total_pages: number }>("/search/movie", {
    query,
    page,
    include_adult: "false",
  });
};

export const searchTVShows = async (query: string, page = 1): Promise<{ results: TMDBMedia[]; total_pages: number }> => {
  return tmdbFetch<{ results: TMDBMedia[]; total_pages: number }>("/search/tv", {
    query,
    page,
    include_adult: "false",
  });
};

export const searchAnime = async (query: string, page = 1): Promise<{ Page: { media: AniListMedia[] } }> => {
  return anilistFetch<{ Page: { media: AniListMedia[] } }>(
    `query($search: String, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(search: $search, type: ANIME, isAdult: false) {
          ${ANIME_FIELDS}
        }
      }
    }`,
    { search: query, page, perPage: 24 }
  );
};
