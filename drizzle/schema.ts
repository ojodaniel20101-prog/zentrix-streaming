import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Channels table for live streaming
export const channels = mysqlTable("channels", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  alt_names: text("alt_names"), // JSON stringified
  country: varchar("country", { length: 2 }),
  categories: text("categories"), // JSON stringified
  network: varchar("network", { length: 255 }),
  website: varchar("website", { length: 255 }),
  logo_url: varchar("logo_url", { length: 500 }),
  is_nsfw: int("is_nsfw").default(0),
  source: varchar("source", { length: 50 }).default("iptv-org"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Channel = typeof channels.$inferSelect;
export type InsertChannel = typeof channels.$inferInsert;

// Streams table for channel streaming URLs
export const streams = mysqlTable("streams", {
  id: int("id").autoincrement().primaryKey(),
  channel_id: varchar("channel_id", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }),
  url: varchar("url", { length: 1000 }).notNull(),
  quality: varchar("quality", { length: 50 }),
  referrer: varchar("referrer", { length: 500 }),
  user_agent: text("user_agent"),
  is_working: int("is_working").default(1),
  last_checked: timestamp("last_checked"),
  source: varchar("source", { length: 50 }).default("iptv-org"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Stream = typeof streams.$inferSelect;
export type InsertStream = typeof streams.$inferInsert;

// User watchlist for channels
export const channel_watchlist = mysqlTable("channel_watchlist", {
  id: int("id").autoincrement().primaryKey(),
  user_id: int("user_id").notNull(),
  channel_id: varchar("channel_id", { length: 255 }).notNull(),
  added_at: timestamp("added_at").defaultNow().notNull(),
});

export type ChannelWatchlist = typeof channel_watchlist.$inferSelect;

// User feedback and messages table
export const userFeedback = mysqlTable("user_feedback", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  type: mysqlEnum("type", ["bug", "feature_request", "opinion", "general_feedback", "other"]).notNull(),
  subject: varchar("subject", { length: 255 }).notNull(),
  message: text("message").notNull(),
  email: varchar("email", { length: 320 }),
  status: mysqlEnum("status", ["new", "read", "resolved", "archived"]).default("new").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium").notNull(),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserFeedback = typeof userFeedback.$inferSelect;
export type InsertUserFeedback = typeof userFeedback.$inferInsert;

// User feedback replies for two-way messaging
export const feedbackReplies = mysqlTable("feedback_replies", {
  id: int("id").autoincrement().primaryKey(),
  feedbackId: int("feedback_id").notNull(),
  userId: int("user_id").notNull(),
  isAdminReply: int("is_admin_reply").default(0).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FeedbackReply = typeof feedbackReplies.$inferSelect;
export type InsertFeedbackReply = typeof feedbackReplies.$inferInsert;

// User activity tracking for analytics
// userId is nullable to support anonymous/unauthenticated tracking
export const userActivities = mysqlTable("user_activities", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id"), // nullable — null means anonymous/guest visitor
  sessionId: varchar("session_id", { length: 128 }), // anonymous session fingerprint
  type: mysqlEnum("type", ["signin", "signout", "watch", "search", "download", "feedback", "view"]).notNull(),
  userName: varchar("user_name", { length: 255 }),
  userEmail: varchar("user_email", { length: 320 }),
  contentId: varchar("content_id", { length: 255 }),   // for watch/view events
  contentTitle: varchar("content_title", { length: 500 }), // for watch/view events
  contentType: varchar("content_type", { length: 50 }), // movie | tv | anime | live
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  metadata: text("metadata"), // JSON for additional data
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UserActivity = typeof userActivities.$inferSelect;
export type InsertUserActivity = typeof userActivities.$inferInsert;

// Update userFeedback status enum to include in_progress and closed
// Status values: new, read, in_progress, resolved, closed

// Watch progress table for "Continue Watching" feature
export const watchProgress = mysqlTable("watch_progress", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  contentId: varchar("content_id", { length: 255 }).notNull(),
  contentType: mysqlEnum("content_type", ["movie", "tv", "anime"]).notNull(),
  progressSeconds: int("progress_seconds").notNull(),
  durationSeconds: int("duration_seconds").notNull(),
  episodeId: varchar("episode_id", { length: 255 }),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type WatchProgress = typeof watchProgress.$inferSelect;
export type InsertWatchProgress = typeof watchProgress.$inferInsert;

// ─── Sports Tables ─────────────────────────────────────────────────────────

export const sportEvents = mysqlTable("sport_events", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  sport: varchar("sport", { length: 100 }).notNull(),
  league: varchar("league", { length: 255 }),
  leagueId: varchar("league_id", { length: 50 }),
  homeTeam: varchar("home_team", { length: 255 }),
  awayTeam: varchar("away_team", { length: 255 }),
  homeScore: varchar("home_score", { length: 20 }),
  awayScore: varchar("away_score", { length: 20 }),
  thumbnailUrl: varchar("thumbnail_url", { length: 1000 }),
  startTime: timestamp("start_time"),
  status: mysqlEnum("status", ["live", "upcoming", "finished"]).default("upcoming").notNull(),
  embedUrl: text("embed_url"),
  youtubeVideoId: varchar("youtube_video_id", { length: 50 }),
  strVideo: varchar("str_video", { length: 1000 }),
  strThumb: varchar("str_thumb", { length: 1000 }),
  externalId: varchar("external_id", { length: 100 }),
  venue: varchar("venue", { length: 500 }),
  country: varchar("country", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SportEvent = typeof sportEvents.$inferSelect;
export type InsertSportEvent = typeof sportEvents.$inferInsert;

export const sportStreams = mysqlTable("sport_streams", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("event_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  url: varchar("url", { length: 1000 }).notNull(),
  quality: varchar("quality", { length: 50 }),
  isWorking: int("is_working").default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SportStream = typeof sportStreams.$inferSelect;
export type InsertSportStream = typeof sportStreams.$inferInsert;
