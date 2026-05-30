/**
 * AnimeDownloadButton — fetches MP4 link via OmniSave API,
 * then proxies the file through our server to bypass CDN restrictions.
 */

import { useState, useCallback } from "react";
import { Download, Loader2, CheckCircle, XCircle } from "lucide-react";

interface Props {
  animeTitle: string;
  episodeNumber: number;
}

type Status = "idle" | "finding" | "getting_ep" | "resolving" | "done" | "error";

export default function AnimeDownloadButton({ animeTitle, episodeNumber }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [proxyUrl, setProxyUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClick = useCallback(async () => {
    // If already resolved, just trigger download again
    if (status === "done" && proxyUrl) {
      const a = document.createElement("a");
      a.href = proxyUrl;
      a.download = `${animeTitle.replace(/[^a-zA-Z0-9]/g, "_")}_EP${episodeNumber}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    if (status !== "idle" && status !== "error") return;

    setError(null);
    setStatus("finding");

    try {
      // Step 1: Get the CDN URL from our backend
      setStatus("getting_ep");
      const res = await fetch(
        `/api/download/anime?anime_title=${encodeURIComponent(animeTitle)}&episode_number=${episodeNumber}`
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();

      if (!data.download_url) {
        throw new Error("Download URL not found in response");
      }

      // Step 2: Build a proxy URL that streams through our server
      // This bypasses the CDN's Referer check that causes ACCESS DENIED
      setStatus("resolving");
      const safeFilename = `${animeTitle.replace(/[^a-zA-Z0-9]/g, "_")}_EP${episodeNumber}.mp4`;
      const proxied = `/api/download/anime/file?url=${encodeURIComponent(data.download_url)}&filename=${encodeURIComponent(safeFilename)}`;

      setProxyUrl(proxied);
      setStatus("done");

      // Trigger download directly without opening a new tab
      const a = document.createElement("a");
      a.href = proxied;
      a.download = safeFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e: any) {
      console.error("[AnimeDownload] Error:", e);
      setStatus("error");
      setError(e.message || "Download failed");
    }
  }, [status, proxyUrl, animeTitle, episodeNumber]);

  const label = () => {
    switch (status) {
      case "finding":    return "Finding...";
      case "getting_ep": return "Getting ep...";
      case "resolving":  return "Preparing...";
      case "done":       return "Download Again";
      case "error":      return "Retry";
      default:           return "Download";
    }
  };

  const isLoading = ["finding", "getting_ep", "resolving"].includes(status);

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
        title={error ?? `Download Episode ${episodeNumber}`}
        className={`flex items-center justify-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${btnClass()}`}
      >
        {isLoading
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : status === "done"
          ? <CheckCircle className="w-3.5 h-3.5" />
          : status === "error"
          ? <XCircle className="w-3.5 h-3.5" />
          : <Download className="w-3.5 h-3.5" />}
        {label()}
      </button>
      {error && (
        <p className="text-[10px] text-red-400 truncate text-center mt-1" title={error}>
          {error}
        </p>
      )}
    </div>
  );
}
