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

async function searchAnime(keyword: string) {
  const res = await fetch(`${API_BASE}/wefeed-h5api-bff/subject/search`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ keyword, page: 1, perPage: 20 }),
  });
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  const data = await res.json();
  if (data.code !== 0) throw new Error(`Search error: ${data.message}`);
  const items: any[] = data?.data?.items ?? [];
  return items.map((item: any) => ({
    subjectId: item.subjectId,
    title: item.title,
    type: item.subjectType,
    detailPath: item.detailPath,
  }));
}

async function findSeasonForEpisode(
  subjectId: string,
  detailPath: string,
  targetEp: number
): Promise<{ season: number; episode: number } | null> {
  const url = `${API_BASE}/wefeed-h5api-bff/subject/download`;
  for (let season = 1; season <= 10; season++) {
    const checkRes = await fetch(
      `${url}?subjectId=${subjectId}&se=${season}&ep=1&detailPath=${encodeURIComponent(detailPath)}`,
      { headers: HEADERS }
    );
    if (!checkRes.ok) break;
    const checkData = await checkRes.json();
    if (!checkData?.data?.hasResource) break;

    const epRes = await fetch(
      `${url}?subjectId=${subjectId}&se=${season}&ep=${targetEp}&detailPath=${encodeURIComponent(detailPath)}`,
      { headers: HEADERS }
    );
    if (!epRes.ok) continue;
    const epData = await epRes.json();
    if (epData?.data?.hasResource) return { season, episode: targetEp };
  }
  return { season: 1, episode: 1 };
}

async function getDownloadLink(
  subjectId: string,
  detailPath: string,
  season: number,
  episode: number,
  preferredQuality?: number
) {
  const url = `${API_BASE}/wefeed-h5api-bff/subject/download`;
  const res = await fetch(
    `${url}?subjectId=${subjectId}&se=${season}&ep=${episode}&detailPath=${encodeURIComponent(detailPath)}`,
    { headers: HEADERS }
  );
  if (!res.ok) throw new Error(`Download fetch failed: ${res.status}`);
  const data = await res.json();
  if (data.code !== 0) throw new Error(`Download error: ${data.message}`);

  const downloads: any[] = data?.data?.downloads ?? [];
  const captions: any[] = data?.data?.captions ?? [];
  if (!downloads.length) throw new Error("No download links in response");

  const sorted = [...downloads].sort(
    (a, b) => parseInt(b.resolution) - parseInt(a.resolution)
  );
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
    subtitles: captions.map((c: any) => ({
      language: c.lanName,
      code: c.lan,
      url: c.url,
    })),
  };
}

export function registerAnimePaheProxy(app: express.Express) {

  /**
   * GET /api/download/anime
   */
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
      if (!location) return res.status(404).json({ error: `Episode ${epNum} not found` });

      const link = await getDownloadLink(
        anime.subjectId,
        anime.detailPath,
        location.season,
        location.episode,
        qualityNum
      );

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

  /**
   * GET /api/anime/search
   */
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

  /**
   * GET /api/download/anime/file
   * Routes through septorch proxy which can access hakunaymatata CDN
   */
  app.get("/api/download/anime/file", async (req, res) => {
    try {
      const { url: cdnUrl, fn: filename } = req.query;

      if (!cdnUrl || typeof cdnUrl !== "string") {
        return res.status(400).json({ error: "Missing url" });
      }

      const safeFilename = (filename as string) || "episode.mp4";
      console.log(`[OmniSave] Proxying via septorch: ${safeFilename}`);

      // Route through septorch proxy with apikey
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
