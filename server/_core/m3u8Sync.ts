/**
 * M3U8 Data Sync Service
 * Syncs channels from M3U8 playlists to database
 */

import * as m3u8Parser from './m3u8Parser';
import * as channelsDb from '../channelsDb';

const IPTV_ORG_M3U8 = 'https://iptv-org.github.io/iptv/index.m3u';

/**
 * Sync channels from M3U8 playlist to database
 */
export async function syncChannelsFromM3U8(
  playlistUrl: string = IPTV_ORG_M3U8,
  limit: number = 1000
): Promise<{ success: boolean; channelsCount: number; error?: string }> {
  try {
    console.log(`[M3U8Sync] Starting sync from ${playlistUrl}...`);

    // Parse M3U8 playlist
    const channels = await m3u8Parser.parseM3U8Playlist(playlistUrl);
    console.log(`[M3U8Sync] Parsed ${channels.length} channels from M3U8`);

    // Limit channels for initial sync
    const channelsToSync = channels.slice(0, limit);
    console.log(`[M3U8Sync] Syncing ${channelsToSync.length} channels to database...`);

    // Transform to database format
    const dbChannels = channelsToSync.map((ch) => ({
      id: ch.id,
      name: ch.name,
      alt_names: null as any,
      country: ch.country || null,
      categories: ch.category ? JSON.stringify([ch.category]) : null,
      network: null as any,
      website: null as any,
      logo_url: ch.logo_url || null,
      is_nsfw: 0,
      source: 'm3u8' as const,
    }));

    // Upsert channels
    await channelsDb.upsertChannels(dbChannels);

    // Create streams from M3U8 URLs
    const streams = channelsToSync.map((ch) => ({
      channel_id: ch.id,
      title: ch.name,
      url: ch.url,
      quality: 'auto' as const,
      referrer: null as any,
      user_agent: null as any,
      is_working: 1,
      source: 'm3u8' as const,
    }));

    // Upsert streams
    await channelsDb.upsertStreams(streams);

    console.log(`[M3U8Sync] Successfully synced ${channelsToSync.length} channels`);
    return {
      success: true,
      channelsCount: channelsToSync.length,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[M3U8Sync] Sync failed:`, errorMsg);
    return {
      success: false,
      channelsCount: 0,
      error: errorMsg,
    };
  }
}

/**
 * Get sync status
 */
export async function getSyncStatus(): Promise<{
  totalChannels: number;
  totalStreams: number;
  lastSync?: string;
}> {
  try {
    // This would query the database for stats
    // For now, return placeholder
    return {
      totalChannels: 0,
      totalStreams: 0,
    };
  } catch (error) {
    console.error('[M3U8Sync] Error getting sync status:', error);
    return {
      totalChannels: 0,
      totalStreams: 0,
    };
  }
}
