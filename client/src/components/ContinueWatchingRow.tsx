import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Play, X } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { tmdbImg, getMovieDetails, getTVDetails, getAnimeDetails, type TMDBMedia, type AniListMedia } from "@/lib/api";

interface ProgressItem {
  id: number;
  contentId: string;
  contentType: "movie" | "tv" | "anime";
  progressSeconds: number;
  durationSeconds: number;
  episodeId?: string | null;
  updatedAt: string;
}

export default function ContinueWatchingRow() {
  const { data: progress, refetch } = trpc.watchProgress.getAll.useQuery();
  const removeMutation = trpc.watchProgress.remove.useMutation({
    onSuccess: () => refetch(),
  });

  if (!progress || progress.length === 0) return null;

  return (
    <div className="py-8">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 mb-4">
        <h2 className="text-xl font-bold font-['Space_Grotesk'] text-white">Continue Watching</h2>
      </div>
      
      <div className="relative">
        <div className="flex gap-4 overflow-x-auto px-4 sm:px-6 lg:px-8 pb-4 scrollbar-hide no-scrollbar"
             style={{ scrollSnapType: "x mandatory" }}>
          {progress.map((item) => (
            <ContinueWatchingCard 
              key={item.id} 
              item={item as ProgressItem} 
              onRemove={() => removeMutation.mutate({ id: item.id })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ContinueWatchingCard({ item, onRemove }: { item: ProgressItem; onRemove: () => void }) {
  const [details, setDetails] = useState<{ title: string; poster: string | null } | null>(null);
  const progressPercent = Math.min((item.progressSeconds / item.durationSeconds) * 100, 100);

  useEffect(() => {
    async function fetchDetails() {
      try {
        if (item.contentType === "movie") {
          const data = await getMovieDetails(parseInt(item.contentId));
          setDetails({ title: data.title || data.name || "Unknown", poster: tmdbImg(data.poster_path, "w342") });
        } else if (item.contentType === "tv") {
          const data = await getTVDetails(parseInt(item.contentId));
          setDetails({ title: data.name || data.title || "Unknown", poster: tmdbImg(data.poster_path, "w342") });
        } else if (item.contentType === "anime") {
          const { Media } = await getAnimeDetails(parseInt(item.contentId));
          setDetails({ title: Media.title.english || Media.title.romaji, poster: Media.coverImage.large });
        }
      } catch (error) {
        console.error("Error fetching progress details:", error);
      }
    }
    fetchDetails();
  }, [item]);

  if (!details) return null;

  const watchUrl = item.contentType === "tv" 
    ? `/watch/tv/${item.contentId}?episode=${item.episodeId || "1"}`
    : `/watch/${item.contentType}/${item.contentId}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative w-[100px] md:w-[200px] flex-shrink-0 group"
      style={{ scrollSnapAlign: "start" }}
    >
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#0B1220] border border-white/5 group-hover:border-[#00D4FF]/30 transition-all">
        {details.poster && (
          <img src={details.poster} alt={details.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
        
        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(); }}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white/70 hover:bg-red-500/80 hover:text-white opacity-0 group-hover:opacity-100 transition-all z-10"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <Link href={watchUrl}>
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <div className="w-12 h-12 rounded-full bg-[#00D4FF] flex items-center justify-center shadow-lg shadow-[#00D4FF]/20">
              <Play className="w-6 h-6 text-[#050816] fill-current ml-1" />
            </div>
          </div>
        </Link>

        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-sm font-bold text-white truncate font-['Space_Grotesk']">{details.title}</h3>
          {item.contentType === "tv" && item.episodeId && (
            <p className="text-[10px] text-white/60 font-medium">Episode {item.episodeId}</p>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div 
            className="h-full bg-gradient-to-r from-[#00D4FF] to-[#8B5CF6]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
}
