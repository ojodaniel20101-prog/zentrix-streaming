/**
 * Badge system - Compute badges based on actual user behavior
 */

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: "watcher" | "contributor" | "explorer" | "social" | "achievement";
  unlockCondition: string;
  earned: boolean;
  unlockedAt?: Date;
  progress?: number; // 0-100
}

export interface BadgeUnlockCondition {
  watchCount?: number;
  sessionDuration?: number; // minutes
  genreCount?: number;
  searchCount?: number;
  feedbackCount?: number;
  downloadCount?: number;
  streakDays?: number;
}

/**
 * Compute all badges for a user based on their activity
 */
export function computeUserBadges(userActivity: {
  watchHistory: any[];
  searchHistory: string[];
  downloads: any[];
  feedbacks: any[];
  sessionDuration: number; // minutes
  joinedAt: Date;
}): Badge[] {
  const badges: Badge[] = [];
  const now = new Date();

  // Badge 1: Binge Watcher - Watch 10+ items
  const bingeWatcher: Badge = {
    id: "binge-watcher",
    name: "Binge Watcher",
    description: "Watched 10 or more items",
    icon: "🎬",
    color: "#FF6B6B",
    category: "watcher",
    unlockCondition: "watchCount >= 10",
    earned: userActivity.watchHistory.length >= 10,
    unlockedAt: userActivity.watchHistory.length >= 10 ? now : undefined,
    progress: Math.min(100, (userActivity.watchHistory.length / 10) * 100),
  };
  badges.push(bingeWatcher);

  // Badge 2: Night Owl - Session duration > 120 minutes
  const nightOwl: Badge = {
    id: "night-owl",
    name: "Night Owl",
    description: "Spent over 2 hours in one session",
    icon: "🌙",
    color: "#4ECDC4",
    category: "watcher",
    unlockCondition: "sessionDuration >= 120",
    earned: userActivity.sessionDuration >= 120,
    unlockedAt: userActivity.sessionDuration >= 120 ? now : undefined,
    progress: Math.min(100, (userActivity.sessionDuration / 120) * 100),
  };
  badges.push(nightOwl);

  // Badge 3: Speed Watcher - Watched 50+ items
  const speedWatcher: Badge = {
    id: "speed-watcher",
    name: "Speed Watcher",
    description: "Watched 50 or more items",
    icon: "⚡",
    color: "#FFE66D",
    category: "watcher",
    unlockCondition: "watchCount >= 50",
    earned: userActivity.watchHistory.length >= 50,
    unlockedAt: userActivity.watchHistory.length >= 50 ? now : undefined,
    progress: Math.min(100, (userActivity.watchHistory.length / 50) * 100),
  };
  badges.push(speedWatcher);

  // Badge 4: Genre Master - Watched from 5+ different genres
  const genreSet = new Set(
    userActivity.watchHistory.map((item: any) => item.genre || item.category).filter(Boolean)
  );
  const genreMaster: Badge = {
    id: "genre-master",
    name: "Genre Master",
    description: "Explored 5 different genres",
    icon: "🎭",
    color: "#95E1D3",
    category: "explorer",
    unlockCondition: "genreCount >= 5",
    earned: genreSet.size >= 5,
    unlockedAt: genreSet.size >= 5 ? now : undefined,
    progress: Math.min(100, (genreSet.size / 5) * 100),
  };
  badges.push(genreMaster);

  // Badge 5: Collector - Downloaded 10+ items
  const collector: Badge = {
    id: "collector",
    name: "Collector",
    description: "Downloaded 10 or more items",
    icon: "📥",
    color: "#F38181",
    category: "achievement",
    unlockCondition: "downloadCount >= 10",
    earned: userActivity.downloads.length >= 10,
    unlockedAt: userActivity.downloads.length >= 10 ? now : undefined,
    progress: Math.min(100, (userActivity.downloads.length / 10) * 100),
  };
  badges.push(collector);

  // Badge 6: Searcher - Performed 20+ searches
  const searcher: Badge = {
    id: "searcher",
    name: "Searcher",
    description: "Performed 20 or more searches",
    icon: "🔍",
    color: "#AA96DA",
    category: "explorer",
    unlockCondition: "searchCount >= 20",
    earned: userActivity.searchHistory.length >= 20,
    unlockedAt: userActivity.searchHistory.length >= 20 ? now : undefined,
    progress: Math.min(100, (userActivity.searchHistory.length / 20) * 100),
  };
  badges.push(searcher);

  // Badge 7: Feedback Guru - Submitted 5+ feedbacks
  const feedbackGuru: Badge = {
    id: "feedback-guru",
    name: "Feedback Guru",
    description: "Submitted 5 or more feedbacks",
    icon: "💬",
    color: "#FCBAD3",
    category: "social",
    unlockCondition: "feedbackCount >= 5",
    earned: userActivity.feedbacks.length >= 5,
    unlockedAt: userActivity.feedbacks.length >= 5 ? now : undefined,
    progress: Math.min(100, (userActivity.feedbacks.length / 5) * 100),
  };
  badges.push(feedbackGuru);

  // Badge 8: Movie Enthusiast - Watched 20+ movies
  const movieCount = userActivity.watchHistory.filter((item: any) => item.type === "movie").length;
  const movieEnthusiast: Badge = {
    id: "movie-enthusiast",
    name: "Movie Enthusiast",
    description: "Watched 20 or more movies",
    icon: "🎥",
    color: "#FF9FF3",
    category: "watcher",
    unlockCondition: "movieCount >= 20",
    earned: movieCount >= 20,
    unlockedAt: movieCount >= 20 ? now : undefined,
    progress: Math.min(100, (movieCount / 20) * 100),
  };
  badges.push(movieEnthusiast);

  // Badge 9: Series Binger - Watched 20+ TV shows
  const tvCount = userActivity.watchHistory.filter((item: any) => item.type === "tv").length;
  const seriesBinger: Badge = {
    id: "series-binger",
    name: "Series Binger",
    description: "Watched 20 or more TV series",
    icon: "📺",
    color: "#A29BFE",
    category: "watcher",
    unlockCondition: "tvCount >= 20",
    earned: tvCount >= 20,
    unlockedAt: tvCount >= 20 ? now : undefined,
    progress: Math.min(100, (tvCount / 20) * 100),
  };
  badges.push(seriesBinger);

  // Badge 10: Anime Lover - Watched 15+ anime
  const animeCount = userActivity.watchHistory.filter((item: any) => item.type === "anime").length;
  const animeLover: Badge = {
    id: "anime-lover",
    name: "Anime Lover",
    description: "Watched 15 or more anime",
    icon: "🎨",
    color: "#FD79A8",
    category: "watcher",
    unlockCondition: "animeCount >= 15",
    earned: animeCount >= 15,
    unlockedAt: animeCount >= 15 ? now : undefined,
    progress: Math.min(100, (animeCount / 15) * 100),
  };
  badges.push(animeLover);

  // Badge 11: Early Adopter - Joined 30+ days ago
  const daysSinceJoin = Math.floor((now.getTime() - userActivity.joinedAt.getTime()) / (1000 * 60 * 60 * 24));
  const earlyAdopter: Badge = {
    id: "early-adopter",
    name: "Early Adopter",
    description: "Member for 30+ days",
    icon: "🚀",
    color: "#00B894",
    category: "achievement",
    unlockCondition: "joinedDays >= 30",
    earned: daysSinceJoin >= 30,
    unlockedAt: daysSinceJoin >= 30 ? new Date(userActivity.joinedAt.getTime() + 30 * 24 * 60 * 60 * 1000) : undefined,
    progress: Math.min(100, (daysSinceJoin / 30) * 100),
  };
  badges.push(earlyAdopter);

  // Badge 12: Legendary - Watched 100+ items
  const legendary: Badge = {
    id: "legendary",
    name: "Legendary",
    description: "Watched 100 or more items",
    icon: "👑",
    color: "#FFD700",
    category: "achievement",
    unlockCondition: "watchCount >= 100",
    earned: userActivity.watchHistory.length >= 100,
    unlockedAt: userActivity.watchHistory.length >= 100 ? now : undefined,
    progress: Math.min(100, (userActivity.watchHistory.length / 100) * 100),
  };
  badges.push(legendary);

  return badges;
}

/**
 * Get badge unlock progress for display
 */
export function getBadgeProgress(badge: Badge): {
  current: number;
  target: number;
  percentage: number;
} {
  const progressMap: Record<string, { current: number; target: number }> = {
    "binge-watcher": { current: 0, target: 10 },
    "night-owl": { current: 0, target: 120 },
    "speed-watcher": { current: 0, target: 50 },
    "genre-master": { current: 0, target: 5 },
    "collector": { current: 0, target: 10 },
    "searcher": { current: 0, target: 20 },
    "feedback-guru": { current: 0, target: 5 },
    "movie-enthusiast": { current: 0, target: 20 },
    "series-binger": { current: 0, target: 20 },
    "anime-lover": { current: 0, target: 15 },
    "early-adopter": { current: 0, target: 30 },
    "legendary": { current: 0, target: 100 },
  };

  const progress = progressMap[badge.id] || { current: 0, target: 1 };
  return {
    current: progress.current,
    target: progress.target,
    percentage: badge.progress || 0,
  };
}
