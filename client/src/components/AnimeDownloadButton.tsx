/**
 * AnimeDownloadButton — calls /api/download/anime to get direct MP4 link from AnimePahe
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
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClick = useCallback(async () => {
    if (status === "done" && downloadUrl) {
      window.open(downloadUrl, "_blank");
      return;
    }
    
    if (status !== "idle" && status !== "error") return;

    setError(null);
    setStatus("finding");

    try {
      // The backend route handles the entire scraping process
      const res = await fetch(`/api/download/anime?anime_title=${encodeURIComponent(animeTitle)}&episode_number=${episodeNumber}`);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      
      if (data.download_url) {
        setDownloadUrl(data.download_url);
        setStatus("done");
        window.open(data.download_url, "_blank");
      } else {
        throw new Error("Download URL not found in response");
      }
    } catch (e: any) {
      console.error("[AnimeDownload] Error:", e);
      setStatus("error");
      setError(e.message || "Download failed");
    }
  }, [status, downloadUrl, animeTitle, episodeNumber]);

  const label = () => {
    switch (status) {
      case "finding":    return "Finding...";
      case "getting_ep": return "Getting ep...";
      case "resolving":  return "Resolving...";
      case "done":       return "Open File";
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
      {error && <p className="text-[10px] text-red-400 truncate text-center mt-1" title={error}>{error}</p>}
    </div>
  );
}
