/**
 * LLM-Powered Recommendations Engine
 * Generates personalized content recommendations based on user viewing patterns
 */

import { invokeLLM } from "./_core/llm";
import { getDb } from "./db";

export interface UserProfile {
  userId: number;
  watchHistory: Array<{
    id: number;
    type: "movie" | "tv" | "anime";
    title: string;
    genres: string[];
    rating: number;
    watchedAt: Date;
  }>;
  preferences: {
    favoriteGenres: string[];
    favoriteActors: string[];
    preferredLanguages: string[];
    watchedCount: number;
    averageRating: number;
  };
}

export interface Recommendation {
  id: number;
  type: "movie" | "tv" | "anime";
  title: string;
  reason: string;
  confidence: number;
  genres: string[];
  rating: number;
}

/**
 * Build user profile from watch history
 */
export async function buildUserProfile(userId: number): Promise<UserProfile> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Get user's watch history from localStorage (client-side)
  // In production, this would come from database
  const watchHistory: Array<{
    id: number;
    type: "movie" | "tv" | "anime";
    title: string;
    genres: string[];
    rating: number;
    watchedAt: Date;
  }> = [];
  const preferences = {
    favoriteGenres: [] as string[],
    favoriteActors: [] as string[],
    preferredLanguages: ["English"],
    watchedCount: 0,
    averageRating: 0,
  };

  return {
    userId,
    watchHistory,
    preferences,
  };
}

/**
 * Generate recommendations using LLM
 */
export async function generateRecommendations(
  userProfile: UserProfile,
  limit: number = 10
): Promise<Recommendation[]> {
  try {
    // Build context from user profile
    const watchedTitles = userProfile.watchHistory
      .slice(0, 10)
      .map((item) => `${item.title} (${item.type}, rated ${item.rating}/10)`)
      .join("\n");

    const favoriteGenres = userProfile.preferences.favoriteGenres.join(", ") || "Action, Drama, Sci-Fi";

    const prompt = `You are a movie and TV show recommendation engine. Based on the user's viewing history and preferences, suggest ${limit} content recommendations.

User's Watch History:
${watchedTitles}

User's Favorite Genres: ${favoriteGenres}
Average Rating Given: ${userProfile.preferences.averageRating.toFixed(1)}/10
Content Watched: ${userProfile.preferences.watchedCount} items

Generate ${limit} personalized recommendations. For each recommendation, provide:
1. Title
2. Type (movie/tv/anime)
3. Reason for recommendation
4. Confidence score (0-1)
5. Genres (comma-separated)
6. Estimated rating (0-10)

Format as JSON array with objects containing: title, type, reason, confidence, genres, rating`;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are an expert movie and TV show recommendation engine. Provide personalized recommendations based on user viewing patterns. Always respond with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "recommendations",
          strict: true,
          schema: {
            type: "object",
            properties: {
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    type: { type: "string", enum: ["movie", "tv", "anime"] },
                    reason: { type: "string" },
                    confidence: { type: "number" },
                    genres: { type: "string" },
                    rating: { type: "number" },
                  },
                  required: ["title", "type", "reason", "confidence", "genres", "rating"],
                },
              },
            },
            required: ["recommendations"],
          },
        },
      },
    });

    // Parse LLM response
    const messageContent = response.choices[0]?.message.content;
    if (!messageContent) {
      throw new Error("No content in LLM response");
    }

    // Handle both string and array content types
    let content: string;
    if (typeof messageContent === "string") {
      content = messageContent;
    } else if (Array.isArray(messageContent)) {
      const textContent = messageContent.find((c: any) => c.type === "text");
      content = (textContent as any)?.text || "";
    } else {
      throw new Error("Unexpected LLM response format");
    }

    const parsed = JSON.parse(content);
    const recommendations: Recommendation[] = parsed.recommendations.map(
      (rec: any, index: number) => ({
        id: index + 1,
        type: rec.type,
        title: rec.title,
        reason: rec.reason,
        confidence: rec.confidence,
        genres: rec.genres.split(",").map((g: string) => g.trim()),
        rating: rec.rating,
      })
    );

    return recommendations;
  } catch (error) {
    console.error("[Recommendations] Error generating recommendations:", error);
    throw error;
  }
}

/**
 * Get collaborative recommendations (users who watched similar content)
 */
export async function getCollaborativeRecommendations(
  userId: number,
  limit: number = 5
): Promise<Recommendation[]> {
  try {
    // In production, this would query user similarity from database
    // For now, return empty array
    return [];
  } catch (error) {
    console.error("[Recommendations] Error getting collaborative recommendations:", error);
    return [];
  }
}

/**
 * Get trending recommendations
 */
export async function getTrendingRecommendations(limit: number = 10): Promise<Recommendation[]> {
  try {
    const prompt = `Generate ${limit} trending movie, TV show, and anime recommendations for 2026. 
    
    For each recommendation, provide:
    1. Title
    2. Type (movie/tv/anime)
    3. Why it's trending
    4. Confidence (0-1)
    5. Genres
    6. Rating (0-10)
    
    Format as JSON array with objects containing: title, type, reason, confidence, genres, rating`;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a trending content recommendation engine. Provide current trending movies, TV shows, and anime. Always respond with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "trending",
          strict: true,
          schema: {
            type: "object",
            properties: {
              recommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    type: { type: "string", enum: ["movie", "tv", "anime"] },
                    reason: { type: "string" },
                    confidence: { type: "number" },
                    genres: { type: "string" },
                    rating: { type: "number" },
                  },
                  required: ["title", "type", "reason", "confidence", "genres", "rating"],
                },
              },
            },
            required: ["recommendations"],
          },
        },
      },
    });

    const messageContent = response.choices[0]?.message.content;
    if (!messageContent) {
      throw new Error("No content in LLM response");
    }

    // Handle both string and array content types
    let content: string;
    if (typeof messageContent === "string") {
      content = messageContent;
    } else if (Array.isArray(messageContent)) {
      const textContent = messageContent.find((c: any) => c.type === "text");
      content = (textContent as any)?.text || "";
    } else {
      throw new Error("Unexpected LLM response format");
    }

    const parsed = JSON.parse(content);
    return parsed.recommendations.map((rec: any, index: number) => ({
      id: index + 1,
      type: rec.type,
      title: rec.title,
      reason: rec.reason,
      confidence: rec.confidence,
      genres: rec.genres.split(",").map((g: string) => g.trim()),
      rating: rec.rating,
    }));
  } catch (error) {
    console.error("[Recommendations] Error getting trending recommendations:", error);
    return [];
  }
}

/**
 * Track user activity for recommendations
 */
export interface UserActivity {
  userId: number;
  action: "watch" | "rate" | "search" | "add_watchlist" | "remove_watchlist";
  contentId: number;
  contentType: "movie" | "tv" | "anime";
  contentTitle: string;
  rating?: number;
  timestamp: Date;
}

/**
 * Save user activity
 */
export async function trackUserActivity(activity: UserActivity): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[Recommendations] Database not available for tracking");
      return;
    }

    // In production, save to database
    // For now, just log
    console.log("[Recommendations] Tracked activity:", activity);
  } catch (error) {
    console.error("[Recommendations] Error tracking activity:", error);
  }
}

/**
 * Get user analytics
 */
export async function getUserAnalytics(userId: number) {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // In production, query from database
    return {
      totalWatched: 0,
      totalRatings: 0,
      averageRating: 0,
      favoriteGenres: [],
      watchTime: 0,
      lastActive: new Date(),
    };
  } catch (error) {
    console.error("[Recommendations] Error getting user analytics:", error);
    throw error;
  }
}
