import axios from "axios";

const IPTV_ORG_BASE = "https://iptv-org.github.io/api";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  data: unknown;
  timestamp: number;
}

const cache: Record<string, CacheEntry> = {};

/**
 * Fetch data from IPTV-ORG API with caching
 */
async function fetchWithCache(endpoint: string) {
  const cacheKey = `iptv-org:${endpoint}`;
  const now = Date.now();

  // Check cache
  if (cache[cacheKey] && now - cache[cacheKey].timestamp < CACHE_DURATION) {
    console.log(`[IPTV-ORG] Cache hit for ${endpoint}`);
    return cache[cacheKey].data;
  }

  try {
    console.log(`[IPTV-ORG] Fetching ${endpoint}...`);
    const response = await axios.get(`${IPTV_ORG_BASE}/${endpoint}`, {
      timeout: 30000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: "https://iptv-org.github.io/",
      },
    });

    // Cache the result
    cache[cacheKey] = {
      data: response.data,
      timestamp: now,
    };

    console.log(`[IPTV-ORG] Successfully fetched ${endpoint}`);
    return response.data;
  } catch (error) {
    console.error(`[IPTV-ORG] Error fetching ${endpoint}:`, error);
    throw new Error(`Failed to fetch ${endpoint} from IPTV-ORG`);
  }
}

export interface IPTVChannel {
  id: string;
  name: string;
  alt_names?: string[];
  network?: string;
  owners?: string[];
  country?: string;
  categories?: string[];
  is_nsfw?: boolean;
  launched?: string;
  closed?: string;
  replaced_by?: string;
  website?: string;
}

export interface IPTVStream {
  channel: string;
  feed?: string;
  title?: string;
  url: string;
  referrer?: string;
  user_agent?: string;
  quality?: string;
  label?: string;
}

export interface IPTVLogo {
  channel: string;
  feed?: string;
  url: string;
  width?: number;
  height?: number;
  format?: string;
}

/**
 * Get all channels from IPTV-ORG
 */
export async function getAllChannels(): Promise<IPTVChannel[]> {
  const channels = await fetchWithCache("channels.json");
  return Array.isArray(channels) ? channels : [];
}

/**
 * Get all streams from IPTV-ORG
 */
export async function getAllStreams(): Promise<IPTVStream[]> {
  const streams = await fetchWithCache("streams.json");
  return Array.isArray(streams) ? streams : [];
}

/**
 * Get all logos from IPTV-ORG
 */
export async function getAllLogos(): Promise<IPTVLogo[]> {
  const logos = await fetchWithCache("logos.json");
  return Array.isArray(logos) ? logos : [];
}

/**
 * Get all categories from IPTV-ORG
 */
export async function getCategories(): Promise<
  Array<{ id: string; name: string; description?: string }>
> {
  const categories = await fetchWithCache("categories.json");
  return Array.isArray(categories) ? categories : [];
}

/**
 * Search channels by name
 */
export async function searchChannels(
  query: string
): Promise<IPTVChannel[]> {
  const channels = await getAllChannels();
  const lowerQuery = query.toLowerCase();

  return channels.filter(
    (channel) =>
      channel.name.toLowerCase().includes(lowerQuery) ||
      channel.alt_names?.some((alt) =>
        alt.toLowerCase().includes(lowerQuery)
      )
  );
}

/**
 * Filter channels by category
 */
export async function getChannelsByCategory(
  category: string
): Promise<IPTVChannel[]> {
  const channels = await getAllChannels();
  const lowerCategory = category.toLowerCase();

  return channels.filter(
    (channel) =>
      channel.categories?.some((cat) =>
        cat.toLowerCase().includes(lowerCategory)
      )
  );
}

/**
 * Filter channels by country
 */
export async function getChannelsByCountry(
  countryCode: string
): Promise<IPTVChannel[]> {
  const channels = await getAllChannels();
  return channels.filter(
    (channel) =>
      channel.country?.toUpperCase() === countryCode.toUpperCase()
  );
}

/**
 * Get streams for a specific channel
 */
export async function getChannelStreams(
  channelId: string
): Promise<IPTVStream[]> {
  const streams = await getAllStreams();
  return streams.filter((stream) => stream.channel === channelId);
}

/**
 * Get logo for a specific channel
 */
export async function getChannelLogo(channelId: string): Promise<string | null> {
  const logos = await getAllLogos();
  const logo = logos.find((l) => l.channel === channelId);
  return logo?.url || null;
}

/**
 * Get popular sports channels
 */
export async function getSportsChannels(): Promise<IPTVChannel[]> {
  return getChannelsByCategory("sports");
}

/**
 * Get cartoon/kids channels
 */
export async function getCartoonsChannels(): Promise<IPTVChannel[]> {
  const channels = await getAllChannels();
  return channels.filter(
    (channel) =>
      channel.categories?.some(
        (cat) =>
          cat.toLowerCase().includes("cartoon") ||
          cat.toLowerCase().includes("kids") ||
          cat.toLowerCase().includes("children")
      )
  );
}

/**
 * Get live football/soccer channels
 */
export async function getFootballChannels(): Promise<IPTVChannel[]> {
  const channels = await getAllChannels();
  return channels.filter(
    (channel) =>
      channel.categories?.some(
        (cat) =>
          cat.toLowerCase().includes("football") ||
          cat.toLowerCase().includes("soccer") ||
          cat.toLowerCase().includes("sports")
      ) ||
      channel.name.toLowerCase().includes("football") ||
      channel.name.toLowerCase().includes("soccer") ||
      channel.name.toLowerCase().includes("sports")
  );
}

/**
 * Clear cache (useful for manual refresh)
 */
export function clearCache(): void {
  Object.keys(cache).forEach((key) => {
    delete cache[key];
  });
  console.log("[IPTV-ORG] Cache cleared");
}
