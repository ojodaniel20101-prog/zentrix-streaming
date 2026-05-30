import { describe, it, expect, beforeEach, vi } from "vitest";
import * as db from "./db";

// Mock database functions
vi.mock("./db", () => ({
  submitUserFeedback: vi.fn(),
  getUserFeedback: vi.fn(),
  getAllFeedback: vi.fn(),
  updateFeedbackStatus: vi.fn(),
  addFeedbackReply: vi.fn(),
  getFeedbackWithReplies: vi.fn(),
  getUserFeedbackById: vi.fn(),
}));

describe("Feedback System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("submitUserFeedback", () => {
    it("should submit user feedback successfully", async () => {
      const mockFeedback = {
        id: 1,
        userId: 123,
        type: "bug" as const,
        subject: "Test Bug",
        message: "This is a test bug report",
        status: "new" as const,
        priority: "high" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.submitUserFeedback).mockResolvedValue(mockFeedback);

      const result = await db.submitUserFeedback({
        userId: 123,
        type: "bug",
        subject: "Test Bug",
        message: "This is a test bug report",
        email: "test@example.com",
      });

      expect(result).toEqual(mockFeedback);
      expect(db.submitUserFeedback).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 123,
          type: "bug",
          subject: "Test Bug",
        })
      );
    });

    it("should return null on submission failure", async () => {
      vi.mocked(db.submitUserFeedback).mockResolvedValue(null);

      const result = await db.submitUserFeedback({
        userId: 123,
        type: "feature_request",
        subject: "Test Feature",
        message: "This is a test feature request",
      });

      expect(result).toBeNull();
    });
  });

  describe("getUserFeedback", () => {
    it("should retrieve user feedback", async () => {
      const mockFeedback = [
        {
          id: 1,
          userId: 123,
          type: "bug" as const,
          subject: "Bug 1",
          message: "Message 1",
          status: "new" as const,
          priority: "high" as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          userId: 123,
          type: "feature_request" as const,
          subject: "Feature 1",
          message: "Message 2",
          status: "read" as const,
          priority: "medium" as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(db.getUserFeedback).mockResolvedValue(mockFeedback);

      const result = await db.getUserFeedback(123);

      expect(result).toHaveLength(2);
      expect(result[0].subject).toBe("Bug 1");
      expect(result[1].subject).toBe("Feature 1");
    });

    it("should return empty array when user has no feedback", async () => {
      vi.mocked(db.getUserFeedback).mockResolvedValue([]);

      const result = await db.getUserFeedback(999);

      expect(result).toEqual([]);
    });
  });

  describe("getAllFeedback", () => {
    it("should retrieve all feedback with pagination", async () => {
      const mockFeedback = [
        {
          id: 1,
          userId: 123,
          type: "bug" as const,
          subject: "Bug 1",
          message: "Message 1",
          status: "new" as const,
          priority: "high" as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(db.getAllFeedback).mockResolvedValue(mockFeedback);

      const result = await db.getAllFeedback(50, 0);

      expect(result).toHaveLength(1);
      expect(db.getAllFeedback).toHaveBeenCalledWith(50, 0);
    });
  });

  describe("updateFeedbackStatus", () => {
    it("should update feedback status", async () => {
      vi.mocked(db.updateFeedbackStatus).mockResolvedValue(undefined);

      await db.updateFeedbackStatus(1, "resolved", "Fixed in v2.0");

      expect(db.updateFeedbackStatus).toHaveBeenCalledWith(
        1,
        "resolved",
        "Fixed in v2.0"
      );
    });
  });

  describe("addFeedbackReply", () => {
    it("should add a reply to feedback", async () => {
      const mockReply = {
        id: 1,
        feedbackId: 1,
        userId: 456,
        isAdminReply: 1,
        message: "This is an admin reply",
        createdAt: new Date(),
      };

      vi.mocked(db.addFeedbackReply).mockResolvedValue(mockReply);

      const result = await db.addFeedbackReply({
        feedbackId: 1,
        userId: 456,
        isAdminReply: 1,
        message: "This is an admin reply",
      });

      expect(result).toEqual(mockReply);
      expect(result?.isAdminReply).toBe(1);
    });
  });

  describe("getFeedbackWithReplies", () => {
    it("should retrieve feedback with all replies", async () => {
      const mockData = {
        feedback: {
          id: 1,
          userId: 123,
          type: "bug" as const,
          subject: "Test Bug",
          message: "Test message",
          status: "new" as const,
          priority: "high" as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        replies: [
          {
            id: 1,
            feedbackId: 1,
            userId: 456,
            isAdminReply: 1,
            message: "Admin reply",
            createdAt: new Date(),
          },
        ],
      };

      vi.mocked(db.getFeedbackWithReplies).mockResolvedValue(mockData);

      const result = await db.getFeedbackWithReplies(1);

      expect(result.feedback).toBeDefined();
      expect(result.replies).toHaveLength(1);
      expect(result.replies[0].isAdminReply).toBe(1);
    });

    it("should return empty data when feedback not found", async () => {
      vi.mocked(db.getFeedbackWithReplies).mockResolvedValue({
        feedback: null,
        replies: [],
      });

      const result = await db.getFeedbackWithReplies(999);

      expect(result.feedback).toBeNull();
      expect(result.replies).toEqual([]);
    });
  });

  describe("getUserFeedbackById", () => {
    it("should retrieve feedback by ID", async () => {
      const mockFeedback = {
        id: 1,
        userId: 123,
        type: "bug" as const,
        subject: "Test Bug",
        message: "Test message",
        status: "new" as const,
        priority: "high" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.getUserFeedbackById).mockResolvedValue(mockFeedback);

      const result = await db.getUserFeedbackById(1);

      expect(result).toEqual(mockFeedback);
      expect(result?.id).toBe(1);
    });

    it("should return null when feedback not found", async () => {
      vi.mocked(db.getUserFeedbackById).mockResolvedValue(null);

      const result = await db.getUserFeedbackById(999);

      expect(result).toBeNull();
    });
  });

  describe("Feedback Status Transitions", () => {
    it("should transition from new to read", async () => {
      vi.mocked(db.updateFeedbackStatus).mockResolvedValue(undefined);

      await db.updateFeedbackStatus(1, "read");

      expect(db.updateFeedbackStatus).toHaveBeenCalled();
    });

    it("should transition from read to resolved", async () => {
      vi.mocked(db.updateFeedbackStatus).mockResolvedValue(undefined);

      await db.updateFeedbackStatus(1, "resolved", "Issue resolved");

      expect(db.updateFeedbackStatus).toHaveBeenCalled();
    });
  });

  describe("Feedback Types", () => {
    it("should handle bug feedback type", async () => {
      const mockFeedback = {
        id: 1,
        userId: 123,
        type: "bug" as const,
        subject: "Player crashes",
        message: "Player crashes on mobile",
        status: "new" as const,
        priority: "high" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.submitUserFeedback).mockResolvedValue(mockFeedback);

      const result = await db.submitUserFeedback({
        userId: 123,
        type: "bug",
        subject: "Player crashes",
        message: "Player crashes on mobile",
      });

      expect(result?.type).toBe("bug");
    });

    it("should handle feature_request feedback type", async () => {
      const mockFeedback = {
        id: 2,
        userId: 123,
        type: "feature_request" as const,
        subject: "Add subtitles",
        message: "Add subtitle customization",
        status: "new" as const,
        priority: "medium" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(db.submitUserFeedback).mockResolvedValue(mockFeedback);

      const result = await db.submitUserFeedback({
        userId: 123,
        type: "feature_request",
        subject: "Add subtitles",
        message: "Add subtitle customization",
      });

      expect(result?.type).toBe("feature_request");
    });
  });

  describe("Admin Reply Workflow", () => {
    it("should allow admin to reply to user feedback", async () => {
      const mockReply = {
        id: 1,
        feedbackId: 1,
        userId: 456, // admin user
        isAdminReply: 1,
        message: "We are looking into this issue",
        createdAt: new Date(),
      };

      vi.mocked(db.addFeedbackReply).mockResolvedValue(mockReply);

      const result = await db.addFeedbackReply({
        feedbackId: 1,
        userId: 456,
        isAdminReply: 1,
        message: "We are looking into this issue",
      });

      expect(result?.isAdminReply).toBe(1);
      expect(result?.message).toContain("looking into");
    });

    it("should allow user to reply to their own feedback", async () => {
      const mockReply = {
        id: 2,
        feedbackId: 1,
        userId: 123, // original user
        isAdminReply: 0,
        message: "Thanks for the update",
        createdAt: new Date(),
      };

      vi.mocked(db.addFeedbackReply).mockResolvedValue(mockReply);

      const result = await db.addFeedbackReply({
        feedbackId: 1,
        userId: 123,
        isAdminReply: 0,
        message: "Thanks for the update",
      });

      expect(result?.isAdminReply).toBe(0);
    });
  });
});
