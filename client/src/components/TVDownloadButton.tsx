import { useState, useCallback } from "react";
import { Download, Loader2, XCircle, X, ChevronDown } from "lucide-react";

interface Props {
  showTitle: string;
  currentSeason?: number;
  currentEpisode?: number;
}

type Status = "idle" | "searching" | "loading" | "done" | "error";

interface Episode {
  resourceId: string;
  title: string;
  season: number;
  episode: number;
  quality: string;
  resolution: number;
  download_url: string;
  size: number;
}

export default function TVDownloadButton({ showTitle, currentSeason = 1, currentEpisode = 1 }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(currentSeason);

  const seasons = [...new Set(episodes.map(e => e.season))].sort((a, b) => a - b);
  const filteredEpisodes = episodes.filter(e => e.season === selectedSeason);

  const handleClick = useCallback(async () => {
    if (status === "done") { setShowModal(true); return; }
    if (status !== "idle" && status !== "error") return;
    setError(null);
    setStatus("searching");
    try {
      const searchRes = await fetch(`/api/ayomedia/movie/search?q=${encodeURIComponent(showTitle)}`);
      if (!searchRes.ok) throw new Error(`Search failed: HTTP ${searchRes.status}`);
      const searchData = await searchRes.json();
      const results = searchData.results?.items || [];
      const tvResults = results.filter((r: any) => r.subjectType === 2 && r.hasResource);
      if (!tvResults.length) throw new Error(`"${showTitle}" not found`);
      const match = tvResults.find((r: any) => r.title?.toLowerCase() === showTitle.toLowerCase()) || tvResults[0];
      const showId = match.subjectId;
      setStatus("loading");
      const sourcesRes = await fetch(`/api/ayomedia/movie/${showId}/sources`);
      if (!sourcesRes.ok) throw new Error(`Failed to get episodes: HTTP ${sourcesRes.status}`);
      const sourcesData = await sourcesRes.json();
      const items: Episode[] = sourcesData.results || [];
      if (!items.length) throw new Error("No episodes available");
      items.sort((a, b) => a.season - b.season || a.episode - b.episode);
      setEpisodes(items);
      setStatus("done");
      const availableSeasons = [...new Set(items.map(e => e.season))];
      setSelectedSeason(availableSeasons.includes(currentSeason) ? currentSeason : availableSeasons[0]);
      setShowModal(true);
    } catch (e: any) {
      setStatus("error");
      setError(e.message || "Download failed");
    }
  }, [status, showTitle, currentSeason]);

  const isLoading = ["searching", "loading"].includes(status);

  const btnClass = () => {
    if (status === "done") return "bg-green-500/20 text-green-400 border-green-500/40 hover:bg-green-500/30";
    if (status === "error") return "bg-red-500/20 text-red-400 border-red-500/40 hover:bg-red-500/30";
    if (isLoading) return "bg-[#00D4FF]/10 text-[#00D4FF] border-[#00D4FF]/30 cursor-wait";
    return "bg-white/5 text-[#8899AA] border-white/10 hover:bg-[#00D4FF]/20 hover:text-[#00D4FF] hover:border-[#00D4FF]/40";
  };

  const label = () => {
    switch (status) {
      case "searching": return "Finding...";
      case "loading": return "Loading...";
      case "done": return "Download";
      case "error": return "Retry";
      default: return "Download";
    }
  };

  return (
    <>
      <button onClick={handleClick} disabled={isLoading} title={error ?? `Download ${showTitle}`}
        className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${btnClass()}`}>
        {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : status === "error" ? <XCircle className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
        {label()}
        {status === "done" && <ChevronDown className="w-3 h-3" />}
      </button>
      {error && <p className="text-[10px] text-red-400 truncate text-center mt-1">{error}</p>}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-[#0a0f1a] border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
              <div>
                <p className="text-white font-bold text-sm">Download Episode</p>
                <p className="text-[#8899AA] text-xs mt-0.5 truncate max-w-[220px]">{showTitle}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-[#8899AA] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex gap-2 px-4 py-3 border-b border-white/10 overflow-x-auto shrink-0">
              {seasons.map(s => (
                <button key={s} onClick={() => setSelectedSeason(s)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${selectedSeason === s ? "bg-[#00D4FF] text-[#050816] border-[#00D4FF]" : "bg-white/5 text-[#8899AA] border-white/10 hover:bg-white/10"}`}>
                  S{s}
                </button>
              ))}
            </div>
            <div className="overflow-y-auto flex-1 p-3 flex flex-col gap-2">
              {filteredEpisodes.map(ep => (
                <a key={ep.resourceId} href={ep.download_url} download onClick={() => setShowModal(false)}
                  className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 hover:bg-[#00D4FF]/10 border border-white/10 hover:border-[#00D4FF]/30 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <Download className="w-4 h-4 text-[#00D4FF] shrink-0" />
                    <div className="min-w-0">
                      <p className="text-white font-bold text-xs">E{ep.episode} — {ep.title}</p>
                      <p className="text-[#8899AA] text-[10px]">{ep.quality}</p>
                    </div>
                  </div>
                  <span className="text-[#8899AA] text-xs shrink-0 ml-2">{Math.round(ep.size / 1024 / 1024)}MB</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
