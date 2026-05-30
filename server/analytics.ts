// Analytics tracking service

export interface UserActivity {
  id: number;
  userId: string;
  type: "signin" | "signout" | "play" | "search" | "download" | "feedback";
  contentId?: string;
  contentTitle?: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface AnalyticsSnapshot {
  totalActiveUsers: number;
  totalSignIns: number;
  totalSignOuts: number;
  totalPlays: number;
  totalSearches: number;
  totalDownloads: number;
  totalFeedback: number;
  recentActivities: UserActivity[];
  topSearches: { query: string; count: number }[];
  topContent: { title: string; plays: number }[];
  activeUsersLastHour: number;
  activeUsersLast24Hours: number;
  avgSessionDuration: number;
  peakHour: number;
}

// In-memory activity log (in production, this would be in database)
const activityLog: UserActivity[] = [];
const MAX_ACTIVITIES = 1000;

export function trackUserActivity(activity: Omit<UserActivity, "id" | "timestamp">): UserActivity {
  const newActivity: UserActivity = {
    ...activity,
    id: activityLog.length + 1,
    timestamp: new Date(),
  };

  activityLog.push(newActivity);

  // Keep only recent activities in memory
  if (activityLog.length > MAX_ACTIVITIES) {
    activityLog.shift();
  }

  return newActivity;
}

export function getAnalyticsSnapshot(): AnalyticsSnapshot {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // Count activities by type
  const signIns = activityLog.filter(a => a.type === "signin").length;
  const signOuts = activityLog.filter(a => a.type === "signout").length;
  const plays = activityLog.filter(a => a.type === "play").length;
  const searches = activityLog.filter(a => a.type === "search").length;
  const downloads = activityLog.filter(a => a.type === "download").length;
  const feedback = activityLog.filter(a => a.type === "feedback").length;

  // Active users (signed in but not signed out)
  const userSignIns = new Map<string, Date>();
  const userSignOuts = new Map<string, Date>();

  activityLog.forEach(activity => {
    if (activity.type === "signin") {
      userSignIns.set(activity.userId, activity.timestamp);
    } else if (activity.type === "signout") {
      userSignOuts.set(activity.userId, activity.timestamp);
    }
  });

  let totalActiveUsers = 0;
  userSignIns.forEach((signInTime, userId) => {
    const signOutTime = userSignOuts.get(userId);
    if (!signOutTime || signOutTime < signInTime) {
      totalActiveUsers++;
    }
  });

  // Recent activities (last 50)
  const recentActivities = activityLog.slice(-50);

  // Top searches
  const searchMap = new Map<string, number>();
  activityLog
    .filter(a => a.type === "search" && a.contentTitle)
    .forEach(a => {
      const query = a.contentTitle || "unknown";
      searchMap.set(query, (searchMap.get(query) || 0) + 1);
    });

  const topSearches = Array.from(searchMap.entries())
    .map(([query, count]) => ({ query, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Top content
  const contentMap = new Map<string, number>();
  activityLog
    .filter(a => a.type === "play" && a.contentTitle)
    .forEach(a => {
      const title = a.contentTitle || "unknown";
      contentMap.set(title, (contentMap.get(title) || 0) + 1);
    });

  const topContent = Array.from(contentMap.entries())
    .map(([title, plays]) => ({ title, plays }))
    .sort((a, b) => b.plays - a.plays)
    .slice(0, 10);

  // Active users in last hour
  const activeUsersLastHour = new Set(
    activityLog
      .filter(a => a.timestamp > oneHourAgo)
      .map(a => a.userId)
  ).size;

  // Active users in last 24 hours
  const activeUsersLast24Hours = new Set(
    activityLog
      .filter(a => a.timestamp > oneDayAgo)
      .map(a => a.userId)
  ).size;

  // Average session duration (simplified)
  const sessionDurations: number[] = [];
  const userSessions = new Map<string, { signIn: Date; signOut?: Date }>();

  activityLog.forEach(activity => {
    if (!userSessions.has(activity.userId)) {
      userSessions.set(activity.userId, { signIn: activity.timestamp });
    }

    const session = userSessions.get(activity.userId)!;
    if (activity.type === "signout") {
      session.signOut = activity.timestamp;
    }
  });

  userSessions.forEach(session => {
    if (session.signOut) {
      const duration = (session.signOut.getTime() - session.signIn.getTime()) / 1000 / 60; // in minutes
      if (duration > 0 && duration < 1440) {
        // Ignore sessions longer than 24 hours
        sessionDurations.push(duration);
      }
    }
  });

  const avgSessionDuration =
    sessionDurations.length > 0
      ? Math.round(sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length)
      : 0;

  // Peak hour (hour with most activities)
  const hourCounts = new Map<number, number>();
  activityLog.forEach(activity => {
    const hour = activity.timestamp.getHours();
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
  });

  let peakHour = 0;
  let maxActivities = 0;
  hourCounts.forEach((count, hour) => {
    if (count > maxActivities) {
      maxActivities = count;
      peakHour = hour;
    }
  });

  return {
    totalActiveUsers,
    totalSignIns: signIns,
    totalSignOuts: signOuts,
    totalPlays: plays,
    totalSearches: searches,
    totalDownloads: downloads,
    totalFeedback: feedback,
    recentActivities,
    topSearches,
    topContent,
    activeUsersLastHour,
    activeUsersLast24Hours,
    avgSessionDuration,
    peakHour,
  };
}

export function clearActivityLog(): void {
  activityLog.length = 0;
}

export function getActivityLog(): UserActivity[] {
  return [...activityLog];
}
