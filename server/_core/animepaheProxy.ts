import express from "express";
import axios from "axios";

const API_BASE = "https://h5-api.aoneroom.com";
const SEPTORCH_PROXY = "https://gzmovieboxapi.septorch.tech/api/proxy";
const SEPTORCH_API_KEY = "Godszeal";

const HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  Accept: "application/json",
  "Content-Type": "application/json",
  "X-Source": "downloader",
  Origin: "https://videodownloader.site",
  Referer: "https://videodownloader.site/",
};

// CORS proxies to try for POST requests
const CORS_PROXIES = [
  "https://corsproxy.io/?",
  "https://api.allorigins.win/raw?url=",
  "https://cors-anywhere.herokuapp.com/",
];

async function searchAnime(keyword: string) {
  const targetUrl = `${API_BASE}/wefeed-h5api-bff/subject/search`;
  const body = { keyword, page: 1, perPage: 20 };

  // Try direct first
  const errors: string[] = [];
  
  // Try each CORS proxy
  for (const proxy of CORS_PROXIES) {
    try {
      const proxyUrl = `${proxy}${encodeURIComponent(targetUrl)}`;
      const res = await axios.post(proxyUrl, body, {
        headers: HEADERS,
        timeout: 15000,
      });
      const data = res.data;
      if (data?.code === 0 && data?.data?.items) {
        const items: any[] = data.data.items;
        return items.map((item: any) => ({
          subjectId: item.subjectId,
          title: item.title,
          type: item.subjectType,
          detailPath: item.detailPath,
        }));
      }
    } catch (e: any) {
      errors.push(`${proxy}: ${e.message}`);
    }
  }

  // Try direct as last resort
  try {
    const res = await fetch(targetUrl, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.code === 0) {
        return (data?.data?.items ?? []).map((item: any) => ({
          subjectId: item.subjectId,
          title: item.title,
          type: item.subjectType,
          detailPath: item.detailPath,
        }));
      }
    }
  } catch (e: any) {
    errors.push(`direct: ${e.message}`);
  }

  throw new Error(`Search failed via all proxies: ${errors.join(", ")}`);
}

async function fetchDownload(subjectId: string, detailPath: string, season: number, episode: number) {
  const path = `/wefeed-h5api-bff/subject/download?subjectId=${subjectId}&se=${season}&ep=${episode}&detailPath=${encodeURIComponent(detailPath)}`;
  const targetUrl = `${API_BASE}${path}`;

  // Try CORS proxies for GET
  for (const proxy of CORS_PROXIES) {
    try {
      const proxyUrl = `${proxy}${encodeURIComponent(targetUrl)}`;
      const res = await axios.get(proxyUrl, { headers: HEADERS, timeout: 15000 });
      if (res.data?.code === 0) return res.data;
    } catch {}
  }

  // Try direct
  const res = await fetch(targetUrl, { headers: HEADERS });
  if (!res.ok) throw new Error(`Download fetch failed: ${res.status}`);
  return await res.json();
}

async function findSeasonForEpisode(subjectId: string, detailPath: string, targetEp: number) {
  for (let season = 1; season <= 10; season++) {
    const checkData = await fetchDownload(subjectId, detailPath, season, 1);
    if (!checkData?.data?.hasResource) break;
    const epData = await fetchDownload(subjectId, detailPath, season, targetEp);
    if (epData?.data?.hasResource) return { season, episode: targetEp };
  }
  return { season: 1, episode: 1 };
}

async function getDownloadLink(subjectId: string, detailPath: string, season: number, episode: number, preferredQuality?: number) {
  const data = await fetchDownload(subjectId, detailPath, season, episode);
  if (data.code !== 0) throw new Error(`Download error: ${data.message}`);
  const downloads: any[] = data?.data?.downloads ?? [];
  const captions: any[] = data?.data?.captions ?? [];
  if (!downloads.length) throw new Error("No download links in response");
  const sorted = [...downloads].sort((a, b) => parseInt(b.resolution) - parseInt(a.resolution));
  let chosen = sorted[0];
  if (preferredQuality) {
    const match = sorted.find((d) => parseInt(d.resolution) === preferredQuality);
    if (match) chosen = match;
  }
  return {
    downloadUrl: chosen.url as string,
    quality: `${chosen.resolution}P`,
    sizeMb: Math.round((parseInt(chosen.size) / (1024 * 1024)) * 100) / 100,
    codec: chosen.codecName as string,
    subtitles: captions.map((c: any) => ({ language: c.lanName, code: c.lan, url: c.url })),
  };
}

export function registerAnimePaheProxy(app: express.Express) {
  app.get("/api/download/anime", async (req, res) => {
    try {
      const { anime_title, episode_number, quality } = req.query;
      if (!anime_title || !episode_number) {
        return res.status(400).json({ error: "Missing anime_title or episode_number" });
      }
      const epNum = parseInt(episode_number as string);
      const qualityNum = quality ? parseInt(quality as string) : undefined;
      console.log(`[OmniSave] Search: "${anime_title}", Episode: ${epNum}`);
      const results = await searchAnime(anime_title as string);
      if (!results.length) return res.status(404).json({ error: "Anime not found" });
      const anime = results[0];
      console.log(`[OmniSave] Found: ${anime.title}`);
      const location = await findSeasonForEpisode(anime.subjectId, anime.detailPath, epNum);
      const link = await getDownloadLink(anime.subjectId, anime.detailPath, location.season, location.episode, qualityNum);
      console.log(`[OmniSave] Link ready: ${link.quality} (${link.sizeMb} MB)`);
      return res.json({
        success: true,
        anime_title: anime.title,
        episode_number: epNum,
        season: location.season,
        quality: link.quality,
        size_mb: link.sizeMb,
        codec: link.codec,
        download_url: link.downloadUrl,
        subtitles: link.subtitles,
      });
    } catch (error: any) {
      console.error("[OmniSave] Error:", error);
      return res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  app.get("/api/anime/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) return res.status(400).json({ error: "Missing q" });
      const results = await searchAnime(q as string);
      return res.json({ results });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/download/anime/file", async (req, res) => {
    try {
      const { url: cdnUrl, fn: filename } = req.query;
      if (!cdnUrl || typeof cdnUrl !== "string") {
        return res.status(400).json({ error: "Missing url" });
      }
      const safeFilename = (filename as string) || "episode.mp4";
      console.log(`[OmniSave] Proxying via septorch: ${safeFilename}`);
      const proxyUrl = `${SEPTORCH_PROXY}?url=${encodeURIComponent(cdnUrl)}&apikey=${SEPTORCH_API_KEY}`;
      const response = await axios({
        method: "get",
        url: proxyUrl,
        responseType: "stream",
        timeout: 60000,
        maxRedirects: 5,
      });
      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}"`);
      res.setHeader("Accept-Ranges", "bytes");
      if (response.headers["content-length"]) {
        res.setHeader("Content-Length", response.headers["content-length"]);
      }
      response.data.pipe(res);
      response.data.on("error", (err: any) => {
        console.error("[OmniSave] Stream error:", err);
        res.end();
      });
    } catch (error: any) {
      console.error("[OmniSave] Proxy error:", error.message);
      return res.status(500).json({ error: error.message });
    }
  });
}
