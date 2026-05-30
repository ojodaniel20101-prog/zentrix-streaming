import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Loader2, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface ArcInfo {
  id: string;
  name: string;
  episodes: number;
  type: "season" | "arc" | "movie" | "special";
  description?: string;
}

interface SeasonData {
  id: string;
  name: string;
  arcs: ArcInfo[];
}

interface AnimeSeasonSelectorProps {
  animeTitle: string;
  animeId: number;
  onSeasonSelect: (season: ArcInfo) => void;
  currentSeason?: ArcInfo;
}

export default function AnimeSeasonSelector({
  animeTitle,
  animeId,
  onSeasonSelect,
  currentSeason,
}: AnimeSeasonSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [seasons, setSeasons] = useState<SeasonData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // tRPC mutation to fetch anime seasons from LLM
  const fetchSeasonsMutation = trpc.anime.getSeasonsByLLM.useMutation();

  useEffect(() => {
    if (isOpen && seasons.length === 0) {
      loadSeasons();
    }
  }, [isOpen]);

  const loadSeasons = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchSeasonsMutation.mutateAsync({
        animeTitle,
        animeId,
      });
      setSeasons(result.seasons);
    } catch (err) {
      setError("Failed to load seasons. Please try again.");
      console.error("Error fetching seasons:", err);
    } finally {
      setLoading(false);
    }
  };

  const allArcs = seasons.flatMap((s) => s.arcs);
  const displayName =
    currentSeason?.name || "Select Season/Arc";

  return (
    <div className="relative w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-lg font-semibold transition-all"
        style={{
          background: "rgba(139,92,246,0.15)",
          color: "#00D4FF",
          border: "1px solid rgba(139,92,246,0.3)",
        }}
      >
        <span className="truncate text-left">{displayName}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 z-50 rounded-lg shadow-xl max-h-96 overflow-y-auto"
            style={{
              background: "rgba(11,18,32,0.95)",
              border: "1px solid rgba(139,92,246,0.3)",
              backdropFilter: "blur(16px)",
            }}
          >
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#00D4FF" }} />
                <span className="ml-2" style={{ color: "#8899AA" }}>
                  Loading seasons...
                </span>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-3 p-4" style={{ color: "#FF6464" }}>
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {!loading && !error && allArcs.length === 0 && (
              <div className="p-4 text-center" style={{ color: "#8899AA" }}>
                No seasons found
              </div>
            )}

            {!loading && !error && allArcs.length > 0 && (
              <div className="p-2">
                {seasons.map((season) => (
                  <div key={season.id}>
                    <div
                      className="px-3 py-2 text-xs font-bold uppercase tracking-wider"
                      style={{ color: "#8B5CF6" }}
                    >
                      {season.name}
                    </div>
                    {season.arcs.map((arc) => (
                      <motion.button
                        key={arc.id}
                        onClick={() => {
                          onSeasonSelect(arc);
                          setIsOpen(false);
                        }}
                        whileHover={{ x: 4 }}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded text-sm transition-colors"
                        style={{
                          background:
                            currentSeason?.id === arc.id
                              ? "rgba(0,212,255,0.15)"
                              : "transparent",
                          color:
                            currentSeason?.id === arc.id ? "#00D4FF" : "#8899AA",
                        }}
                      >
                        <div className="flex-1 text-left min-w-0">
                          <p className="truncate font-medium">{arc.name}</p>
                          <p className="text-xs opacity-75">
                            {arc.episodes} episode{arc.episodes !== 1 ? "s" : ""}
                          </p>
                          {arc.description && (
                            <p className="text-xs opacity-60 mt-1 line-clamp-2">
                              {arc.description}
                            </p>
                          )}
                        </div>
                        <span
                          className="text-xs px-2 py-1 rounded ml-2 flex-shrink-0"
                          style={{
                            background: "rgba(139,92,246,0.2)",
                            color: "#8B5CF6",
                          }}
                        >
                          {arc.type}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
