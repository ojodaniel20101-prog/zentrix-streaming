/**
 * M3U8 Parser for IPTV Playlists
 * Parses M3U8 format and extracts channel information
 */

import axios from 'axios';

export interface ParsedChannel {
  id: string;
  name: string;
  logo_url?: string;
  category?: string;
  country?: string;
  url: string;
  group?: string;
}

const M3U8_CACHE: Map<string, { data: ParsedChannel[]; timestamp: number }> = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetch M3U8 playlist from URL
 */
async function fetchM3U8(url: string): Promise<string> {
  try {
    console.log(`[M3U8] Fetching playlist from ${url}...`);
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });
    console.log(`[M3U8] Successfully fetched playlist`);
    return response.data;
  } catch (error) {
    console.error(`[M3U8] Error fetching playlist:`, error instanceof Error ? error.message : error);
    throw error;
  }
}

/**
 * Parse M3U8 content and extract channels
 */
export function parseM3U8Content(content: string): ParsedChannel[] {
  const channels: ParsedChannel[] = [];
  const lines = content.split('\n');

  let currentChannel: Partial<ParsedChannel> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines and comments
    if (!line || line.startsWith('#EXTM3U')) {
      continue;
    }

    // Parse channel info line
    if (line.startsWith('#EXTINF:')) {
      const extinf = line.substring('#EXTINF:'.length);
      const parts = extinf.split(',');
      const attrs = parts[0];
      const name = parts.slice(1).join(',').trim();

      // Parse attributes
      const tvgId = extractAttribute(attrs, 'tvg-id');
      const tvgLogo = extractAttribute(attrs, 'tvg-logo');
      const groupTitle = extractAttribute(attrs, 'group-title');
      const tvgCountry = extractAttribute(attrs, 'tvg-country');

      currentChannel = {
        id: tvgId || `channel_${channels.length}`,
        name: name || 'Unknown Channel',
        logo_url: tvgLogo,
        category: groupTitle,
        country: tvgCountry,
        group: groupTitle,
      };
    } else if (line.startsWith('#EXTVLCOPT') || line.startsWith('#KODIPROP') || line.startsWith('#EXTHTTP') || line.startsWith('#EXTGRP')) {
      // Skip VLC options, Kodi properties, HTTP headers — metadata between #EXTINF and URL
      continue;
    } else if (line && !line.startsWith('#') && currentChannel) {
      // This is the URL line
      if (line.startsWith('http://') || line.startsWith('https://') || line.startsWith('rtmp://') || line.startsWith('rtsp://')) {
        currentChannel.url = line;
        // Sanitize channel name: strip embedded user-agent or group-title artifacts
        if (currentChannel.name) {
          currentChannel.name = currentChannel.name
            .replace(/Mozilla\/[^\s,]*/gi, '')
            .replace(/group-title="[^"]*",?/gi, '')
            .replace(/tvg-[a-z]+=\"[^\"]*\"/gi, '')
            .trim();
          if (!currentChannel.name) currentChannel.name = 'Unknown Channel';
        }
        channels.push(currentChannel as ParsedChannel);
        currentChannel = null;
      }
    }
  }

  console.log(`[M3U8] Parsed ${channels.length} channels from M3U8`);
  return channels;
}

/**
 * Extract attribute value from EXTINF line
 */
function extractAttribute(attrs: string, attrName: string): string | undefined {
  const regex = new RegExp(`${attrName}="([^"]*)"`, 'i');
  const match = attrs.match(regex);
  return match ? match[1] : undefined;
}

/**
 * Parse M3U8 playlist from URL with caching
 */
export async function parseM3U8Playlist(url: string): Promise<ParsedChannel[]> {
  // Check cache
  const cached = M3U8_CACHE.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`[M3U8] Cache hit for ${url}`);
    return cached.data;
  }

  try {
    const content = await fetchM3U8(url);
    const channels = parseM3U8Content(content);

    // Cache the result
    M3U8_CACHE.set(url, {
      data: channels,
      timestamp: Date.now(),
    });

    return channels;
  } catch (error) {
    console.error(`[M3U8] Failed to parse M3U8 playlist:`, error);
    throw error;
  }
}

/**
 * Get channels by category
 */
export function getChannelsByCategory(
  channels: ParsedChannel[],
  category: string
): ParsedChannel[] {
  return channels.filter((ch) =>
    ch.category?.toLowerCase().includes(category.toLowerCase()) ||
    ch.group?.toLowerCase().includes(category.toLowerCase())
  );
}

/**
 * Get channels by country
 */
export function getChannelsByCountry(
  channels: ParsedChannel[],
  country: string
): ParsedChannel[] {
  return channels.filter((ch) =>
    ch.country?.toLowerCase().includes(country.toLowerCase())
  );
}

/**
 * Search channels by name
 */
export function searchChannels(
  channels: ParsedChannel[],
  query: string
): ParsedChannel[] {
  const lowerQuery = query.toLowerCase();
  return channels.filter((ch) =>
    ch.name.toLowerCase().includes(lowerQuery) ||
    ch.id.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get sports channels
 */
export function getSportsChannels(channels: ParsedChannel[]): ParsedChannel[] {
  return getChannelsByCategory(channels, 'sports');
}

/**
 * Get football channels
 */
export function getFootballChannels(channels: ParsedChannel[]): ParsedChannel[] {
  const channels_result = channels.filter((ch) => {
    const name = ch.name.toLowerCase();
    const category = ch.category?.toLowerCase() || '';
    return (
      name.includes('football') ||
      name.includes('soccer') ||
      name.includes('premier') ||
      name.includes('laliga') ||
      name.includes('serie') ||
      name.includes('bundesliga') ||
      category.includes('football') ||
      category.includes('soccer')
    );
  });
  return channels_result;
}

/**
 * Get cartoon/kids channels
 */
export function getCartoonChannels(channels: ParsedChannel[]): ParsedChannel[] {
  return channels.filter((ch) => {
    const name = ch.name.toLowerCase();
    const category = ch.category?.toLowerCase() || '';
    return (
      name.includes('cartoon') ||
      name.includes('kids') ||
      name.includes('children') ||
      name.includes('disney') ||
      name.includes('nickelodeon') ||
      category.includes('cartoon') ||
      category.includes('kids') ||
      category.includes('children')
    );
  });
}

/**
 * Clear cache
 */
export function clearCache(): void {
  M3U8_CACHE.clear();
  console.log('[M3U8] Cache cleared');
}

/**
 * Get cache stats
 */
export function getCacheStats() {
  return {
    size: M3U8_CACHE.size,
    entries: Array.from(M3U8_CACHE.keys()),
  };
}
