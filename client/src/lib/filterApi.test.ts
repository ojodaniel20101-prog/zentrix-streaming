import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getFilteredMovies,
  getFilteredTVShows,
  getFilteredAnime,
  getFilteredAnimations,
  searchMovies,
  searchTVShows,
  searchAnime,
} from "./filterApi";

// Mock fetch
global.fetch = vi.fn();

describe("Filter API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Movies Filtering", () => {
    it("should fetch movies with genre filter", async () => {
      const mockResponse = {
        results: [
          { id: 1, title: "Test Movie", vote_average: 8.5 },
        ],
        total_pages: 10,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getFilteredMovies({
        genres: [28], // Action
        page: 1,
        sortBy: "popularity",
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0].title).toBe("Test Movie");
      expect(result.total_pages).toBe(10);
    });

    it("should fetch movies with year filter", async () => {
      const mockResponse = {
        results: [{ id: 1, title: "2023 Movie", release_date: "2023-01-01" }],
        total_pages: 5,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getFilteredMovies({
        genres: [],
        year: 2023,
        page: 1,
        sortBy: "release_date",
      });

      expect(result.results[0].release_date).toContain("2023");
    });

    it("should handle pagination correctly", async () => {
      const mockResponse = {
        results: Array(20).fill(null).map((_, i) => ({ id: i, title: `Movie ${i}` })),
        total_pages: 50,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getFilteredMovies({
        genres: [],
        page: 5,
        sortBy: "popularity",
      });

      expect(result.results).toHaveLength(20);
      expect(result.total_pages).toBe(50);
    });

    it("should apply sort options correctly", async () => {
      const mockResponse = {
        results: [
          { id: 1, title: "Movie A", vote_average: 9.0 },
          { id: 2, title: "Movie B", vote_average: 8.5 },
        ],
        total_pages: 1,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getFilteredMovies({
        genres: [],
        page: 1,
        sortBy: "rating",
      });

      expect(result.results[0].vote_average).toBe(9.0);
    });
  });

  describe("TV Shows Filtering", () => {
    it("should fetch TV shows with genre filter", async () => {
      const mockResponse = {
        results: [
          { id: 1, name: "Test Show", vote_average: 8.0 },
        ],
        total_pages: 8,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getFilteredTVShows({
        genres: [18], // Drama
        page: 1,
        sortBy: "popularity",
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0].name).toBe("Test Show");
    });

    it("should handle TV show pagination", async () => {
      const mockResponse = {
        results: Array(20).fill(null).map((_, i) => ({ id: i, name: `Show ${i}` })),
        total_pages: 30,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getFilteredTVShows({
        genres: [],
        page: 2,
        sortBy: "popularity",
      });

      expect(result.results).toHaveLength(20);
      expect(result.total_pages).toBe(30);
    });
  });

  describe("Anime Filtering", () => {
    it("should fetch anime with genre filter", async () => {
      const mockResponse = {
        data: {
          Page: {
            media: [
              { id: 1, title: { romaji: "Test Anime" }, averageScore: 85 },
            ],
          },
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getFilteredAnime({
        genres: ["Action"],
        page: 1,
      });

      expect(result.Page.media).toHaveLength(1);
      expect(result.Page.media[0].title.romaji).toBe("Test Anime");
    });

    it("should handle anime season filter", async () => {
      const mockResponse = {
        data: {
          Page: {
            media: [
              { id: 1, title: { romaji: "Spring Anime" }, season: "SPRING" },
            ],
          },
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getFilteredAnime({
        genres: [],
        season: "SPRING",
        page: 1,
      });

      expect(result.Page.media[0].season).toBe("SPRING");
    });

    it("should handle anime status filter", async () => {
      const mockResponse = {
        data: {
          Page: {
            media: [
              { id: 1, title: { romaji: "Ongoing Anime" }, status: "RELEASING" },
            ],
          },
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getFilteredAnime({
        genres: [],
        status: "RELEASING",
        page: 1,
      });

      expect(result.Page.media[0].status).toBe("RELEASING");
    });
  });

  describe("Animation Filtering", () => {
    it("should fetch animation by studio", async () => {
      const mockResponse = {
        results: [
          { id: 1, title: "Animated Movie", production_companies: [{ name: "Disney" }] },
        ],
        total_pages: 5,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getFilteredAnimations({
        genres: [16], // Animation
        studios: ["Disney"],
        page: 1,
      });

      expect(result.results).toHaveLength(1);
      expect(result.results[0].title).toBe("Animated Movie");
    });
  });

  describe("Search Functions", () => {
    it("should search movies by query", async () => {
      const mockResponse = {
        results: [
          { id: 1, title: "The Matrix", vote_average: 8.7 },
        ],
        total_pages: 1,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await searchMovies("The Matrix", 1);

      expect(result.results).toHaveLength(1);
      expect(result.results[0].title).toBe("The Matrix");
    });

    it("should search TV shows by query", async () => {
      const mockResponse = {
        results: [
          { id: 1, name: "Breaking Bad", vote_average: 9.5 },
        ],
        total_pages: 1,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await searchTVShows("Breaking Bad", 1);

      expect(result.results).toHaveLength(1);
      expect(result.results[0].name).toBe("Breaking Bad");
    });

    it("should search anime by query", async () => {
      const mockResponse = {
        data: {
          Page: {
            media: [
              { id: 1, title: { romaji: "Attack on Titan" }, averageScore: 88 },
            ],
          },
        },
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await searchAnime("Attack on Titan", 1);

      expect(result.Page.media).toHaveLength(1);
      expect(result.Page.media[0].title.romaji).toBe("Attack on Titan");
    });
  });

  describe("Error Handling", () => {
    it("should handle API errors gracefully", async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      try {
        await getFilteredMovies({
          genres: [],
          page: 1,
          sortBy: "popularity",
        });
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should handle network errors", async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error("Network error"));

      try {
        await getFilteredMovies({
          genres: [],
          page: 1,
          sortBy: "popularity",
        });
      } catch (error) {
        expect((error as Error).message).toContain("Network error");
      }
    });
  });

  describe("Filter Combinations", () => {
    it("should apply multiple filters together", async () => {
      const mockResponse = {
        results: [
          { id: 1, title: "Action Movie 2023", vote_average: 8.5, release_date: "2023-06-15" },
        ],
        total_pages: 3,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getFilteredMovies({
        genres: [28], // Action
        year: 2023,
        page: 1,
        sortBy: "rating",
      });

      expect(result.results[0].title).toContain("2023");
      expect(result.results[0].vote_average).toBe(8.5);
    });

    it("should handle empty results", async () => {
      const mockResponse = {
        results: [],
        total_pages: 0,
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await getFilteredMovies({
        genres: [999], // Non-existent genre
        page: 1,
        sortBy: "popularity",
      });

      expect(result.results).toHaveLength(0);
      expect(result.total_pages).toBe(0);
    });
  });
});
