/*
  Septorch / GZMovie Proxy
  Proxies requests to gzmovieboxapi.septorch.tech to avoid CORS issues in the browser.
*/

import express from "express";

const SEPTORCH_BASE = "https://gzmovieboxapi.septorch.tech";
const API_KEY = "Godszeal";

const defaultHeaders = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
};

async function proxyGet(url: string, res: express.Response) {
  try {
    const response = await fetch(url, { headers: defaultHeaders });
    if (!response.ok) {
      return res.status(response.status).json({ error: `Upstream error: ${response.status}` });
    }
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    console.error("[Septorch] GET error:", err);
    res.status(500).json({ error: "Septorch proxy error" });
  }
}

export function registerSeptorchProxy(app: express.Express) {
  // Search movies/series
  app.get("/api/septorch/search", async (req, res) => {
    const q = req.query.q as string;
    const page = req.query.page || 1;
    if (!q) return res.status(400).json({ error: "Missing query" });
    console.log("[Septorch] Search:", q);
    await proxyGet(
      `${SEPTORCH_BASE}/api/search?query=${encodeURIComponent(q)}&page=${page}&perPage=24&apikey=${API_KEY}`,
      res
    );
  });

  // Get download/stream sources for a movie or TV episode
  // subjectType 1 = movie, 2 = series
  // For movies: season=0, episode=0
  // For series: provide season and episode numbers
  app.get("/api/septorch/media", async (req, res) => {
    const { subjectId, detailPath, season = 0, episode = 0 } = req.query;
    if (!subjectId || !detailPath) {
      return res.status(400).json({ error: "Missing subjectId or detailPath" });
    }
    console.log("[Septorch] Media:", subjectId, "S:", season, "E:", episode);
    await proxyGet(
      `${SEPTORCH_BASE}/api/media?subjectId=${subjectId}&detailPath=${encodeURIComponent(detailPath as string)}&season=${season}&episode=${episode}&apikey=${API_KEY}`,
      res
    );
  });
}
