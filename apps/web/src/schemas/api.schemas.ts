import { z } from "zod";

// ── Shared Enums ──

export const IngestionStatusSchema = z.enum([
  "INGESTED",
  "CHUNKING",
  "EMBEDDING",
  "GRAPH_BUILDING",
  "READY",
  "FAILED",
]);

export const SourceTypeSchema = z.enum(["URL", "TEXT", "PDF", "YOUTUBE"]);

export const RelationTypeSchema = z.enum([
  "RELATES_TO",
  "IS_PART_OF",
  "DEPENDS_ON",
  "SIMILAR_TO",
  "LEADS_TO",
]);

// ── Shared Models ──

export const ChunkSchema = z.object({
  id: z.string(),
  content: z.string(),
  startOffset: z.number(),
  endOffset: z.number(),
  createdAt: z.string(),
});

export const ChunkReferenceSchema = z.object({
  chunkId: z.string(),
  content: z.string(),
  documentTitle: z.string(),
  score: z.number(),
  tags: z.array(z.string()),
  hasNote: z.boolean(),
});

export const SuccessResponseSchema = z.object({
  success: z.boolean(),
});

export const NotionBlockSchema = z.object({
  type: z.string(),
  content: z.string(),
  metadata: z.record(z.string(), z.string()),
});
