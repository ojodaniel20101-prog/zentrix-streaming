import { useState, useCallback } from "react";
import { Download, Loader2, XCircle, X, ChevronDown } from "lucide-react";

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
  const [showModal, setShowModal] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});

  const handleClick = useCallback(async () => {
    if (status === "done") { setShowModal(true); return; }
    if (status !== "idle" && status !== "error") return;

    setError(null);
    setStatus("searching");

    try {
      const searchRes = await fetch(`/api/ayomedia/movie/search?q=${encodeURIComponent(movieTitle)}`);
      if (!searchRes.ok) throw new Error(`Search failed: HTTP ${searchRes.status}`);
      const searchData = await searchRes.json();
      const results = searchData.results?.items || [];
      if (!results.length) throw new Error(`"${movieTitle}" not found`);
      const match = results.find((r: any) => r.title?.toLowerCase().includes(movieTitle.toLowerCase())) || results[0];
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
      setShowModal(true);
    } catch (e: any) {
      setStatus("error");
      setError(e.message || "Download failed");
    }
  }, [status, movieTitle]);

  const handleDownload = useCallback(async (src: Source) => {
    setDownloadProgress(prev => ({ ...prev, [src.resourceId]: 0 }));
    setShowModal(false);
    try {
      const response = await fetch(src.download_url);
      if (!response.ok) throw new Error("Download failed");
      const contentLength = response.headers.get("content-length");
      const total = contentLength ? parseInt(contentLength) : src.size;
      const reader = response.body!.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        const progress = Math.round((received / total) * 100);
        setDownloadProgress(prev => ({ ...prev, [src.resourceId]: progress }));
      }

      const blob = new Blob(chunks);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${movieTitle} - ${src.quality}.mp4`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // fallback to direct link
      const a = document.createElement("a");
      a.href = src.download_url;
      a.download = `${movieTitle} - ${src.quality}.mp4`;
      a.click();
    } finally {
      setTimeout(() => setDownloadProgress(prev => {
        const next = { ...prev };
        delete next[src.resourceId];
        return next;
      }), 2000);
    }
  }, [movieTitle]);

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
      case "done": return "Download";
      case "error": return "Retry";
      default: return "Download";
    }
  };

  const activeDownloads = Object.entries(downloadProgress);

  return (
    <>
      {/* Progress indicators */}
      {activeDownloads.map(([id, progress]) => (
        <div key={id} className="fixed bottom-6 right-4 z-50 bg-[#0a0f1a] border border-[#00D4FF]/30 rounded-2xl p-4 w-72 shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white text-xs font-bold truncate">{movieTitle}</span>
            <span className="text-[#00D4FF] text-xs font-bold">{progress}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div className="bg-[#00D4FF] h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[#8899AA] text-[10px] mt-1">{progress === 100 ? "✅ Complete!" : "Downloading..."}</p>
        </div>
      ))}

      <button onClick={handleClick} disabled={isLoading}
        className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${btnClass()}`}>
        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : status === "error" ? <XCircle className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
        {label()}
        {status === "done" && <ChevronDown className="w-3 h-3" />}
      </button>

      {error && <p className="text-[10px] text-red-400 truncate text-center mt-1">{error}</p>}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-[#0a0f1a] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div>
                <p className="text-white font-bold text-sm">Download Movie</p>
                <p className="text-[#8899AA] text-xs mt-0.5 truncate max-w-[220px]">{movieTitle}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-[#8899AA] hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-3 flex flex-col gap-2">
              {sources.map(src => (
                <button key={src.resourceId} onClick={() => handleDownload(src)}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 hover:bg-[#00D4FF]/10 border border-white/10 hover:border-[#00D4FF]/30 transition-all">
                  <div className="flex items-center gap-3">
                    <Download className="w-4 h-4 text-[#00D4FF]" />
                    <span className="text-white font-bold text-sm">{src.quality}</span>
                  </div>
                  <span className="text-[#8899AA] text-xs">{Math.round(src.size / 1024 / 1024)} MB</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
