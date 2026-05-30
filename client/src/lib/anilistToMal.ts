/**
 * AniList to MAL ID Mapping Service
 * Converts AniList IDs to MyAnimeList IDs for dropfile.cc API
 */

interface AnimeMapping {
  anilistId: number;
  malId: number;
  title: string;
}

// Cache for mappings
const mappingCache = new Map<number, number>();

/**
 * Fetch AniList anime details and extract MAL ID
 */
export async function getMALIdFromAniList(anilistId: number): Promise<number | null> {
  // Check cache first
  if (mappingCache.has(anilistId)) {
    return mappingCache.get(anilistId) || null;
  }

  try {
    const query = `
      query {
        Media(id: ${anilistId}, type: ANIME) {
          idMal
          title {
            english
            romaji
          }
        }
      }
    `;

    const response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();
    const malId = data?.data?.Media?.idMal;

    if (malId) {
      mappingCache.set(anilistId, malId);
      return malId;
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch MAL ID from AniList:', error);
    return null;
  }
}

/**
 * Get MAL ID with fallback to direct usage if AniList ID is MAL ID
 */
export async function getMalIdSafe(anilistId: number): Promise<number> {
  const malId = await getMALIdFromAniList(anilistId);
  return malId || anilistId; // Fallback to anilistId if MAL ID not found
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
export function getCacheSize(): number {
  return mappingCache.size;
}
