import { useState, useCallback } from "react";
import { Download, Loader2, CheckCircle, XCircle } from "lucide-react";

interface Props {
  animeTitle: string;
  episodeNumber: number;
}

type Status = "idle" | "loading" | "done" | "error";

export default function AnimeDownloadButton({ animeTitle, episodeNumber }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  const handleClick = useCallback(async () => {
    if (status !== "idle" && status !== "error") return;
    setError(null);
    setStatus("loading");

    try {
      const res = await fetch(
        `/api/download/anime?anime_title=${encodeURIComponent(animeTitle)}&episode_number=${episodeNumber}`
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (!data.download_url) throw new Error("No download URL");

      const safeTitle = animeTitle.replace(/[^a-zA-Z0-9]/g, "_");
      const filename = `${safeTitle}_EP${episodeNumber}.mp4`;

      // Use septorch proxy route on our backend
      const proxyUrl = `/api/download/anime/file?url=${encodeURIComponent(data.download_url)}&fn=${encodeURIComponent(filename)}`;

      const a = document.createElement("a");
      a.href = proxyUrl;
      a.download = filename;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setStatus("done");
    } catch (e: any) {
      setStatus("error");
      setError(e.message || "Download failed");
    }
  }, [status, animeTitle, episodeNumber]);

  const label = () => {
    switch (status) {
      case "loading": return "Preparing...";
      case "done":    return "Downloading!";
      case "error":   return "Retry";
      default:        return "Download";
    }
  };

  const btnClass = () => {
    if (status === "done")    return "bg-green-500/20 text-green-400 border-green-500/40";
    if (status === "error")   return "bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30";
    if (status === "loading") return "bg-[#00D4FF]/10 text-[#00D4FF] border-[#00D4FF]/30 cursor-wait";
    return "bg-white/5 text-[#8899AA] border-white/10 hover:bg-[#00D4FF]/20 hover:text-[#00D4FF] hover:border-[#00D4FF]/40";
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <button
        onClick={handleClick}
        disabled={status === "loading"}
        className={`flex items-center justify-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${btnClass()}`}
      >
        {status === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : status === "done" ? <CheckCircle className="w-3.5 h-3.5" />
          : status === "error" ? <XCircle className="w-3.5 h-3.5" />
          : <Download className="w-3.5 h-3.5" />}
        {label()}
      </button>
      {error && <p className="text-[10px] text-red-400 text-center mt-1">{error}</p>}
    </div>
  );
}
