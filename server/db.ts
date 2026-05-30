import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, userFeedback, feedbackReplies, type InsertUserFeedback, type UserFeedback, type InsertFeedbackReply, type FeedbackReply } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId || user.email === 'infinity2000edge@gmail.com') {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Feedback queries
export async function submitUserFeedback(feedback: InsertUserFeedback): Promise<UserFeedback | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot submit feedback: database not available");
    return null;
  }

  try {
    const result = await db.insert(userFeedback).values(feedback);
    const id = result[0]?.insertId;
    if (id) {
      const inserted = await db.select().from(userFeedback).where(eq(userFeedback.id, id)).limit(1);
      return inserted.length > 0 ? inserted[0] : null;
    }
    return null;
  } catch (error) {
    console.error("[Database] Failed to submit feedback:", error);
    throw error;
  }
}

export async function getUserFeedback(userId: number): Promise<UserFeedback[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get feedback: database not available");
    return [];
  }

  try {
    return await db.select().from(userFeedback).where(eq(userFeedback.userId, userId)).orderBy(desc(userFeedback.createdAt));
  } catch (error) {
    console.error("[Database] Failed to get feedback:", error);
    return [];
  }
}

export async function getAllFeedback(limit: number = 50, offset: number = 0): Promise<UserFeedback[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get all feedback: database not available");
    return [];
  }

  try {
    return await db.select().from(userFeedback).orderBy(desc(userFeedback.createdAt)).limit(limit).offset(offset);
  } catch (error) {
    console.error("[Database] Failed to get all feedback:", error);
    return [];
  }
}

export async function updateFeedbackStatus(feedbackId: number, status: string, adminNotes?: string): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update feedback: database not available");
    return;
  }

  try {
    const updates: Record<string, unknown> = { status };
    if (adminNotes !== undefined) {
      updates.adminNotes = adminNotes;
    }
    await db.update(userFeedback).set(updates).where(eq(userFeedback.id, feedbackId));
  } catch (error) {
    console.error("[Database] Failed to update feedback:", error);
    throw error;
  }
}


// Feedback replies functions
export async function addFeedbackReply(reply: InsertFeedbackReply): Promise<FeedbackReply | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot add reply: database not available");
    return null;
  }
  try {
    const result = await db.insert(feedbackReplies).values(reply);
    const id = (result as any).insertId;
    return await db.select().from(feedbackReplies).where(eq(feedbackReplies.id, id)).then(rows => rows[0] || null);
  } catch (error) {
    console.error("[Database] Failed to add reply:", error);
    throw error;
  }
}

export async function getFeedbackReplies(feedbackId: number): Promise<FeedbackReply[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get replies: database not available");
    return [];
  }
  try {
    return await db.select().from(feedbackReplies).where(eq(feedbackReplies.feedbackId, feedbackId)).orderBy(feedbackReplies.createdAt);
  } catch (error) {
    console.error("[Database] Failed to get replies:", error);
    return [];
  }
}

export async function getFeedbackWithReplies(feedbackId: number): Promise<{ feedback: UserFeedback | null; replies: FeedbackReply[] }> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get feedback with replies: database not available");
    return { feedback: null, replies: [] };
  }
  try {
    const feedback = await db.select().from(userFeedback).where(eq(userFeedback.id, feedbackId)).then(rows => rows[0] || null);
    const replies = await db.select().from(feedbackReplies).where(eq(feedbackReplies.feedbackId, feedbackId)).orderBy(feedbackReplies.createdAt);
    return { feedback, replies };
  } catch (error) {
    console.error("[Database] Failed to get feedback with replies:", error);
    return { feedback: null, replies: [] };
  }
}


export async function getUserFeedbackById(feedbackId: number): Promise<UserFeedback | null> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get feedback: database not available");
    return null;
  }
  try {
    const result = await db.select().from(userFeedback).where(eq(userFeedback.id, feedbackId));
    return result[0] || null;
  } catch (error) {
    console.error("[Database] Failed to get feedback:", error);
    return null;
  }
}
