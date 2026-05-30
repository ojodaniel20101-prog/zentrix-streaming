import { useState, useCallback } from "react";
import { Download, Loader2, CheckCircle, XCircle, ChevronDown } from "lucide-react";

interface Props {
  movieTitle: string;
}

type Status = "idle" | "searching" | "resolving" | "done" | "error";

interface Source {
  resourceId: string;
  title: string;
  resolution: number;
  quality: string;
  download_url: string;
  size: number;
}

export default function MovieDownloadButton({ movieTitle }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [sources, setSources] = useState<Source[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleClick = useCallback(async () => {
    if (status === "done") {
      setShowDropdown(prev => !prev);
      return;
    }
    if (status !== "idle" && status !== "error") return;

    setError(null);
    setStatus("searching");

    try {
      const searchRes = await fetch(`/api/ayomedia/movie/search?q=${encodeURIComponent(movieTitle)}`);
      if (!searchRes.ok) throw new Error(`Search failed: HTTP ${searchRes.status}`);
      const searchData = await searchRes.json();

      const results = searchData.results?.items || searchData.results || [];
      if (!results.length) throw new Error(`"${movieTitle}" not found`);

      const match = results.find((r: any) =>
        r.title?.toLowerCase().includes(movieTitle.toLowerCase())
      ) || results[0];

      const movieId = match.subjectId || match.id;
      if (!movieId) throw new Error("Could not get movie ID");

      setStatus("resolving");

      const sourcesRes = await fetch(`/api/ayomedia/movie/${movieId}/sources`);
      if (!sourcesRes.ok) throw new Error(`Sources failed: HTTP ${sourcesRes.status}`);
      const sourcesData = await sourcesRes.json();

      const items: Source[] = sourcesData.results || [];
      if (!items.length) throw new Error("No download links available");

      items.sort((a, b) => (b.resolution || 0) - (a.resolution || 0));

      setSources(items);
      setStatus("done");
      setShowDropdown(true);
    } catch (e: any) {
      console.error("[MovieDownload] Error:", e);
      setStatus("error");
      setError(e.message || "Download failed");
    }
  }, [status, movieTitle]);

  const isLoading = ["searching", "resolving"].includes(status);

  const btnClass = () => {
    if (status === "done") return "bg-green-500/20 text-green-400 border-green-500/40 hover:bg-green-500/30";
    if (status === "error") return "bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30";
    if (isLoading) return "bg-[#00D4FF]/10 text-[#00D4FF] border-[#00D4FF]/30 cursor-wait";
    return "bg-white/5 text-[#8899AA] border-white/10 hover:bg-[#00D4FF]/20 hover:text-[#00D4FF] hover:border-[#00D4FF]/40";
  };

  const label = () => {
    switch (status) {
      case "searching": return "Finding...";
      case "resolving": return "Resolving...";
      case "done": return "Download Movie";
      case "error": return "Retry";
      default: return "Download Movie";
    }
  };

  return (
    <div className="flex flex-col gap-1 w-full relative">
      <button
        onClick={handleClick}
        disabled={isLoading}
        title={error ?? `Download ${movieTitle}`}
        className={`flex items-center justify-center gap-2 w-full px-4 py-2 rounded-xl text-sm font-bold transition-all border ${btnClass()}`}
      >
        {isLoading
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : status === "done"
          ? <><Download className="w-4 h-4" /><ChevronDown className="w-3 h-3" /></>
          : status === "error"
          ? <XCircle className="w-4 h-4" />
          : <Download className="w-4 h-4" />}
        {label()}
      </button>

      {showDropdown && sources.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-[#0a0f1a] border border-white/10 rounded-xl overflow-hidden z-50 shadow-xl">
          {sources.map(src => (
            <a
              key={src.resourceId}
              href={src.download_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-2 text-sm hover:bg-white/5 text-white border-b border-white/5 last:border-0"
            >
              <span>{src.quality}</span>
              <span className="text-[#8899AA] text-xs">{Math.round(src.size / 1024 / 1024)}MB</span>
            </a>
          ))}
        </div>
      )}

      {error && <p className="text-[10px] text-red-400 truncate text-center mt-1" title={error}>{error}</p>}
    </div>
  );
}
