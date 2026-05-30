/*
  TMDB Mapping Utility
  Maps AniList IDs to TMDB IDs for consistent streaming
  Uses TMDB as primary system for VidSrc.Wiki
*/

const TMDB_API_KEY = "8265bd1679663a7ea12ac168da84d2e8";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

interface TMDBMappingResult {
  anilistId: number;
  tmdbId: number;
  tmdbType: "tv" | "movie";
  title: string;
  year: number;
}

interface AniListTitle {
  romaji?: string;
  english?: string;
  native?: string;
}

// Cache for mappings to avoid repeated API calls
const mappingCache = new Map<number, TMDBMappingResult>();

/**
 * Search TMDB for anime/manga by title
 * Returns the most likely match based on title and year
 */
async function searchTMDBByTitle(
  title: string,
  year?: number,
  type: "tv" | "movie" = "tv"
): Promise<TMDBMappingResult | null> {
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/search/${type}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&first_air_date_year=${year || ""}`
    );

    if (!response.ok) return null;

    const data = await response.json();
    const results = data.results || [];

    if (results.length === 0) return null;

    // Find best match (usually first result is best)
    const match = results[0];
    const matchYear = type === "tv" ? match.first_air_date?.substring(0, 4) : match.release_date?.substring(0, 4);

    return {
      anilistId: 0, // Will be set by caller
      tmdbId: match.id,
      tmdbType: type,
      title: match.name || match.title || title,
      year: parseInt(matchYear || "0"),
    };
  } catch (error) {
    console.error("Error searching TMDB:", error);
    return null;
  }
}

/**
 * Get TMDB ID for an anime using AniList data
 * Tries multiple strategies to find the best match
 */
export async function getAniListToTMDBMapping(
  anilistId: number,
  anilistTitle: AniListTitle,
  year?: number,
  type: "tv" | "movie" = "tv"
): Promise<TMDBMappingResult | null> {
  // Check cache first
  if (mappingCache.has(anilistId)) {
    return mappingCache.get(anilistId) || null;
  }

  try {
    // Try English title first
    let result: TMDBMappingResult | null = null;

    if (anilistTitle.english) {
      result = await searchTMDBByTitle(anilistTitle.english, year, type);
    }

    // Try Romaji if English didn't work
    if (!result && anilistTitle.romaji) {
      result = await searchTMDBByTitle(anilistTitle.romaji, year, type);
    }

    // Try Native title as last resort
    if (!result && anilistTitle.native) {
      result = await searchTMDBByTitle(anilistTitle.native, year, type);
    }

    if (result) {
      result.anilistId = anilistId;
      mappingCache.set(anilistId, result);
      return result;
    }

    return null;
  } catch (error) {
    console.error("Error mapping AniList to TMDB:", error);
    return null;
  }
}

/**
 * Batch map multiple anime to TMDB IDs
 */
export async function batchMapAniListToTMDB(
  animeList: Array<{
    id: number;
    title: AniListTitle;
    startDate?: { year?: number };
  }>
): Promise<Map<number, TMDBMappingResult>> {
  const results = new Map<number, TMDBMappingResult>();

  // Process in parallel with a limit to avoid rate limiting
  const batchSize = 5;
  for (let i = 0; i < animeList.length; i += batchSize) {
    const batch = animeList.slice(i, i + batchSize);
    const promises = batch.map((anime) =>
      getAniListToTMDBMapping(anime.id, anime.title, anime.startDate?.year)
    );

    const mappings = await Promise.all(promises);
    mappings.forEach((mapping) => {
      if (mapping) {
        results.set(mapping.anilistId, mapping);
      }
    });

    // Small delay between batches to avoid rate limiting
    if (i + batchSize < animeList.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return results;
}

/**
 * Get TMDB episodes for an anime using TMDB ID
 * Used for VidSrc.Wiki streaming
 */
export async function getTMDBEpisodes(
  tmdbId: number,
  tmdbType: "tv" | "movie" = "tv"
): Promise<
  Array<{
    season: number;
    episode: number;
    name: string;
    air_date: string;
  }>
> {
  try {
    if (tmdbType === "movie") {
      return []; // Movies don't have episodes
    }

    const response = await fetch(`${TMDB_BASE_URL}/tv/${tmdbId}?api_key=${TMDB_API_KEY}`);

    if (!response.ok) return [];

    const tvData = await response.json();
    const episodes: Array<{
      season: number;
      episode: number;
      name: string;
      air_date: string;
    }> = [];

    // Fetch all seasons
    for (const season of tvData.seasons || []) {
      if (season.season_number === 0) continue; // Skip specials

      const seasonResponse = await fetch(
        `${TMDB_BASE_URL}/tv/${tmdbId}/season/${season.season_number}?api_key=${TMDB_API_KEY}`
      );

      if (!seasonResponse.ok) continue;

      const seasonData = await seasonResponse.json();

      for (const episode of seasonData.episodes || []) {
        episodes.push({
          season: season.season_number,
          episode: episode.episode_number,
          name: episode.name || `Episode ${episode.episode_number}`,
          air_date: episode.air_date || "",
        });
      }
    }

    return episodes;
  } catch (error) {
    console.error("Error fetching TMDB episodes:", error);
    return [];
  }
}

/**
 * Get TMDB seasons for an anime
 */
export async function getTMDBSeasons(
  tmdbId: number
): Promise<
  Array<{
    season: number;
    name: string;
    episode_count: number;
    air_date: string;
  }>
> {
  try {
    const response = await fetch(`${TMDB_BASE_URL}/tv/${tmdbId}?api_key=${TMDB_API_KEY}`);

    if (!response.ok) return [];

    const tvData = await response.json();
    const seasons: Array<{
      season: number;
      name: string;
      episode_count: number;
      air_date: string;
    }> = [];

    for (const season of tvData.seasons || []) {
      if (season.season_number === 0) continue; // Skip specials

      seasons.push({
        season: season.season_number,
        name: season.name || `Season ${season.season_number}`,
        episode_count: season.episode_count || 0,
        air_date: season.air_date || "",
      });
    }

    return seasons;
  } catch (error) {
    console.error("Error fetching TMDB seasons:", error);
    return [];
  }
}

/**
 * Clear the mapping cache
 */
export function clearMappingCache() {
  mappingCache.clear();
}

/**
 * Get cache size for debugging
 */
export function getMappingCacheSize(): number {
  return mappingCache.size;
}
