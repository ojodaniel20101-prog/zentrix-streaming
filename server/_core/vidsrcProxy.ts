/*
  VidSrc.Wiki Proxy (Updated 2025)
  Provides server-side access to VidSrc.Wiki streaming API
  Supports both movies and TV shows with iframe embedding
*/
import express from "express";

const VIDSRC_BASE = "https://vidsrc.wiki";

export function registerVidSrcProxy(app: express.Express) {
  /**
   * Get movie embed URL
   * GET /api/vidsrc/movie/:tmdbId
   * Returns: { embedUrl: string, embedCode: string }
   */
  app.get("/api/vidsrc/movie/:tmdbId", async (req, res) => {
    try {
      const { tmdbId } = req.params;
      if (!tmdbId || !/^\d+$/.test(tmdbId)) {
        return res.status(400).json({ error: "Invalid TMDB ID" });
      }

      const embedUrl = `${VIDSRC_BASE}/embed/movie/${tmdbId}`;
      console.log(`[VidSrc] Movie embed URL: ${embedUrl}`);

      // Return embed URL and iframe code
      res.json({
        embedUrl,
        embedCode: `<iframe src="${embedUrl}" width="100%" height="100%" frameborder="0" scrolling="no" allowfullscreen></iframe>`,
        type: "movie",
        tmdbId,
      });
    } catch (error) {
      console.error("[VidSrc] Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  /**
   * Get TV show embed URL
   * GET /api/vidsrc/tv/:tmdbId/:season/:episode
   * Returns: { embedUrl: string, embedCode: string }
   */
  app.get("/api/vidsrc/tv/:tmdbId/:season/:episode", async (req, res) => {
    try {
      const { tmdbId, season, episode } = req.params;
      if (
        !tmdbId ||
        !/^\d+$/.test(tmdbId) ||
        !season ||
        !/^\d+$/.test(season) ||
        !episode ||
        !/^\d+$/.test(episode)
      ) {
        return res.status(400).json({ error: "Invalid parameters" });
      }

      const embedUrl = `${VIDSRC_BASE}/embed/tv/${tmdbId}/${season}/${episode}`;
      console.log(`[VidSrc] TV embed URL: ${embedUrl}`);

      // Return embed URL and iframe code
      res.json({
        embedUrl,
        embedCode: `<iframe src="${embedUrl}" width="100%" height="100%" frameborder="0" scrolling="no" allowfullscreen></iframe>`,
        type: "tv",
        tmdbId,
        season: parseInt(season),
        episode: parseInt(episode),
      });
    } catch (error) {
      console.error("[VidSrc] Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  /**
   * Proxy movie embed page (with headers to bypass restrictions)
   * GET /api/vidsrc/proxy/movie/:tmdbId
   */
  app.get("/api/vidsrc/proxy/movie/:tmdbId", async (req, res) => {
    try {
      const { tmdbId } = req.params;
      if (!tmdbId || !/^\d+$/.test(tmdbId)) {
        return res.status(400).json({ error: "Invalid TMDB ID" });
      }

      const embedUrl = `${VIDSRC_BASE}/embed/movie/${tmdbId}`;
      console.log(`[VidSrc] Proxying movie embed: ${embedUrl}`);

      const response = await fetch(embedUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Referer: "https://vidsrc.wiki/",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Accept-Encoding": "gzip, deflate",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
          "Sec-Fetch-Dest": "iframe",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "same-origin",
        },
      });

      if (!response.ok) {
        console.error(`[VidSrc] Failed to fetch: ${response.status}`);
        return res.status(response.status).json({ error: "Failed to fetch embed" });
      }

      // Set proper headers to serve as HTML
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("X-Frame-Options", "ALLOWALL");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "public, max-age=3600");

      // Stream the response
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error("[VidSrc] Proxy error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  /**
   * Proxy TV show embed page (with headers to bypass restrictions)
   * GET /api/vidsrc/proxy/tv/:tmdbId/:season/:episode
   */
  app.get("/api/vidsrc/proxy/tv/:tmdbId/:season/:episode", async (req, res) => {
    try {
      const { tmdbId, season, episode } = req.params;
      if (
        !tmdbId ||
        !/^\d+$/.test(tmdbId) ||
        !season ||
        !/^\d+$/.test(season) ||
        !episode ||
        !/^\d+$/.test(episode)
      ) {
        return res.status(400).json({ error: "Invalid parameters" });
      }

      const embedUrl = `${VIDSRC_BASE}/embed/tv/${tmdbId}/${season}/${episode}`;
      console.log(`[VidSrc] Proxying TV embed: ${embedUrl}`);

      const response = await fetch(embedUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Referer: "https://vidsrc.wiki/",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Accept-Encoding": "gzip, deflate",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
          "Sec-Fetch-Dest": "iframe",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "same-origin",
        },
      });

      if (!response.ok) {
        console.error(`[VidSrc] Failed to fetch: ${response.status}`);
        return res.status(response.status).json({ error: "Failed to fetch embed" });
      }

      // Set proper headers to serve as HTML
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("X-Frame-Options", "ALLOWALL");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "public, max-age=3600");

      // Stream the response
      const buffer = await response.arrayBuffer();
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error("[VidSrc] Proxy error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  /**
   * Health check for VidSrc.Wiki
   * GET /api/vidsrc/health
   */
  app.get("/api/vidsrc/health", async (req, res) => {
    try {
      const response = await fetch(`${VIDSRC_BASE}/`, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        redirect: "follow",
      });

      if (response.ok) {
        return res.json({ status: "ok", service: "VidSrc.Wiki" });
      } else {
        return res.status(response.status).json({ status: "error", service: "VidSrc.Wiki" });
      }
    } catch (error) {
      console.error("[VidSrc] Health check error:", error);
      res.status(500).json({ status: "error", service: "VidSrc.Wiki" });
    }
  });
}
