import express from "express";

const API_BASE = "https://h5-api.aoneroom.com";

const HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  Accept: "application/json",
  "Content-Type": "application/json",
  "X-Source": "downloader",
  Origin: "https://videodownloader.site",
  Referer: "https://videodownloader.site/",
};

// ─────────────────────────────────────────────
// Step 1: Search OmniSave for anime title
// ─────────────────────────────────────────────
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
    type: item.subjectType, // 1 = Movie, 2 = TV/Anime
    detailPath: item.detailPath,
  }));
}

// ─────────────────────────────────────────────
// Step 2: Find which season an episode lives in
// ─────────────────────────────────────────────
async function findSeasonForEpisode(
  subjectId: string,
  detailPath: string,
  targetEp: number
): Promise<{ season: number; episode: number } | null> {
  const url = `${API_BASE}/wefeed-h5api-bff/subject/download`;

  // Try each season until we find one that has the target episode
  for (let season = 1; season <= 10; season++) {
    // First check if this season exists at all (ep 1)
    const checkRes = await fetch(
      `${url}?subjectId=${subjectId}&se=${season}&ep=1&detailPath=${encodeURIComponent(detailPath)}`,
      { headers: HEADERS }
    );
    if (!checkRes.ok) break;
    const checkData = await checkRes.json();
    if (!checkData?.data?.hasResource) break;

    // Now check if the target episode exists in this season
    const epRes = await fetch(
      `${url}?subjectId=${subjectId}&se=${season}&ep=${targetEp}&detailPath=${encodeURIComponent(detailPath)}`,
      { headers: HEADERS }
    );
    if (!epRes.ok) continue;
    const epData = await epRes.json();
    if (epData?.data?.hasResource) {
      return { season, episode: targetEp };
    }
  }

  // Fallback: episode 1 of season 1 (movies)
  return { season: 1, episode: 1 };
}

// ─────────────────────────────────────────────
// Step 3: Get download link for season/episode
// ─────────────────────────────────────────────
async function getDownloadLink(
  subjectId: string,
  detailPath: string,
  season: number,
  episode: number,
  preferredQuality?: number // e.g. 1080, 720, 480, 360
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

  // Sort by resolution descending, pick preferred or best available
  const sorted = [...downloads].sort(
    (a, b) => parseInt(b.resolution) - parseInt(a.resolution)
  );

  let chosen = sorted[0]; // default: highest quality
  if (preferredQuality) {
    const match = sorted.find((d) => parseInt(d.resolution) === preferredQuality);
    if (match) chosen = match;
  }

  return {
    downloadUrl: chosen.url as string,
    quality: `${chosen.resolution}P`,
    sizeMb: Math.round(parseInt(chosen.size) / (1024 * 1024) * 100) / 100,
    codec: chosen.codecName as string,
    subtitles: captions.map((c: any) => ({
      language: c.lanName,
      code: c.lan,
      url: c.url,
    })),
  };
}

// ─────────────────────────────────────────────
// Register the Express route
// ─────────────────────────────────────────────
export function registerAnimePaheProxy(app: express.Express) {
  /**
   * GET /api/download/anime
   * Query params:
   *   anime_title    - string  (required)
   *   episode_number - number  (required)
   *   quality        - number  (optional, e.g. 1080, 720, 480, 360)
   */
  app.get("/api/download/anime", async (req, res) => {
    try {
      const { anime_title, episode_number, quality } = req.query;

      if (!anime_title || !episode_number) {
        return res
          .status(400)
          .json({ error: "Missing anime_title or episode_number" });
      }

      const epNum = parseInt(episode_number as string);
      const qualityNum = quality ? parseInt(quality as string) : undefined;

      console.log(`[OmniSave] Search: "${anime_title}", Episode: ${epNum}`);

      // 1. Search
      const results = await searchAnime(anime_title as string);
      if (!results.length) {
        return res.status(404).json({ error: "Anime not found on OmniSave" });
      }

      const anime = results[0];
      console.log(`[OmniSave] Found: ${anime.title} (ID: ${anime.subjectId})`);

      // 2. Find season for this episode
      const location = await findSeasonForEpisode(
        anime.subjectId,
        anime.detailPath,
        epNum
      );

      if (!location) {
        return res
          .status(404)
          .json({ error: `Episode ${epNum} not found for ${anime.title}` });
      }

      console.log(
        `[OmniSave] Resolved → Season ${location.season}, Episode ${location.episode}`
      );

      // 3. Get download link
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
      return res
        .status(500)
        .json({ error: error.message || "Internal server error" });
    }
  });

  /**
   * GET /api/anime/search
   * Quick search endpoint — returns list of matching anime
   * Query params: q (string)
   */
  app.get("/api/anime/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) return res.status(400).json({ error: "Missing query param: q" });

      const results = await searchAnime(q as string);
      return res.json({ results });
    } catch (error: any) {
      console.error("[OmniSave] Search error:", error);
      return res.status(500).json({ error: error.message });
    }
  });
}
