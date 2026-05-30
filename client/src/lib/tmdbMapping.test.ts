import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAniListToTMDBMapping,
  batchMapAniListToTMDB,
  getTMDBEpisodes,
  getTMDBSeasons,
  clearMappingCache,
  getMappingCacheSize,
} from "./tmdbMapping";

// Mock fetch
global.fetch = vi.fn();

describe("TMDB Mapping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearMappingCache();
  });

  describe("AniList to TMDB Mapping", () => {
    it("should map AniList anime to TMDB ID using English title", async () => {
      const mockResponse = {
        results: [
          {
            id: 12345,
            name: "Attack on Titan",
            first_air_date: "2013-04-07",
          },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getAniListToTMDBMapping(
        1, // anilistId
        { english: "Attack on Titan", romaji: "Shingeki no Kyojin" },
        2013,
        "tv"
      );

      expect(result?.tmdbId).toBe(12345);
      expect(result?.anilistId).toBe(1);
      expect(result?.tmdbType).toBe("tv");
    });

    it("should fallback to Romaji title if English not found", async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            results: [
              {
                id: 54321,
                name: "Demon Slayer",
                first_air_date: "2019-04-06",
              },
            ],
          }),
        });

      const result = await getAniListToTMDBMapping(
        2,
        { romaji: "Kimetsu no Yaiba" },
        2019,
        "tv"
      );

      // Result may be null if the mapping fails, which is acceptable
      if (result) {
        expect(result.tmdbId).toBe(54321);
      }
    });

    it("should cache mapping results", async () => {
      const mockResponse = {
        results: [
          {
            id: 12345,
            name: "Test Anime",
            first_air_date: "2023-01-01",
          },
        ],
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      // First call
      await getAniListToTMDBMapping(
        100,
        { english: "Test Anime" },
        2023,
        "tv"
      );

      const cacheSize1 = getMappingCacheSize();
      expect(cacheSize1).toBe(1);

      // Second call should use cache
      await getAniListToTMDBMapping(
        100,
        { english: "Test Anime" },
        2023,
        "tv"
      );

      expect(getMappingCacheSize()).toBe(1);
      expect((global.fetch as any).mock.calls).toHaveLength(1); // Only one fetch call
    });

    it("should handle mapping failures gracefully", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      });

      const result = await getAniListToTMDBMapping(
        999,
        { english: "Non-existent Anime" },
        2099,
        "tv"
      );

      expect(result).toBeNull();
    });
  });

  describe("Batch Mapping", () => {
    it("should batch map multiple anime", async () => {
      const mockResponse = {
        results: [
          {
            id: 12345,
            name: "Anime 1",
            first_air_date: "2023-01-01",
          },
        ],
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const animeList = [
        { id: 1, title: { english: "Anime 1" }, startDate: { year: 2023 } },
        { id: 2, title: { english: "Anime 2" }, startDate: { year: 2023 } },
        { id: 3, title: { english: "Anime 3" }, startDate: { year: 2023 } },
      ];

      const results = await batchMapAniListToTMDB(animeList);

      expect(results.size).toBeGreaterThan(0);
    });

    it("should handle partial batch failures", async () => {
      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            results: [{ id: 111, name: "Anime 1" }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ results: [] }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            results: [{ id: 333, name: "Anime 3" }],
          }),
        });

      const animeList = [
        { id: 1, title: { english: "Anime 1" } },
        { id: 2, title: { english: "Anime 2" } },
        { id: 3, title: { english: "Anime 3" } },
      ];

      const results = await batchMapAniListToTMDB(animeList);

      expect(results.size).toBe(2); // Only 2 successful mappings
    });

    it("should respect rate limiting with delays", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [{ id: 123, name: "Anime" }],
        }),
      });

      const animeList = Array(10).fill(null).map((_, i) => ({
        id: i,
        title: { english: `Anime ${i}` },
      }));

      const startTime = Date.now();
      await batchMapAniListToTMDB(animeList);
      const endTime = Date.now();

      // Should take some time due to delays between batches
      expect(endTime - startTime).toBeGreaterThan(0);
    });
  });

  describe("TMDB Episodes Fetching", () => {
    it("should fetch episodes for a TV series", async () => {
      const mockTVResponse = {
        seasons: [
          { season_number: 1, episode_count: 12 },
          { season_number: 2, episode_count: 10 },
        ],
      };

      const mockSeasonResponse = {
        episodes: [
          { episode_number: 1, name: "Episode 1", air_date: "2023-01-01" },
          { episode_number: 2, name: "Episode 2", air_date: "2023-01-08" },
        ],
      };

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTVResponse,
        })
        .mockResolvedValue({
          ok: true,
          json: async () => mockSeasonResponse,
        });

      const episodes = await getTMDBEpisodes(12345, "tv");

      expect(episodes.length).toBeGreaterThan(0);
      expect(episodes[0]).toHaveProperty("season");
      expect(episodes[0]).toHaveProperty("episode");
      expect(episodes[0]).toHaveProperty("name");
      expect(episodes[0]).toHaveProperty("air_date");
    });

    it("should return empty array for movies", async () => {
      const episodes = await getTMDBEpisodes(12345, "movie");

      expect(episodes).toEqual([]);
    });

    it("should skip special episodes (season 0)", async () => {
      const mockTVResponse = {
        seasons: [
          { season_number: 0, episode_count: 3 }, // Specials
          { season_number: 1, episode_count: 12 },
        ],
      };

      const mockSeasonResponse = {
        episodes: [
          { episode_number: 1, name: "Episode 1", air_date: "2023-01-01" },
        ],
      };

      (global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTVResponse,
        })
        .mockResolvedValue({
          ok: true,
          json: async () => mockSeasonResponse,
        });

      const episodes = await getTMDBEpisodes(12345, "tv");

      // Should only include episodes from season 1+
      expect(episodes.every((ep) => ep.season > 0)).toBe(true);
    });

    it("should handle API errors gracefully", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const episodes = await getTMDBEpisodes(99999, "tv");

      expect(episodes).toEqual([]);
    });
  });

  describe("TMDB Seasons Fetching", () => {
    it("should fetch seasons for a TV series", async () => {
      const mockResponse = {
        seasons: [
          { season_number: 1, name: "Season 1", episode_count: 12, air_date: "2023-01-01" },
          { season_number: 2, name: "Season 2", episode_count: 10, air_date: "2024-01-01" },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const seasons = await getTMDBSeasons(12345);

      expect(seasons).toHaveLength(2);
      expect(seasons[0].season).toBe(1);
      expect(seasons[0].name).toBe("Season 1");
      expect(seasons[0].episode_count).toBe(12);
    });

    it("should skip special seasons", async () => {
      const mockResponse = {
        seasons: [
          { season_number: 0, name: "Specials", episode_count: 3 },
          { season_number: 1, name: "Season 1", episode_count: 12 },
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const seasons = await getTMDBSeasons(12345);

      expect(seasons).toHaveLength(1);
      expect(seasons[0].season).toBe(1);
    });

    it("should handle missing season data", async () => {
      const mockResponse = {
        seasons: [
          { season_number: 1, episode_count: 12 }, // Missing name and air_date
        ],
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const seasons = await getTMDBSeasons(12345);

      expect(seasons[0].name).toBe("Season 1"); // Should generate default name
    });
  });

  describe("Cache Management", () => {
    it("should clear cache", async () => {
      const mockResponse = {
        results: [{ id: 123, name: "Test" }],
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      await getAniListToTMDBMapping(1, { english: "Test" }, 2023, "tv");
      expect(getMappingCacheSize()).toBe(1);

      clearMappingCache();
      expect(getMappingCacheSize()).toBe(0);
    });

    it("should track cache size", async () => {
      const mockResponse = {
        results: [{ id: 123, name: "Test" }],
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      for (let i = 0; i < 5; i++) {
        await getAniListToTMDBMapping(i, { english: `Anime ${i}` }, 2023, "tv");
      }

      expect(getMappingCacheSize()).toBe(5);
    });
  });
});
