/*
  MegaPlay API Proxy (Updated for Anikoto API)
  Provides server-side access to MegaPlay anime streaming
  Uses Anikoto API for anime discovery (HiAnime successor)
  Supports AniList, MAL, and Anikoto episode IDs
*/
import express from "express";

const MEGAPLAY_BASE = "https://megaplay.buzz";
const ANIKOTO_API = "https://anikotoapi.site";

export function registerMegaPlayProxy(app: express.Express) {
  /**
   * Get anime stream embed using Anikoto episode ID
   * GET /api/megaplay/stream/anikoto/:episodeId/:language
   */
  app.get("/api/megaplay/stream/anikoto/:episodeId/:language", async (req, res) => {
    try {
      const { episodeId, language } = req.params;

      if (!episodeId || !language) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      // Validate language
      if (!["sub", "dub"].includes(language)) {
        return res.status(400).json({ error: "Language must be 'sub' or 'dub'" });
      }

      // MegaPlay endpoint: /stream/s-2/{aniwatch-ep-id}/{language}
      const streamUrl = `${MEGAPLAY_BASE}/stream/s-2/${encodeURIComponent(episodeId)}/${language}`;

      console.log(`[MegaPlay] Fetching stream: Episode ${episodeId} - ${language}`);

      const response = await fetch(streamUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          Referer: MEGAPLAY_BASE,
        },
        redirect: "follow",
      });

      if (!response.ok) {
        console.error(`[MegaPlay] Stream error: ${response.status}`);
        return res.status(response.status).json({ error: `MegaPlay returned ${response.status}` });
      }

      const contentType = response.headers.get("content-type");
      const body = await response.text();

      // Add CORS headers to allow playback
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET, OPTIONS, HEAD");
      res.header("Access-Control-Allow-Headers", "Content-Type, Range");
      res.header("Access-Control-Expose-Headers", "Content-Length, Content-Range");

      if (contentType) {
        res.header("Content-Type", contentType);
      }

      // If it's HTML (embed page), return as-is with proper headers
      if (contentType?.includes("text/html")) {
        res.header("X-Frame-Options", "ALLOWALL");
        res.header("Cache-Control", "public, max-age=3600");
        res.send(body);
      } else {
        // If it's JSON or other, parse and return
        try {
          res.json(JSON.parse(body));
        } catch {
          res.send(body);
        }
      }
    } catch (error) {
      console.error("[MegaPlay] Stream error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  /**
   * Get anime stream embed using AniList ID
   * GET /api/megaplay/stream/anilist/:anilistId/:episode/:language
   */
  app.get("/api/megaplay/stream/anilist/:anilistId/:episode/:language", async (req, res) => {
    try {
      const { anilistId, episode, language } = req.params;

      if (!anilistId || !episode || !language) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      // Validate language
      if (!["sub", "dub"].includes(language)) {
        return res.status(400).json({ error: "Language must be 'sub' or 'dub'" });
      }

      // MegaPlay endpoint: /stream/ani/{anilist-id}/{ep-num}/{language}
      const streamUrl = `${MEGAPLAY_BASE}/stream/ani/${encodeURIComponent(anilistId)}/${encodeURIComponent(episode)}/${language}`;

      console.log(`[MegaPlay] Fetching stream: AniList ${anilistId} - Episode ${episode} - ${language}`);

      const response = await fetch(streamUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          Referer: MEGAPLAY_BASE,
        },
        redirect: "follow",
      });

      if (!response.ok) {
        console.error(`[MegaPlay] Stream error: ${response.status}`);
        return res.status(response.status).json({ error: `MegaPlay returned ${response.status}` });
      }

      const contentType = response.headers.get("content-type");
      const body = await response.text();

      // Add CORS headers to allow playback
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET, OPTIONS, HEAD");
      res.header("Access-Control-Allow-Headers", "Content-Type, Range");
      res.header("Access-Control-Expose-Headers", "Content-Length, Content-Range");

      if (contentType) {
        res.header("Content-Type", contentType);
      }

      // If it's HTML (embed page), return as-is with proper headers
      if (contentType?.includes("text/html")) {
        res.header("X-Frame-Options", "ALLOWALL");
        res.header("Cache-Control", "public, max-age=3600");
        res.send(body);
      } else {
        // If it's JSON or other, parse and return
        try {
          res.json(JSON.parse(body));
        } catch {
          res.send(body);
        }
      }
    } catch (error) {
      console.error("[MegaPlay] Stream error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  /**
   * Get anime stream embed using MAL ID
   * GET /api/megaplay/stream/mal/:malId/:episode/:language
   */
  app.get("/api/megaplay/stream/mal/:malId/:episode/:language", async (req, res) => {
    try {
      const { malId, episode, language } = req.params;

      if (!malId || !episode || !language) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      // Validate language
      if (!["sub", "dub"].includes(language)) {
        return res.status(400).json({ error: "Language must be 'sub' or 'dub'" });
      }

      // MegaPlay endpoint: /stream/mal/{mal-id}/{ep-num}/{language}
      const streamUrl = `${MEGAPLAY_BASE}/stream/mal/${encodeURIComponent(malId)}/${encodeURIComponent(episode)}/${language}`;

      console.log(`[MegaPlay] Fetching stream: MAL ${malId} - Episode ${episode} - ${language}`);

      const response = await fetch(streamUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          Referer: MEGAPLAY_BASE,
        },
        redirect: "follow",
      });

      if (!response.ok) {
        console.error(`[MegaPlay] Stream error: ${response.status}`);
        return res.status(response.status).json({ error: `MegaPlay returned ${response.status}` });
      }

      const contentType = response.headers.get("content-type");
      const body = await response.text();

      // Add CORS headers to allow playback
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET, OPTIONS, HEAD");
      res.header("Access-Control-Allow-Headers", "Content-Type, Range");
      res.header("Access-Control-Expose-Headers", "Content-Length, Content-Range");

      if (contentType) {
        res.header("Content-Type", contentType);
      }

      // If it's HTML (embed page), return as-is with proper headers
      if (contentType?.includes("text/html")) {
        res.header("X-Frame-Options", "ALLOWALL");
        res.header("Cache-Control", "public, max-age=3600");
        res.send(body);
      } else {
        // If it's JSON or other, parse and return
        try {
          res.json(JSON.parse(body));
        } catch {
          res.send(body);
        }
      }
    } catch (error) {
      console.error("[MegaPlay] Stream error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  /**
   * Get anime series info from Anikoto API
   * GET /api/megaplay/series/:seriesId
   */
  app.get("/api/megaplay/series/:seriesId", async (req, res) => {
    try {
      const { seriesId } = req.params;

      if (!seriesId) {
        return res.status(400).json({ error: "Series ID required" });
      }

      const seriesUrl = `${ANIKOTO_API}/series/${encodeURIComponent(seriesId)}`;

      console.log(`[Anikoto] Fetching series: ${seriesId}`);

      const response = await fetch(seriesUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        console.error(`[Anikoto] Series error: ${response.status}`);
        return res.status(response.status).json({ error: "Failed to fetch series info" });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("[Anikoto] Series error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  /**
   * Get recent anime from Anikoto API
   * GET /api/megaplay/recent?page=1&per_page=20
   */
  app.get("/api/megaplay/recent", async (req, res) => {
    try {
      const page = req.query.page || "1";
      const perPage = req.query.per_page || "20";

      const recentUrl = `${ANIKOTO_API}/recent-anime?page=${page}&per_page=${perPage}`;

      console.log(`[Anikoto] Fetching recent anime: page ${page}`);

      const response = await fetch(recentUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        console.error(`[Anikoto] Recent error: ${response.status}`);
        return res.status(response.status).json({ error: "Failed to fetch recent anime" });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("[Anikoto] Recent error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  /**
   * Health check for MegaPlay and Anikoto
   * GET /api/megaplay/health
   */
  app.get("/api/megaplay/health", async (req, res) => {
    try {
      const megaplayCheck = fetch(`${MEGAPLAY_BASE}/`, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        redirect: "follow",
      });

      const anikotoCheck = fetch(`${ANIKOTO_API}/`, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      const [megaplayResponse, anikotoResponse] = await Promise.all([megaplayCheck, anikotoCheck]);

      const status = {
        megaplay: megaplayResponse.ok ? "ok" : "error",
        anikoto: anikotoResponse.ok ? "ok" : "error",
      };

      const allOk = status.megaplay === "ok" && status.anikoto === "ok";
      res.status(allOk ? 200 : 503).json(status);
    } catch (error) {
      console.error("[MegaPlay] Health check error:", error);
      res.status(503).json({ status: "error", megaplay: "error", anikoto: "error" });
    }
  });
}
