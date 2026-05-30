import { useState, useCallback } from "react";
import { Download, Loader2, CheckCircle, XCircle } from "lucide-react";

interface Props {
  animeTitle: string;
  episodeNumber: number;
}

type Status = "idle" | "loading" | "downloading" | "done" | "error";

export default function AnimeDownloadButton({ animeTitle, episodeNumber }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleClick = useCallback(async () => {
    if (status !== "idle" && status !== "error") return;

    setError(null);
    setProgress(0);
    setStatus("loading");

    try {
      // Step 1: Get fresh CDN URL
      const res = await fetch(
        `/api/download/anime?anime_title=${encodeURIComponent(animeTitle)}&episode_number=${episodeNumber}`
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (!data.download_url) throw new Error("No download URL");

      // Step 2: Immediately fetch the MP4 from browser (fresh URL, same IP)
      setStatus("downloading");
      const fileRes = await fetch(data.download_url, {
        headers: {
          "Referer": "https://www.hakunaymatata.com/",
        }
      });

      if (!fileRes.ok) throw new Error(`CDN error: ${fileRes.status}`);

      const contentLength = fileRes.headers.get("content-length");
      const total = contentLength ? parseInt(contentLength) : 0;
      const reader = fileRes.body!.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        if (total > 0) setProgress(Math.round((received / total) * 100));
      }

      const blob = new Blob(chunks, { type: "video/mp4" });
      const blobUrl = URL.createObjectURL(blob);
      const filename = `${animeTitle.replace(/[^a-zA-Z0-9]/g, "_")}_EP${episodeNumber}.mp4`;

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

      setStatus("done");
    } catch (e: any) {
      setStatus("error");
      setError(e.message || "Download failed");
    }
  }, [status, animeTitle, episodeNumber]);

  const label = () => {
    switch (status) {
      case "loading":     return "Preparing...";
      case "downloading": return progress > 0 ? `${progress}%` : "Downloading...";
      case "done":        return "Downloaded!";
      case "error":       return "Retry";
      default:            return "Download";
    }
  };

  const isLoading = status === "loading" || status === "downloading";

  const btnClass = () => {
    if (status === "done")  return "bg-green-500/20 text-green-400 border-green-500/40";
    if (status === "error") return "bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30";
    if (isLoading)          return "bg-[#00D4FF]/10 text-[#00D4FF] border-[#00D4FF]/30 cursor-wait";
    return "bg-white/5 text-[#8899AA] border-white/10 hover:bg-[#00D4FF]/20 hover:text-[#00D4FF] hover:border-[#00D4FF]/40";
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <button
        onClick={handleClick}
        disabled={isLoading || status === "done"}
        className={`relative flex items-center justify-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs font-bold transition-all border overflow-hidden ${btnClass()}`}
      >
        {status === "downloading" && progress > 0 && (
          <div className="absolute left-0 top-0 h-full bg-[#00D4FF]/20 transition-all duration-300" style={{ width: `${progress}%` }} />
        )}
        <span className="relative flex items-center gap-2">
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : status === "done" ? <CheckCircle className="w-3.5 h-3.5" />
            : status === "error" ? <XCircle className="w-3.5 h-3.5" />
            : <Download className="w-3.5 h-3.5" />}
          {label()}
        </span>
      </button>
      {error && <p className="text-[10px] text-red-400 text-center mt-1">{error}</p>}
    </div>
  );
}
