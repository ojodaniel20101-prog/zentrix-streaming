/*
  Season Selector Component
  Professional season/session selector UI for anime and TV shows
  Similar to Netflix, MovieBox, HiAnime
*/

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Season {
  number: number;
  name?: string;
  episodeCount?: number;
  poster?: string;
}

interface SeasonSelectorProps {
  seasons: Season[];
  currentSeason: number;
  onSeasonChange: (seasonNumber: number) => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export default function SeasonSelector({
  seasons,
  currentSeason,
  onSeasonChange,
  isOpen: controlledIsOpen,
  onOpenChange,
  className = "",
}: SeasonSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Handle controlled vs uncontrolled state
  const open = controlledIsOpen !== undefined ? controlledIsOpen : isOpen;
  const setOpen = (value: boolean) => {
    if (controlledIsOpen === undefined) {
      setIsOpen(value);
    }
    onOpenChange?.(value);
  };

  const currentSeasonData = seasons.find((s) => s.number === currentSeason);

  const handleSeasonSelect = (seasonNumber: number) => {
    onSeasonChange(seasonNumber);
    setOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Season Selector Button */}
      <Button
        onClick={() => setOpen(!open)}
        className="w-full md:w-auto bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold px-4 py-2 rounded-lg flex items-center justify-between gap-2 transition-all duration-200"
      >
        <span>
          Season {currentSeason}
          {currentSeasonData?.name && ` - ${currentSeasonData.name}`}
        </span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={18} />
        </motion.div>
      </Button>

      {/* Season Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full left-0 right-0 md:left-auto md:right-0 mt-2 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 max-h-96 overflow-y-auto"
          >
            <div className="p-2">
              {seasons.length === 0 ? (
                <div className="px-4 py-3 text-slate-400 text-center">No seasons available</div>
              ) : (
                <div className="grid grid-cols-1 gap-1">
                  {seasons.map((season) => (
                    <motion.button
                      key={season.number}
                      onClick={() => handleSeasonSelect(season.number)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full px-4 py-3 rounded-lg text-left transition-all duration-150 flex items-center justify-between ${
                        currentSeason === season.number
                          ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold"
                          : "hover:bg-slate-800 text-slate-200 font-medium"
                      }`}
                    >
                      <div className="flex-1">
                        <div className="font-semibold">Season {season.number}</div>
                        {season.name && <div className="text-xs opacity-75">{season.name}</div>}
                        {season.episodeCount && (
                          <div className="text-xs opacity-60">{season.episodeCount} episodes</div>
                        )}
                      </div>
                      {currentSeason === season.number && (
                        <div className="ml-2 w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay to close dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40"
          />
        )}
      </AnimatePresence>
    </div>
  );
}
