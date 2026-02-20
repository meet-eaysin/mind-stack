import { z } from "zod";

export const ReviewItemSchema = z.object({
  chunkId: z.string(),
  content: z.string(),
  documentTitle: z.string(),
  summary: z.string(),
  reason: z.string(),
  lastReviewedAt: z.string().nullable(),
});

export const DailyReviewResponseSchema = z.object({
  items: z.array(ReviewItemSchema),
  date: z.string(),
});

export const SubmitFeedbackRequestSchema = z.object({
  chunkId: z.string(),
  score: z.number().min(1).max(5),
});

export const UpdateReviewScoreRequestSchema = z.object({
  chunkId: z.string(),
  score: z.number().min(1).max(5),
});
