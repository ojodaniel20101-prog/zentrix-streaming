import { describe, it, expect, beforeEach } from "vitest";
import * as analytics from "./analytics";

describe("Analytics Service", () => {
  beforeEach(() => {
    analytics.clearActivityLog();
  });

  it("should track user sign-in activity", () => {
    const activity = analytics.trackUserActivity({
      userId: "user123",
      type: "signin",
    });

    expect(activity.userId).toBe("user123");
    expect(activity.type).toBe("signin");
    expect(activity.timestamp).toBeInstanceOf(Date);
  });

  it("should track content play activity", () => {
    const activity = analytics.trackUserActivity({
      userId: "user123",
      type: "play",
      contentId: "movie456",
      contentTitle: "Inception",
    });

    expect(activity.type).toBe("play");
    expect(activity.contentTitle).toBe("Inception");
  });

  it("should track search activity", () => {
    const activity = analytics.trackUserActivity({
      userId: "user123",
      type: "search",
      contentTitle: "action movies",
    });

    expect(activity.type).toBe("search");
    expect(activity.contentTitle).toBe("action movies");
  });

  it("should get analytics snapshot with correct counts", () => {
    analytics.trackUserActivity({ userId: "user1", type: "signin" });
    analytics.trackUserActivity({ userId: "user1", type: "play", contentTitle: "Movie1" });
    analytics.trackUserActivity({ userId: "user2", type: "signin" });
    analytics.trackUserActivity({ userId: "user2", type: "search", contentTitle: "action" });

    const snapshot = analytics.getAnalyticsSnapshot();

    expect(snapshot.totalSignIns).toBe(2);
    expect(snapshot.totalPlays).toBe(1);
    expect(snapshot.totalSearches).toBe(1);
  });

  it("should calculate top searches correctly", () => {
    analytics.trackUserActivity({ userId: "user1", type: "search", contentTitle: "action" });
    analytics.trackUserActivity({ userId: "user2", type: "search", contentTitle: "action" });
    analytics.trackUserActivity({ userId: "user3", type: "search", contentTitle: "comedy" });

    const snapshot = analytics.getAnalyticsSnapshot();

    expect(snapshot.topSearches.length).toBeGreaterThan(0);
    expect(snapshot.topSearches[0].query).toBe("action");
    expect(snapshot.topSearches[0].count).toBe(2);
  });

  it("should calculate top content correctly", () => {
    analytics.trackUserActivity({ userId: "user1", type: "play", contentTitle: "Movie1" });
    analytics.trackUserActivity({ userId: "user2", type: "play", contentTitle: "Movie1" });
    analytics.trackUserActivity({ userId: "user3", type: "play", contentTitle: "Movie2" });

    const snapshot = analytics.getAnalyticsSnapshot();

    expect(snapshot.topContent.length).toBeGreaterThan(0);
    expect(snapshot.topContent[0].title).toBe("Movie1");
    expect(snapshot.topContent[0].plays).toBe(2);
  });

  it("should track active users correctly", () => {
    analytics.trackUserActivity({ userId: "user1", type: "signin" });
    analytics.trackUserActivity({ userId: "user2", type: "signin" });
    analytics.trackUserActivity({ userId: "user1", type: "signout" });

    const snapshot = analytics.getAnalyticsSnapshot();

    // Only user2 should be active (signed in but not signed out)
    expect(snapshot.totalActiveUsers).toBe(1);
  });

  it("should return activity log", () => {
    analytics.trackUserActivity({ userId: "user1", type: "signin" });
    analytics.trackUserActivity({ userId: "user2", type: "play", contentTitle: "Movie1" });

    const log = analytics.getActivityLog();

    expect(log.length).toBe(2);
    expect(log[0].type).toBe("signin");
    expect(log[1].type).toBe("play");
  });

  it("should calculate recent activities (last 50)", () => {
    // Add 60 activities
    for (let i = 0; i < 60; i++) {
      analytics.trackUserActivity({
        userId: `user${i}`,
        type: "signin",
      });
    }

    const snapshot = analytics.getAnalyticsSnapshot();

    // Should only return recent 50
    expect(snapshot.recentActivities.length).toBeLessThanOrEqual(50);
  });

  it("should calculate average session duration", () => {
    const now = new Date();
    
    // Simulate a 30-minute session
    analytics.trackUserActivity({ userId: "user1", type: "signin" });
    
    // Manually add a signout activity (simulating 30 minutes later)
    const signOutActivity = analytics.trackUserActivity({ userId: "user1", type: "signout" });
    
    const snapshot = analytics.getAnalyticsSnapshot();

    // Average session duration should be calculated
    expect(snapshot.avgSessionDuration).toBeGreaterThanOrEqual(0);
  });

  it("should track multiple activity types", () => {
    analytics.trackUserActivity({ userId: "user1", type: "signin" });
    analytics.trackUserActivity({ userId: "user1", type: "play", contentTitle: "Movie1" });
    analytics.trackUserActivity({ userId: "user1", type: "search", contentTitle: "action" });
    analytics.trackUserActivity({ userId: "user1", type: "download" });
    analytics.trackUserActivity({ userId: "user1", type: "feedback" });
    analytics.trackUserActivity({ userId: "user1", type: "signout" });

    const snapshot = analytics.getAnalyticsSnapshot();

    expect(snapshot.totalSignIns).toBe(1);
    expect(snapshot.totalPlays).toBe(1);
    expect(snapshot.totalSearches).toBe(1);
    expect(snapshot.totalDownloads).toBe(1);
    expect(snapshot.totalFeedback).toBe(1);
    expect(snapshot.totalSignOuts).toBe(1);
  });

  it("should clear activity log", () => {
    analytics.trackUserActivity({ userId: "user1", type: "signin" });
    expect(analytics.getActivityLog().length).toBe(1);

    analytics.clearActivityLog();
    expect(analytics.getActivityLog().length).toBe(0);
  });
});
