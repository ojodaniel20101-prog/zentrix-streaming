import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import * as iptvOrgService from "./_core/iptvOrgService";
import * as recommendations from "./recommendations";
import * as db from "./db";
import * as analytics from "./analytics";
import * as activity from "./activity";
import * as watchProgressDb from "./watchProgressDb";


export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  watchProgress: router({
    save: protectedProcedure
      .input(
        z.object({
          contentId: z.string(),
          contentType: z.enum(["movie", "tv", "anime"]),
          progressSeconds: z.number(),
          durationSeconds: z.number(),
          episodeId: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await watchProgressDb.upsertProgress({
          ...input,
          userId: ctx.user.id,
        });
      }),
    getAll: protectedProcedure.query(async ({ ctx }) => {
      return await watchProgressDb.getUserProgress(ctx.user.id);
    }),
    remove: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return await watchProgressDb.deleteProgress(ctx.user.id, input.id);
      }),
  }),

  anime: router({
    // Get anime seasons and arcs using LLM
    getSeasonsByLLM: publicProcedure
      .input(
        z.object({
          animeTitle: z.string().min(1),
          animeId: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const { invokeLLM } = await import("./_core/llm");
          
          const prompt = `You are an anime expert. For the anime "${input.animeTitle}", provide a detailed JSON response with all seasons, arcs, parts, and specials.
          
          Return ONLY valid JSON in this exact format:
          {
            "seasons": [
              {
                "id": "s1",
                "name": "Season 1",
                "arcs": [
                  {
                    "id": "arc1",
                    "name": "Arc/Part Name",
                    "episodes": 26,
                    "type": "season",
                    "description": "Brief description of the arc or season"
                  }
                ]
              }
            ]
          }
          
          Include all seasons, arcs, parts, movies, specials, and OVAs. For each arc, specify:
          - episode count
          - type (season, arc, movie, special, ova)
          - brief description (1-2 sentences about the plot/content)`;

          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: "You are an anime database expert. Respond with only valid JSON.",
              },
              {
                role: "user",
                content: prompt,
              },
            ],
          });

          const messageContent = response.choices[0]?.message?.content;
          const content = typeof messageContent === 'string' ? messageContent : '';
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { seasons: [] };

          return parsed;
        } catch (error) {
          console.error("Error fetching anime seasons from LLM:", error);
          return { seasons: [] };
        }
      }),
  }),

  recommendations: router({
    // Get personalized recommendations for user
    getPersonalized: protectedProcedure
      .input(z.object({ limit: z.number().min(1).max(50).default(10) }))
      .query(async ({ input, ctx }) => {
        try {
          const userProfile = await recommendations.buildUserProfile(ctx.user.id);
          const recs = await recommendations.generateRecommendations(userProfile, input.limit);
          return recs;
        } catch (error) {
          console.error("Error getting personalized recommendations:", error);
          return [];
        }
      }),

    // Get trending recommendations
    getTrending: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(50).default(10) }))
      .query(async ({ input }) => {
        try {
          return await recommendations.getTrendingRecommendations(input.limit);
        } catch (error) {
          console.error("Error getting trending recommendations:", error);
          return [];
        }
      }),

    // Track user activity
    trackActivity: protectedProcedure
      .input(
        z.object({
          action: z.enum(["watch", "rate", "search", "add_watchlist", "remove_watchlist"]),
          contentId: z.number(),
          contentType: z.enum(["movie", "tv", "anime"]),
          contentTitle: z.string(),
          rating: z.number().min(0).max(10).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          await recommendations.trackUserActivity({
            userId: ctx.user.id,
            action: input.action,
            contentId: input.contentId,
            contentType: input.contentType,
            contentTitle: input.contentTitle,
            rating: input.rating,
            timestamp: new Date(),
          });
          return { success: true };
        } catch (error) {
          console.error("Error tracking activity:", error);
          return { success: false };
        }
      }),

        // Get user analytics
    getUserAnalytics: protectedProcedure.query(async ({ ctx }) => {
      try {
        return await recommendations.getUserAnalytics(ctx.user.id);
      } catch (error) {
        console.error("Error getting user analytics:", error);
        return null;
      }
    }),
  }),

  feedback: router({
    // Submit user feedback
    submit: protectedProcedure
      .input(
        z.object({
          category: z.string(),
          content: z.string(),
          rating: z.number().optional(),
          contentId: z.number().optional(),
          contentType: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          await db.insertFeedback({
            userId: ctx.user.id,
            category: input.category,
            content: input.content,
            rating: input.rating,
            contentId: input.contentId,
            contentType: input.contentType,
            createdAt: new Date(),
          });
          return { success: true };
        } catch (error) {
          console.error("Error submitting feedback:", error);
          return { success: false };
        }
      }),
  }),

  analytics: router({
    // Admin: full platform stats — includes anonymous + signed-in users
    getStats: protectedProcedure
      .input(z.object({ offsetMinutes: z.number().min(60).max(43200).default(1440) }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can view analytics");
        }
        try {
          return await activity.getAdminStats(input.offsetMinutes);
        } catch (error) {
          console.error("Error getting admin stats:", error);
          return null;
        }
      }),

    // Admin: legacy general analytics (kept for backward compat)
    getGeneral: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can view general analytics");
      }
      try {
        return await analytics.getGeneralAnalytics();
      } catch (error) {
        console.error("Error getting general analytics:", error);
        return null;
      }
    }),

    // Admin: content popularity
    getContentPopularity: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new Error("Only admins can view content popularity");
      }
      try {
        return await analytics.getContentPopularity();
      } catch (error) {
        console.error("Error getting content popularity:", error);
        return [];
      }
    }),

    // Public: track a search — works for signed-in AND anonymous users
    trackSearch: publicProcedure
      .input(
        z.object({
          query: z.string().max(200),
          sessionId: z.string().max(128).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          await activity.trackUserActivity({
            userId: ctx.user?.id ?? null,
            sessionId: input.sessionId ?? null,
            type: "search",
            userName: ctx.user?.name ?? undefined,
            userEmail: ctx.user?.email ?? undefined,
            contentTitle: input.query,
            ipAddress: ctx.req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim()
              ?? ctx.req.socket?.remoteAddress
              ?? undefined,
            userAgent: ctx.req.headers["user-agent"] ?? undefined,
          });
          return { success: true };
        } catch (error) {
          console.error("Error tracking search:", error);
          return { success: false };
        }
      }),

    // Public: track a view/watch event — works for signed-in AND anonymous users
    trackView: publicProcedure
      .input(
        z.object({
          contentId: z.string(),
          contentTitle: z.string().optional(),
          contentType: z.enum(["movie", "tv", "anime", "live"]).optional(),
          sessionId: z.string().max(128).optional(), // anonymous session token
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          await activity.trackUserActivity({
            userId: ctx.user?.id ?? null,
            sessionId: input.sessionId ?? null,
            type: ctx.user ? "watch" : "view",
            userName: ctx.user?.name ?? undefined,
            userEmail: ctx.user?.email ?? undefined,
            contentId: input.contentId,
            contentTitle: input.contentTitle,
            contentType: input.contentType,
            ipAddress: ctx.req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim()
              ?? ctx.req.socket?.remoteAddress
              ?? undefined,
            userAgent: ctx.req.headers["user-agent"] ?? undefined,
          });
          return { success: true };
        } catch (error) {
          console.error("Error tracking view:", error);
          return { success: false };
        }
      }),
  }),

  activity: router({
    // Admin: recent activity across all users (signed-in + anonymous)
    getRecent: protectedProcedure
      .input(z.object({ limit: z.number().min(1).max(100).default(50) }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin") {
          throw new Error("Only admins can view recent activity");
        }
        try {
          return await activity.getRecentActivity(input.limit);
        } catch (error) {
          console.error("Error getting recent activity:", error);
          return [];
        }
      }),

    // Get personal activity summary for the signed-in user
    getUserSummary: protectedProcedure.query(async ({ ctx }) => {
      try {
        return await activity.getUserActivitySummary(ctx.user.id);
      } catch (error) {
        console.error("Error getting user activity summary:", error);
        return null;
      }
    }),
  }),

  badges: router({
    // Get user badges
    getUserBadges: protectedProcedure.query(async ({ ctx }) => {
      try {
        const { getUserBadges } = await import("./badges");
        return await getUserBadges(ctx.user.id);
      } catch (error) {
        console.error("Error getting user badges:", error);
        return [];
      }
    }),

    // Check for new badges
    checkNewBadges: protectedProcedure.mutation(async ({ ctx }) => {
      try {
        const { checkForNewBadges } = await import("./badges");
        return await checkForNewBadges(ctx.user.id);
      } catch (error) {
        console.error("Error checking for new badges:", error);
        return [];
      }
    }),
  }),

});

export type AppRouter = typeof appRouter;
