import { getDb } from "./db";
import { userActivities } from "../drizzle/schema";
import { eq, desc, gte, isNull, or, sql } from "drizzle-orm";

// ─── Track Activity ───────────────────────────────────────────────────────────

/**
 * Track any user activity — works for both signed-in and anonymous users.
 * Pass userId for authenticated users; omit it (or pass null) for guests.
 * Pass sessionId for anonymous fingerprinting.
 */
export async function trackUserActivity(data: {
  userId?: number | null;
  sessionId?: string | null;
  type: "signin" | "signout" | "watch" | "search" | "download" | "feedback" | "view";
  userName?: string;
  userEmail?: string;
  contentId?: string;
  contentTitle?: string;
  contentType?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: string;
}) {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[Database] Cannot track activity: database not available");
      return;
    }
    await db.insert(userActivities).values({
      userId: data.userId ?? null,
      sessionId: data.sessionId ?? null,
      type: data.type,
      userName: data.userName,
      userEmail: data.userEmail,
      contentId: data.contentId,
      contentTitle: data.contentTitle,
      contentType: data.contentType,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      metadata: data.metadata,
      timestamp: new Date(),
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Failed to track activity:", error);
  }
}

// ─── Admin: Recent Activity ───────────────────────────────────────────────────

/** Returns the most recent N activities across ALL users (signed-in and anonymous). */
export async function getRecentActivity(limit: number = 50) {
  try {
    const db = await getDb();
    if (!db) return [];
    return await db
      .select()
      .from(userActivities)
      .orderBy(desc(userActivities.timestamp))
      .limit(limit);
  } catch (error) {
    console.error("Failed to get recent activity:", error);
    return [];
  }
}

// ─── Admin: Aggregate Stats ───────────────────────────────────────────────────

/**
 * Admin dashboard stats — counts ALL events regardless of auth status.
 */
