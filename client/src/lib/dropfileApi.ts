/**
 * DropFile.cc API Client
 * Handles anime streaming via dropfile.cc with direct embed URLs
 * Supports SUB/DUB audio selection via URL parameters
 */

import { getMalIdSafe } from './anilistToMal';

// API Key for dropfile.cc (for authenticated requests if needed)
const DROPFILE_API_KEY = 'df_db0e7484d7f6bb353a43c5c15f5274ed';

export type AudioType = 'sub' | 'dub' | 'raw';
export type Language = 'en' | 'es' | 'pt' | 'ja';

interface DropfileEmbedUrl {
  url: string;
  audio: AudioType;
  episode: number;
  quality?: string;
}

interface DropfileAnime {
  title: string;
  ids: {
    imdb?: string;
    tmdb?: number;
    mal?: number;
    anilist?: number;
  };
}

// Cache for embed URLs
interface CachedEmbed {
  url: string;
  timestamp: number;
}

const cachedEmbeds = new Map<string, CachedEmbed>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get direct embed URL for anime episode
 * Uses dropfile.cc direct embed endpoint with audio type parameter
 */
export async function getEmbedUrl(
  anilistId: number,
  season: number = 1,
  episode: number = 1,
  audio: AudioType = 'sub'
): Promise<string | null> {
  try {
    // Get MAL ID from AniList ID
    const malId = await getMalIdSafe(anilistId);
    const cacheKey = `mal-${malId}-s${season}e${episode}-${audio}`;

    // Check cache
    const cached = cachedEmbeds.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('[DropFile] Returning cached embed URL for', cacheKey);
      return cached.url;
    }

    // Build direct embed URL
    // Format: https://dropfile.cc/embed/anime/{malId}/{episode}/{audio}
    const embedUrl = `https://dropfile.cc/embed/anime/${malId}/${episode}/${audio}`;
    
    console.log('[DropFile] Generated embed URL:', embedUrl);
    
    // Verify the URL is accessible
    try {
      const response = await fetch(embedUrl, { method: 'HEAD' });
      if (response.ok) {
        console.log('[DropFile] Embed URL verified (HTTP 200)');
        
        // Cache the URL
        cachedEmbeds.set(cacheKey, {
          url: embedUrl,
          timestamp: Date.now(),
        });
        
        return embedUrl;
      } else {
        console.warn(`[DropFile] Embed URL returned ${response.status}`);
        return null;
      }
    } catch (error) {
      console.warn('[DropFile] Could not verify embed URL:', error);
      // Still return the URL even if verification fails
      return embedUrl;
    }
  } catch (error) {
    console.error('[DropFile] Failed to generate embed URL:', error);
    return null;
  }
}

/**
 * Get available audio types for an episode
 * Tests both SUB and DUB to see which are available
 */
export async function getAvailableAudio(
  anilistId: number,
  season: number = 1,
  episode: number = 1
): Promise<AudioType[]> {
  const available: AudioType[] = [];

  try {
    const malId = await getMalIdSafe(anilistId);
    
    // Check SUB
    try {
      const subUrl = `https://dropfile.cc/embed/anime/${malId}/${episode}/sub`;
      const subResponse = await fetch(subUrl, { method: 'HEAD' });
      if (subResponse.ok) {
        available.push('sub');
        console.log('[DropFile] SUB is available');
      }
    } catch (error) {
      console.warn('[DropFile] Could not check SUB availability:', error);
    }

    // Check DUB
    try {
      const dubUrl = `https://dropfile.cc/embed/anime/${malId}/${episode}/dub`;
      const dubResponse = await fetch(dubUrl, { method: 'HEAD' });
      if (dubResponse.ok) {
        available.push('dub');
        console.log('[DropFile] DUB is available');
      }
    } catch (error) {
      console.warn('[DropFile] Could not check DUB availability:', error);
    }

    // Default to SUB if nothing found
    const result: AudioType[] = available.length > 0 ? available : ['sub'];
    console.log('[DropFile] Available audio types:', result);
    return result;
  } catch (error) {
    console.error('[DropFile] Failed to check available audio:', error);
    return ['sub']; // Default to SUB
  }
}

/**
 * Get anime stream info
 * Returns embed URL and available audio options
 */
export async function getAnimeStreamInfo(
  anilistId: number,
  season: number = 1,
  episode: number = 1,
  audio: AudioType = 'sub'
): Promise<{ embedUrl: string | null; availableAudio: AudioType[] } | null> {
  try {
    const embedUrl = await getEmbedUrl(anilistId, season, episode, audio);
    const availableAudio = await getAvailableAudio(anilistId, season, episode);
    
    return {
      embedUrl,
      availableAudio,
    };
  } catch (error) {
    console.error('[DropFile] Failed to get stream info:', error);
    return null;
  }
}

/**
 * Clear the embed URL cache
 */
export function clearCache() {
  cachedEmbeds.clear();
  console.log('[DropFile] Cache cleared');
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: cachedEmbeds.size,
    entries: Array.from(cachedEmbeds.keys()),
  };
}

/**
 * Get API key (for reference)
 */
export function getApiKey(): string {
  return DROPFILE_API_KEY;
}
