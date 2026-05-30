import express from "express";
import { z } from "zod";

const ANIMEPAHE_BASE = "https://animepahe.ru";
const KWIK_BASE = "https://kwik.cx";

/**
 * AnimePahe Scraper Proxy
 * This module handles searching animepahe.ru, fetching episode lists,
 * and resolving kwik.cx download links to direct MP4 URLs.
 */

async function fetchWithBypass(url: string, options: any = {}) {
  const defaultHeaders = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Referer": ANIMEPAHE_BASE,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
  };

  const response = await fetch(url, {
    ...options,
    headers: { ...defaultHeaders, ...options.headers },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  return response;
}

export function registerAnimePaheProxy(app: express.Express) {
  /**
   * GET /api/download/anime
   * Query params: anime_title (string), episode_number (number)
   */
  app.get("/api/download/anime", async (req, res) => {
    try {
      const { anime_title, episode_number } = req.query;

      if (!anime_title || !episode_number) {
        return res.status(400).json({ error: "Missing anime_title or episode_number" });
      }

      const epNum = parseInt(episode_number as string);
      console.log(`[AnimePahe] Search: ${anime_title}, Episode: ${epNum}`);

      // 1. Search for the anime
      const searchUrl = `${ANIMEPAHE_BASE}/api?m=search&q=${encodeURIComponent(anime_title as string)}`;
      const searchRes = await fetchWithBypass(searchUrl);
      const searchData = await searchRes.json();

      if (!searchData.data || searchData.data.length === 0) {
        return res.status(404).json({ error: "Anime not found" });
      }

      // Pick the best match (first one for now)
      const anime = searchData.data[0];
      const animeId = anime.session;
      console.log(`[AnimePahe] Found anime: ${anime.title} (ID: ${animeId})`);

      // 2. Get episode list
      // AnimePahe uses a paginated API for episodes: /api?m=release&id=[session]&sort=asc&page=[page]
      let episodeSession = "";
      let page = 1;
      let found = false;

      while (!found) {
        const epListUrl = `${ANIMEPAHE_BASE}/api?m=release&id=${animeId}&sort=asc&page=${page}`;
        const epListRes = await fetchWithBypass(epListUrl);
        const epListData = await epListRes.json();

        if (!epListData.data || epListData.data.length === 0) break;

        const episode = epListData.data.find((e: any) => e.episode === epNum);
        if (episode) {
          episodeSession = episode.session;
          found = true;
          break;
        }

        if (page >= epListData.last_page) break;
        page++;
      }

      if (!found) {
        return res.status(404).json({ error: `Episode ${epNum} not found` });
      }

      console.log(`[AnimePahe] Found episode session: ${episodeSession}`);

      // 3. Get download links (Kwik links)
      const linksUrl = `${ANIMEPAHE_BASE}/api?m=links&id=${animeId}&session=${episodeSession}&p=kwik`;
      const linksRes = await fetchWithBypass(linksUrl);
      const linksData = await linksRes.json();

      if (!linksData.data || linksData.data.length === 0) {
        return res.status(404).json({ error: "No download links found" });
      }

      // Pick the highest quality link (usually the last one or one with highest resolution)
      // The structure is typically: { "720": { "kwik": "https://kwik.cx/f/..." }, "1080": { ... } }
      const resolutions = Object.keys(linksData.data).sort((a, b) => parseInt(b) - parseInt(a));
      const bestResolution = resolutions[0];
      const kwikLink = linksData.data[bestResolution].kwik;

      console.log(`[AnimePahe] Kwik link: ${kwikLink} (${bestResolution}p)`);

      // 4. Resolve Kwik link to direct MP4 URL
      // This part is tricky because Kwik uses obfuscated JS. 
      // We'll try to extract it by fetching the page and parsing the script.
      const kwikRes = await fetchWithBypass(kwikLink, {
        headers: { "Referer": ANIMEPAHE_BASE }
      });
      const kwikHtml = await kwikRes.text();

      // Kwik uses a script with 'eval(function(p,a,c,k,e,d)...'
      // We need to extract the parameters and decode it.
      const evalMatch = kwikHtml.match(/eval\(function\(p,a,c,k,e,d\).+?\.split\('\|'\)\)\)/);
      if (!evalMatch) {
        return res.status(500).json({ error: "Failed to parse Kwik resolution script" });
      }

      // Use a simple packer decoder logic
      const directUrl = extractKwikUrl(kwikHtml);
      if (!directUrl) {
        return res.status(500).json({ error: "Failed to resolve direct MP4 URL" });
      }

      res.json({
        success: true,
        anime_title: anime.title,
        episode_number: epNum,
        resolution: bestResolution,
        download_url: directUrl
      });

    } catch (error: any) {
      console.error("[AnimePahe] Error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
}

/**
 * Simple decoder for Kwik's packed JavaScript
 */
function extractKwikUrl(html: string): string | null {
  try {
    // Look for the source URL in the script
    // Usually it's inside a string like: source='https://.../v.mp4'
    const sourceMatch = html.match(/source\s*=\s*['"](https:\/\/[^'"]+?\.mp4)['"]/);
    if (sourceMatch) return sourceMatch[1];

    // If not directly visible, it might be in the packed script
    const packedMatch = html.match(/eval\(function\(p,a,c,k,e,d\).+?\.split\('\|'\)\)\)/);
    if (packedMatch) {
      const packed = packedMatch[0];
      // Basic unpacker logic
      const unpacked = unpack(packed);
      const urlMatch = unpacked.match(/https:\/\/[^'"]+?\.mp4/);
      if (urlMatch) return urlMatch[0];
    }
    
    return null;
  } catch (e) {
    return null;
  }
}

function unpack(p: string): string {
  // This is a minimal implementation of the P.A.C.K.E.R. unpacker
  // In a real scenario, we might need a more robust one or use a library
  try {
    const args = p.match(/}\('(.*)',(\d+),(\d+),'(.*)'\.split\('\|'\)/);
    if (!args) return p;
    
    let [_, payload, a_str, c_str, k_str] = args;
    let a = parseInt(a_str);
    let c = parseInt(c_str);
    let k = k_str.split('|');
    
    const e = (c: number) => {
      return (c < a ? '' : e(Math.floor(c / a))) + 
             ((c % a) > 35 ? String.fromCharCode((c % a) + 29) : (c % a).toString(36));
    };
    
    const dict: any = {};
    while (c--) {
      dict[e(c)] = k[c] || e(c);
    }
    
    return payload.replace(/\b\w+\b/g, (w) => dict[w] || w);
  } catch (e) {
    return p;
  }
}
