/*
  GoGoAnime API Proxy
  Provides server-side access to GoGoAnime anime streaming API
  Supports searching anime and fetching episode streams
*/
import express from "express";

const GOGOANIME_API_BASE = "https://api.consumet.org/anime/gogoanime";
const GOGOANIME_ALT = "https://api.jikan.moe/v4"; // Fallback to Jikan API

interface GoGoAnimeSearchResult {
  id: string;
  title: string;
  image?: string;
  releaseDate?: string;
  type?: string;
}

interface GoGoAnimeEpisode {
  id: string;
  number: number;
  title?: string;
  image?: string;
  description?: string;
  url?: string;
}

interface GoGoAnimeInfo {
  id: string;
  title: string;
  image?: string;
  description?: string;
  genres?: string[];
  status?: string;
  episodes?: GoGoAnimeEpisode[];
  totalEpisodes?: number;
  type?: string;
  releaseDate?: string;
}

interface GoGoAnimeStream {
  headers?: Record<string, string>;
  sources?: Array<{
    url: string;
    quality?: string;
    isM3U8?: boolean;
  }>;
  download?: string;
}

export function registerGoGoAnimeProxy(app: express.Express) {
  /**
   * Search for anime
   * GET /api/gogoanime/search?query=One%20Piece
   */
  app.get("/api/gogoanime/search", async (req, res) => {
    try {
      const { query, page = "1" } = req.query;

      if (!query || typeof query !== "string") {
        return res.status(400).json({ error: "Query parameter required" });
      }

      if (query.length < 2) {
        return res.status(400).json({ error: "Query must be at least 2 characters" });
      }

      const searchUrl = `${GOGOANIME_API_BASE}/search?query=${encodeURIComponent(query)}&page=${page}`;

      console.log(`[GoGoAnime] Searching: ${query}`);

      const response = await fetch(searchUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        console.error(`[GoGoAnime] Search error: ${response.status}`);
        // Fallback to Jikan API
        const jikanUrl = `${GOGOANIME_ALT}/anime?query=${encodeURIComponent(query)}&page=${page}`;
        const jikanResponse = await fetch(jikanUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            Accept: "application/json",
          },
        });

        if (!jikanResponse.ok) {
          return res.status(jikanResponse.status).json({ error: "Failed to search anime" });
        }

        const jikanData = await jikanResponse.json();
        // Transform Jikan data to match expected format
        const transformed = {
          results: (jikanData.data || []).map((item: any) => ({
            id: item.mal_id.toString(),
            title: item.title,
            image: item.images?.jpg?.image_url,
            releaseDate: item.aired?.from,
            type: item.type,
          })),
        };
        return res.json(transformed);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("[GoGoAnime] Search error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  /**
   * Get anime info
   * GET /api/gogoanime/info/:animeId
   */
  app.get("/api/gogoanime/info/:animeId", async (req, res) => {
    try {
      const { animeId } = req.params;

      if (!animeId || !/^[\w-]+$/.test(animeId)) {
        return res.status(400).json({ error: "Invalid anime ID" });
      }

      const infoUrl = `${GOGOANIME_API_BASE}/info?id=${encodeURIComponent(animeId)}`;

      console.log(`[GoGoAnime] Fetching info: ${animeId}`);

      const response = await fetch(infoUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        console.error(`[GoGoAnime] Info error: ${response.status}`);
        return res.status(response.status).json({ error: "Failed to fetch anime info" });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("[GoGoAnime] Info error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  /**
   * Get episode stream
   * GET /api/gogoanime/watch/:episodeId?audio=sub
   */
  app.get("/api/gogoanime/watch/:episodeId", async (req, res) => {
    try {
      const { episodeId } = req.params;
      const { audio = "sub" } = req.query;

      if (!episodeId || !/^[\w-]+$/.test(episodeId)) {
        return res.status(400).json({ error: "Invalid episode ID" });
      }

      const watchUrl = `${GOGOANIME_API_BASE}/watch/${encodeURIComponent(episodeId)}`;

      console.log(`[GoGoAnime] Fetching stream: ${episodeId}`);

      const response = await fetch(watchUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        console.error(`[GoGoAnime] Stream error: ${response.status}`);
        return res.status(response.status).json({ error: "Failed to fetch stream" });
      }

      const data = await response.json();

      // Add CORS headers
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Content-Type");

      res.json(data);
    } catch (error) {
      console.error("[GoGoAnime] Stream error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  /**
   * Health check
   * GET /api/gogoanime/health
   */
  app.get("/api/gogoanime/health", async (req, res) => {
    try {
      const testUrl = `${GOGOANIME_API_BASE}/search?query=one&page=1`;

      const response = await fetch(testUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (response.ok) {
        return res.json({ status: "ok", service: "GoGoAnime" });
      } else {
        return res.status(response.status).json({ status: "error", service: "GoGoAnime" });
      }
    } catch (error) {
      console.error("[GoGoAnime] Health check error:", error);
      res.status(500).json({ status: "error", service: "GoGoAnime" });
    }
  });
}
