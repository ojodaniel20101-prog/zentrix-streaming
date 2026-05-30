import { getDb } from "./db";
import { watchProgress } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export async function upsertProgress(data: typeof watchProgress.$inferInsert) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert progress: database not available");
    return;
  }

  // Try to find existing progress
  const existing = await db
    .select()
    .from(watchProgress)
    .where(
      and(
        eq(watchProgress.userId, data.userId),
        eq(watchProgress.contentId, data.contentId),
        eq(watchProgress.contentType, data.contentType),
        data.episodeId ? eq(watchProgress.episodeId, data.episodeId) : undefined
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Update existing record
    return await db
      .update(watchProgress)
      .set({
        progressSeconds: data.progressSeconds,
        durationSeconds: data.durationSeconds,
        updatedAt: new Date(),
      })
      .where(eq(watchProgress.id, existing[0].id));
  } else {
    // Insert new record
    return await db.insert(watchProgress).values(data);
  }
}

export async function getUserProgress(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get progress: database not available");
    return [];
  }

  return await db
    .select()
    .from(watchProgress)
    .where(eq(watchProgress.userId, userId))
    .orderBy(desc(watchProgress.updatedAt));
}

export async function getRecentProgress(userId: number, limit: number = 10) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get recent progress: database not available");
    return [];
  }

  return await db
    .select()
    .from(watchProgress)
    .where(eq(watchProgress.userId, userId))
    .orderBy(desc(watchProgress.updatedAt))
    .limit(limit);
}

export async function deleteProgress(userId: number, id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete progress: database not available");
    return;
  }

  return await db
    .delete(watchProgress)
    .where(and(eq(watchProgress.id, id), eq(watchProgress.userId, userId)));
}
