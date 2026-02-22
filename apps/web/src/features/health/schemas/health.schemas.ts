import { z } from "zod";

export const MissingEmbeddingsResponseSchema = z.object({
  chunksWithoutEmbeddings: z.array(
    z.object({
      id: z.string(),
      documentId: z.string(),
    }),
  ),
});

export const OrphansResponseSchema = z.object({
  orphanChunks: z.array(
    z.object({
      id: z.string(),
      documentId: z.string(),
    }),
  ),
  orphanConcepts: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
    }),
  ),
});

export const FailedDocumentsResponseSchema = z.object({
  failedDocuments: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      createdAt: z.string(),
    }),
  ),
});

export const QueueMetricsResponseSchema = z.object({
  waiting: z.number(),
  active: z.number(),
  completed: z.number(),
  failed: z.number(),
});