export async function getAdminStats(offsetMinutes: number = 1440) {
  try {
    const db = await getDb();
    if (!db) return null;

    const since = new Date(Date.now() - offsetMinutes * 60 * 1000);

    const activities = await db
      .select()
      .from(userActivities)
      .where(gte(userActivities.timestamp, since))
      .orderBy(desc(userActivities.timestamp));

    // Total views/watches (signed-in + anonymous)
    const totalViews = activities.filter(
      (a) => a.type === "watch" || a.type === "view"
    ).length;

    // Unique signed-in users
    const signedInUserIds = new Set(
      activities.filter((a) => a.userId !== null).map((a) => a.userId)
    );

    // Unique anonymous sessions
    const anonSessions = new Set(
      activities
        .filter((a) => a.userId === null && a.sessionId)
        .map((a) => a.sessionId)
    );

    // Total unique visitors (signed-in + anon)
    const totalUniqueVisitors = signedInUserIds.size + anonSessions.size;

    // Sign-in/out counts
    const totalSignIns = activities.filter((a) => a.type === "signin").length;
    const totalSignOuts = activities.filter((a) => a.type === "signout").length;
    const totalSearches = activities.filter((a) => a.type === "search").length;
    const totalDownloads = activities.filter((a) => a.type === "download").length;
    const totalFeedback = activities.filter((a) => a.type === "feedback").length;

    // Active signed-in users (signed in, not signed out since)
    const userLastAction = new Map<number, { signin?: Date; signout?: Date }>();
    activities.forEach((a) => {
      if (!a.userId) return;
      if (!userLastAction.has(a.userId)) userLastAction.set(a.userId, {});
      const entry = userLastAction.get(a.userId)!;
      if (a.type === "signin") entry.signin = a.timestamp;
      if (a.type === "signout") entry.signout = a.timestamp;
    });
    let activeSignedInUsers = 0;
    userLastAction.forEach((entry) => {
      if (entry.signin && (!entry.signout || entry.signout < entry.signin)) {
        activeSignedInUsers++;
      }
    });

    // Top watched content (all users)
    const contentMap = new Map<string, { title: string; type: string; count: number }>();
    activities
      .filter((a) => (a.type === "watch" || a.type === "view") && a.contentId)
      .forEach((a) => {
        const key = a.contentId!;
        if (!contentMap.has(key)) {
          contentMap.set(key, {
            title: a.contentTitle || a.contentId || "Unknown",
            type: a.contentType || "unknown",
            count: 0,
          });
        }
        contentMap.get(key)!.count++;
      });
    const topContent = Array.from(contentMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top searches
    const searchMap = new Map<string, number>();
    activities
      .filter((a) => a.type === "search" && a.contentTitle)
      .forEach((a) => {
        const q = a.contentTitle!;
        searchMap.set(q, (searchMap.get(q) || 0) + 1);
      });
    const topSearches = Array.from(searchMap.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Hourly breakdown for the past 24h
    const hourBuckets: Record<string, { views: number; visitors: Set<string> }> = {};
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    activities
      .filter((a) => a.timestamp >= last24h)
      .forEach((a) => {
        const h = new Date(a.timestamp).getHours().toString().padStart(2, "0") + ":00";
        if (!hourBuckets[h]) hourBuckets[h] = { views: 0, visitors: new Set() };
        if (a.type === "watch" || a.type === "view") hourBuckets[h].views++;
        const visitorId = a.userId ? `u:${a.userId}` : a.sessionId ? `s:${a.sessionId}` : null;
        if (visitorId) hourBuckets[h].visitors.add(visitorId);
      });
    const hourlyStats = Object.entries(hourBuckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([hour, data]) => ({
        hour,
        views: data.views,
        uniqueVisitors: data.visitors.size,
      }));

    // Recent activities (last 50 with context)
    const recentActivities = activities.slice(0, 50).map((a) => ({
      id: a.id,
      userId: a.userId,
      sessionId: a.sessionId,
      type: a.type,
      userName: a.userName || (a.userId ? `User #${a.userId}` : "Anonymous"),
      contentTitle: a.contentTitle,
      contentType: a.contentType,
      timestamp: a.timestamp,
      ipAddress: a.ipAddress,
    }));

    return {
      period: `Last ${offsetMinutes < 60 ? `${offsetMinutes}m` : `${Math.round(offsetMinutes / 60)}h`}`,
      totalViews,
      totalUniqueVisitors,
      totalSignedInUsers: signedInUserIds.size,
      totalAnonVisitors: anonSessions.size,
      activeSignedInUsers,
      totalSignIns,
      totalSignOuts,
      totalSearches,
      totalDownloads,
      totalFeedback,
      topContent,
      topSearches,
      hourlyStats,
      recentActivities,
    };
  } catch (error) {
    console.error("Failed to get admin stats:", error);
    return null;
  }
}

// ─── Per-User Summary (for user profile pages) ────────────────────────────────

export async function getUserActivitySummary(userId: number) {
  try {
    const db = await getDb();
    if (!db) return null;

    const activities = await db
      .select()
      .from(userActivities)
      .where(eq(userActivities.userId, userId))
      .orderBy(desc(userActivities.timestamp))
      .limit(200);

    const watches = activities.filter((a) => a.type === "watch" || a.type === "view");
    const searches = activities.filter((a) => a.type === "search");

    return {
      totalWatches: watches.length,
      totalSearches: searches.length,
      recentWatches: watches.slice(0, 10).map((a) => ({
        contentId: a.contentId,
        contentTitle: a.contentTitle,
        contentType: a.contentType,
        timestamp: a.timestamp,
      })),
      recentSearches: searches.slice(0, 10).map((a) => ({
        query: a.contentTitle,
        timestamp: a.timestamp,
      })),
    };
  } catch (error) {
    console.error("Failed to get user activity summary:", error);
    return null;
  }
}

// ─── Legacy helpers (kept for backward compat) ───────────────────────────────

export async function getRecentActivities(limit: number = 50, offsetMinutes: number = 1440) {
  return getRecentActivity(limit);
}

export async function getActiveUsersCount(offsetMinutes: number = 1440) {
  const stats = await getAdminStats(offsetMinutes);
  return stats?.activeSignedInUsers ?? 0;
}

export async function getUniqueUsersCount(offsetMinutes: number = 1440) {
  const stats = await getAdminStats(offsetMinutes);
  return stats?.totalUniqueVisitors ?? 0;
}

export async function getSignInOutStats(offsetMinutes: number = 1440) {
  const stats = await getAdminStats(offsetMinutes);
  return { signins: stats?.totalSignIns ?? 0, signouts: stats?.totalSignOuts ?? 0 };
}
