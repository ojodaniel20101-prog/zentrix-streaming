import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface WatchlistItem {
  id: number;
  type: "movie" | "tv" | "anime";
  title: string;
  poster: string;
  rating?: number;
  year?: string;
  addedAt: number;
}

interface WatchHistory {
  id: number;
  type: "movie" | "tv" | "anime";
  title: string;
  poster: string;
  progress?: number; // 0-100
  season?: number;
  episode?: number;
  watchedAt: number;
}

interface WatchlistContextType {
  watchlist: WatchlistItem[];
  watchHistory: WatchHistory[];
  addToWatchlist: (item: WatchlistItem) => void;
  removeFromWatchlist: (id: number, type: string) => void;
  isInWatchlist: (id: number, type: string) => boolean;
  addToHistory: (item: WatchHistory) => void;
  clearHistory: () => void;
}

const WatchlistContext = createContext<WatchlistContextType | null>(null);

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => {
    try {
      const stored = localStorage.getItem("zx_watchlist");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [watchHistory, setWatchHistory] = useState<WatchHistory[]>(() => {
    try {
      const stored = localStorage.getItem("zx_history");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("zx_watchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  useEffect(() => {
    localStorage.setItem("zx_history", JSON.stringify(watchHistory));
  }, [watchHistory]);

  const addToWatchlist = (item: WatchlistItem) => {
    setWatchlist((prev) => {
      const exists = prev.find((i) => i.id === item.id && i.type === item.type);
      if (exists) return prev;
      return [item, ...prev];
    });
  };

  const removeFromWatchlist = (id: number, type: string) => {
    setWatchlist((prev) => prev.filter((i) => !(i.id === id && i.type === type)));
  };

  const isInWatchlist = (id: number, type: string) => {
    return watchlist.some((i) => i.id === id && i.type === type);
  };

  const addToHistory = (item: WatchHistory) => {
    setWatchHistory((prev) => {
      const filtered = prev.filter((i) => !(i.id === item.id && i.type === item.type));
      return [item, ...filtered].slice(0, 50);
    });
  };

  const clearHistory = () => setWatchHistory([]);

  return (
    <WatchlistContext.Provider
      value={{
        watchlist,
        watchHistory,
        addToWatchlist,
        removeFromWatchlist,
        isInWatchlist,
        addToHistory,
        clearHistory,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const ctx = useContext(WatchlistContext);
  if (!ctx) throw new Error("useWatchlist must be used within WatchlistProvider");
  return ctx;
}
