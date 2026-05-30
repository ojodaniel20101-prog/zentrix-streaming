/*
  DropFile API Proxy
  Provides server-side access to DropFile anime streaming API
  Supports MAL, AniList, IMDB, and TMDB IDs
  API Key: df_db0e7484d7f6bb353a43c5c15f5274ed
*/
import express from "express";

const DROPFILE_API_BASE = "https://dropfile.cc/api/anime/embed";
const DROPFILE_API_KEY = "df_db0e7484d7f6bb353a43c5c15f5274ed";

interface DropFileResponse {
  status: string;
  anime?: {
    title: string;
    ids: {
      imdb?: string;
      tmdb?: number;
      mal?: number;
      anilist?: number;
    };
  };
  stream?: {
    provider: string;
    audio: string;
    embed_url: string;
    proxied_sources: Array<{
      url: string;
      isM3U8: boolean;
    }>;
    sources: Array<{
      url: string;
      quality: string;
      isM3U8: boolean;
    }>;
  };
  embed?: {
    iframe_tag: string;
    direct_src: string;
  };
  error?: string;
}

export function registerDropFileProxy(app: express.Express) {
  /**
   * Get anime stream data from DropFile API
   * GET /api/dropfile/tv/:idType/:id/:season/:episode
   * idType: mal, anilist, imdb, tmdb
   */
  app.get("/api/dropfile/tv/:idType/:id/:season/:episode", async (req, res) => {
    try {
      const { idType, id, season, episode } = req.params;
      const { audio = "sub", lang = "en" } = req.query;

      // Validate parameters
      if (!["mal", "anilist", "imdb", "tmdb"].includes(idType)) {
        return res.status(400).json({ error: "Invalid ID type" });
      }

      if (!id || !/^[\w-]+$/.test(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      if (!season || !/^\d+$/.test(season)) {
        return res.status(400).json({ error: "Invalid season number" });
      }

      if (!episode || !/^\d+$/.test(episode)) {
        return res.status(400).json({ error: "Invalid episode number" });
      }

      // Build DropFile API URL
      const idPrefix = idType === "mal" ? "mal-" : idType === "anilist" ? "anilist-" : idType === "imdb" ? "" : "";
      const fullId = idType === "imdb" ? id : `${idPrefix}${id}`;

      const dropfileUrl = `${DROPFILE_API_BASE}/tv/${fullId}/${season}/${episode}?audio=${audio}&lang=${lang}&api_key=${DROPFILE_API_KEY}`;

      console.log(`[DropFile] Fetching: ${dropfileUrl}`);

      const response = await fetch(dropfileUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        console.error(`[DropFile] API error: ${response.status}`);
        return res.status(response.status).json({ error: "Failed to fetch from DropFile API" });
      }

      const data: DropFileResponse = await response.json();

      if (data.status !== "ok") {
        console.error(`[DropFile] API returned error: ${data.error}`);
        return res.status(400).json({ error: data.error || "DropFile API error" });
      }

      // Return stream data
      res.json(data);
    } catch (error) {
      console.error("[DropFile] Proxy error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  /**
   * Get anime movie stream data from DropFile API
   * GET /api/dropfile/movie/:idType/:id
   */
  app.get("/api/dropfile/movie/:idType/:id", async (req, res) => {
    try {
      const { idType, id } = req.params;
      const { audio = "sub", lang = "en" } = req.query;

      // Validate parameters
      if (!["mal", "anilist", "imdb", "tmdb"].includes(idType)) {
        return res.status(400).json({ error: "Invalid ID type" });
      }

      if (!id || !/^[\w-]+$/.test(id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      // Build DropFile API URL
      const idPrefix = idType === "mal" ? "mal-" : idType === "anilist" ? "anilist-" : idType === "imdb" ? "" : "";
      const fullId = idType === "imdb" ? id : `${idPrefix}${id}`;

      const dropfileUrl = `${DROPFILE_API_BASE}/movie/${fullId}?audio=${audio}&lang=${lang}&api_key=${DROPFILE_API_KEY}`;

      console.log(`[DropFile] Fetching: ${dropfileUrl}`);

      const response = await fetch(dropfileUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        console.error(`[DropFile] API error: ${response.status}`);
        return res.status(response.status).json({ error: "Failed to fetch from DropFile API" });
      }

      const data: DropFileResponse = await response.json();

      if (data.status !== "ok") {
        console.error(`[DropFile] API returned error: ${data.error}`);
        return res.status(400).json({ error: data.error || "DropFile API error" });
      }

      // Return stream data
      res.json(data);
    } catch (error) {
      console.error("[DropFile] Proxy error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  /**
   * Test DropFile API connectivity
   * GET /api/dropfile/health
   */
  app.get("/api/dropfile/health", async (req, res) => {
    try {
      // Test with a known anime (One Piece - MAL ID 21)
      const testUrl = `${DROPFILE_API_BASE}/tv/mal-21/1/1?audio=sub&lang=en&api_key=${DROPFILE_API_KEY}`;

      const response = await fetch(testUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        res.json({
          status: "ok",
          dropfile_api: data.status === "ok" ? "connected" : "error",
          message: "DropFile API is operational",
        });
      } else {
        res.status(response.status).json({
          status: "error",
          dropfile_api: "disconnected",
          message: `DropFile API returned ${response.status}`,
        });
      }
    } catch (error) {
      console.error("[DropFile] Health check error:", error);
      res.status(500).json({
        status: "error",
        dropfile_api: "error",
        message: "Failed to connect to DropFile API",
      });
    }
  });
}
