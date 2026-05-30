/*
  AniList GraphQL Proxy
  Handles GraphQL requests to AniList API with caching and error handling
*/

import express from "express";

const ANILIST_API = "https://graphql.anilist.co";
const CACHE = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 3600000; // 1 hour

export function registerAniListProxy(app: express.Express) {
  app.post("/api/anilist", async (req, res) => {
    try {
      const { query, variables } = req.body;

      if (!query) {
        return res.status(400).json({ error: "Missing query" });
      }

      // Create cache key from query and variables
      const cacheKey = JSON.stringify({ query, variables });
      const cached = CACHE.get(cacheKey);

      // Return cached result if available and not expired
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log("[AniList] Cache hit");
        return res.json(cached.data);
      }

      // Fetch from AniList
      console.log("[AniList] Fetching from API");
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch(ANILIST_API, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "User-Agent": "Zentrix-Live/1.0",
          },
          body: JSON.stringify({ query, variables }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          console.error(`[AniList] HTTP ${response.status}`);
          return res.status(response.status).json({ error: `AniList API error: ${response.status}` });
        }

        const data = await response.json();

        if (data.errors) {
          console.error("[AniList] GraphQL errors:", data.errors);
          return res.status(400).json({ errors: data.errors });
        }

        // Cache successful response
        CACHE.set(cacheKey, { data, timestamp: Date.now() });

        // Clean up old cache entries
        if (CACHE.size > 100) {
          const entries = Array.from(CACHE.entries());
          entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
          for (let i = 0; i < 20; i++) {
            CACHE.delete(entries[i][0]);
          }
        }

        res.json(data);
      } catch (error) {
        clearTimeout(timeout);
        if (error instanceof Error && error.name === "AbortError") {
          console.error("[AniList] Request timeout");
          return res.status(504).json({ error: "AniList API timeout" });
        }
        throw error;
      }
    } catch (error) {
      console.error("[AniList] Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}
