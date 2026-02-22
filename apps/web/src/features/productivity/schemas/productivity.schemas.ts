import { z } from "zod";

export const TopicMasteryDataSchema = z.object({
  coverage: z.object({
    totalConcepts: z.number(),
    reviewedConcepts: z.number(),
    percent: z.number(),
  }),
  levels: z.object({
    mastered: z.number(),
    consolidating: z.number(),
    learning: z.number(),
    unseen: z.number(),
  }),
  weakAreas: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      easeFactor: z.number(),
      interval: z.number(),
    }),
  ),
  learningStatusDistribution: z.record(z.string(), z.number()),
});

export const LearningGoalListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  deadline: z.string().nullable(),
  progress: z.number(),
  itemCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const LearningGoalItemResponseSchema = z.object({
  id: z.string(),
  collectionId: z.string().nullable(),
  collectionName: z.string().nullable(),
  documentId: z.string().nullable(),
  documentTitle: z.string().nullable(),
});

export const LearningGoalDetailResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  deadline: z.string().nullable(),
  progress: z.number(),
  items: z.array(LearningGoalItemResponseSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const LearningGoalListResponseSchema = z.array(
  LearningGoalListItemSchema,
);
