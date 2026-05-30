/**
 * MovieDownloadButton — calls /api/ayomedia/movie/* proxy to get download links
 */

import { useState, useCallback } from "react";
import { Download, Loader2, CheckCircle, XCircle } from "lucide-react";

interface Props {
  movieTitle: string;
}

type Status = "idle" | "searching" | "resolving" | "done" | "error";

export default function MovieDownloadButton({ movieTitle }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClick = useCallback(async () => {
    if (status === "done" && downloadUrl) {
      window.open(downloadUrl, "_blank");
      return;
    }
    
    if (status !== "idle" && status !== "error") return;

    setError(null);
    setStatus("searching");

    try {
      // 1. Search for the movie
      const searchRes = await fetch(`/api/ayomedia/movie/search?q=${encodeURIComponent(movieTitle)}`);
      if (!searchRes.ok) throw new Error(`Search failed: HTTP ${searchRes.status}`);
      const searchData = await searchRes.json();
      
      const results = searchData.data || searchData.results || [];
      if (!results.length) throw new Error(`"${movieTitle}" not found`);
      
      // Pick best match
      const match = results.find((r: any) => r.title?.toLowerCase() === movieTitle.toLowerCase()) || results[0];
      const movieId = match.id || match.resourceId;
      if (!movieId) throw new Error("Could not get movie ID");

      setStatus("resolving");

      // 2. Get download links
      const sourcesRes = await fetch(`/api/ayomedia/movie/${movieId}/sources`);
      if (!sourcesRes.ok) throw new Error(`Sources failed: HTTP ${sourcesRes.status}`);
      const sourcesData = await sourcesRes.json();
      
      const sources = sourcesData.data || sourcesData.results || [];
      if (!sources.length) throw new Error("No download links available");

      // Pick highest quality
      const bestSource = [...sources].sort((a, b) => (b.resolution || 0) - (a.resolution || 0))[0];
      const url = bestSource.download_url || bestSource.url || bestSource.stream_url;

      if (!url) throw new Error("Direct download URL not found");

      setDownloadUrl(url);
      setStatus("done");
      window.open(url, "_blank");
    } catch (e: any) {
      console.error("[MovieDownload] Error:", e);
      setStatus("error");
      setError(e.message || "Download failed");
    }
  }, [status, downloadUrl, movieTitle]);

  const label = () => {
    switch (status) {
      case "searching": return "Finding...";
      case "resolving":  return "Resolving...";
      case "done":      return "Open File";
      case "error":     return "Retry";
      default:          return "Download Movie";
    }
  };

  const isLoading = ["searching", "resolving"].includes(status);

  const btnClass = () => {
    if (status === "done")  return "bg-green-500/20 text-green-400 border-green-500/40 hover:bg-green-500/30";
    if (status === "error") return "bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30";
    if (isLoading)          return "bg-[#00D4FF]/10 text-[#00D4FF] border-[#00D4FF]/30 cursor-wait";
    return "bg-white/5 text-[#8899AA] border-white/10 hover:bg-[#00D4FF]/20 hover:text-[#00D4FF] hover:border-[#00D4FF]/40";
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <button
        onClick={handleClick}
        disabled={isLoading}
        title={error ?? `Download ${movieTitle}`}
        className={`flex items-center justify-center gap-2 w-full px-4 py-2 rounded-xl text-sm font-bold transition-all border ${btnClass()}`}
      >
        {isLoading
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : status === "done"
          ? <CheckCircle className="w-4 h-4" />
          : status === "error"
          ? <XCircle className="w-4 h-4" />
          : <Download className="w-4 h-4" />}
        {label()}
      </button>
      {error && <p className="text-[10px] text-red-400 truncate text-center mt-1" title={error}>{error}</p>}
    </div>
  );
}
