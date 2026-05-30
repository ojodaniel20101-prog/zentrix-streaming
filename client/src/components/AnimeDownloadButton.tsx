/**
 * AnimeDownloadButton — fetches CDN URL from backend, then downloads
 * the file directly from the browser using fetch + blob URL.
 * This works because the browser's IP matches the signed URL's IP.
 */

import { useState, useCallback } from "react";
import { Download, Loader2, CheckCircle, XCircle } from "lucide-react";

interface Props {
  animeTitle: string;
  episodeNumber: number;
}

type Status = "idle" | "finding" | "getting_ep" | "resolving" | "downloading" | "done" | "error";

export default function AnimeDownloadButton({ animeTitle, episodeNumber }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const handleClick = useCallback(async () => {
    if (status !== "idle" && status !== "error") return;

    setError(null);
    setProgress(0);
    setStatus("finding");

    try {
      // Step 1: Get CDN URL from our backend
      setStatus("getting_ep");
      const res = await fetch(
        `/api/download/anime?anime_title=${encodeURIComponent(animeTitle)}&episode_number=${episodeNumber}`
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      setStatus("resolving");
      const data = await res.json();
      if (!data.download_url) throw new Error("No download URL returned");

      // Step 2: Fetch the MP4 directly from the browser (same IP = no 403)
      setStatus("downloading");
      const safeTitle = animeTitle.replace(/[^a-zA-Z0-9]/g, "_");
      const filename = `${safeTitle}_EP${episodeNumber}.mp4`;

      const fileRes = await fetch(data.download_url);
      if (!fileRes.ok) throw new Error(`CDN error: ${fileRes.status}`);

      // Stream with progress tracking
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

      // Step 3: Save as file
      const blob = new Blob(chunks, { type: "video/mp4" });
      const blobUrl = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      setStatus("done");

    } catch (e: any) {
      console.error("[AnimeDownload] Error:", e);
      setStatus("error");
      setError(e.message || "Download failed");
    }
  }, [status, animeTitle, episodeNumber]);

  const label = () => {
    switch (status) {
      case "finding":     return "Finding...";
      case "getting_ep":  return "Getting ep...";
      case "resolving":   return "Preparing...";
      case "downloading": return progress > 0 ? `${progress}%` : "Downloading...";
      case "done":        return "Downloaded!";
      case "error":       return "Retry";
      default:            return "Download";
    }
  };

  const isLoading = ["finding", "getting_ep", "resolving", "downloading"].includes(status);

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
        title={error ?? `Download Episode ${episodeNumber}`}
        className={`relative flex items-center justify-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs font-bold transition-all border overflow-hidden ${btnClass()}`}
      >
        {/* Progress bar background */}
        {status === "downloading" && progress > 0 && (
          <div
            className="absolute left-0 top-0 h-full bg-[#00D4FF]/20 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        )}
        <span className="relative flex items-center gap-2">
          {isLoading
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : status === "done"
            ? <CheckCircle className="w-3.5 h-3.5" />
            : status === "error"
            ? <XCircle className="w-3.5 h-3.5" />
            : <Download className="w-3.5 h-3.5" />}
          {label()}
        </span>
      </button>
      {error && (
        <p className="text-[10px] text-red-400 truncate text-center mt-1" title={error}>
          {error}
        </p>
      )}
    </div>
  );
}
