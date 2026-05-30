/*
  AyoMedia Proxy
  Proxies requests to gateway.ayohost.site to avoid CORS issues in the browser.
*/

import express from "express";

const AYOMEDIA_BASE = "https://gateway.ayohost.site";
const API_KEY = "ayomedia_WscUWnJtbN2NBHdnAAc9w3w7GHRbQq21s0YTREzAdms";

const defaultHeaders = {
  "X-API-Key": API_KEY,
  "Content-Type": "application/json",
  "User-Agent": "Zentrix-Live/1.0",
};

async function proxyGet(url: string, res: express.Response) {
  try {
    const response = await fetch(url, { headers: defaultHeaders });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error("[AyoMedia] GET error:", err);
    res.status(500).json({ error: "AyoMedia proxy error" });
  }
}

export function registerAyoMediaProxy(app: express.Express) {
  // Search anime by title
  app.get("/api/ayomedia/search", async (req, res) => {
    const q = req.query.q as string;
    if (!q) return res.status(400).json({ error: "Missing query" });
    console.log("[AyoMedia] Search:", q);
    await proxyGet(`${AYOMEDIA_BASE}/anime/api/search?q=${encodeURIComponent(q)}&api_key=${API_KEY}`, res);
  });

  // Get episodes for an anime
  app.get("/api/ayomedia/anime/:slug/episodes", async (req, res) => {
    const { slug } = req.params;
    console.log("[AyoMedia] Episodes:", slug);
    await proxyGet(`${AYOMEDIA_BASE}/anime/api/anime/${slug}/episodes?api_key=${API_KEY}`, res);
  });

  // Get stream URL for download
  app.get("/api/ayomedia/stream", async (req, res) => {
    const { anime_slug, episode_session } = req.query as { anime_slug: string; episode_session: string };
    if (!anime_slug || !episode_session) {
      return res.status(400).json({ error: "Missing anime_slug or episode_session" });
    }
    console.log("[AyoMedia] Stream:", anime_slug, "ep:", episode_session);
    await proxyGet(
      `${AYOMEDIA_BASE}/anime/api/stream?anime_slug=${encodeURIComponent(anime_slug)}&episode_session=${encodeURIComponent(episode_session)}&api_key=${API_KEY}`,
      res
    );
  });

  // Start download job
  app.post("/api/ayomedia/download", async (req, res) => {
    const { anime_title, episode_number, anime_slug, episode_session } = req.body;
    if (!anime_title || !episode_number || !anime_slug || !episode_session) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    console.log("[AyoMedia] Download:", anime_title, "ep:", episode_number);
    try {
      const response = await fetch(`${AYOMEDIA_BASE}/anime/api/download`, {
        method: "POST",
        headers: defaultHeaders,
        body: JSON.stringify({ anime_title, episode_number, anime_slug, episode_session }),
      });
      const data = await response.json();
      res.status(response.status).json(data);
    } catch (err) {
      console.error("[AyoMedia] Download error:", err);
      res.status(500).json({ error: "AyoMedia download proxy error" });
    }
  });

  // Poll download job status
  app.get("/api/ayomedia/download/:id/status", async (req, res) => {
    const { id } = req.params;
    console.log("[AyoMedia] Poll status:", id);
    await proxyGet(`${AYOMEDIA_BASE}/anime/api/download/${id}/status?api_key=${API_KEY}`, res);
  });

  // Search movie by title — fixed URL format
  app.get("/api/ayomedia/movie/search", async (req, res) => {
    const q = req.query.q as string;
    if (!q) return res.status(400).json({ error: "Missing query" });
    console.log("[AyoMedia] Movie Search:", q);
    await proxyGet(`${AYOMEDIA_BASE}/movie/api/search/${encodeURIComponent(q)}?api_key=${API_KEY}`, res);
  });

  // Get movie sources (download links)
  app.get("/api/ayomedia/movie/:id/sources", async (req, res) => {
    const { id } = req.params;
    console.log("[AyoMedia] Movie Sources:", id);
    await proxyGet(`${AYOMEDIA_BASE}/movie/api/sources/${id}?api_key=${API_KEY}`, res);
  });
}
