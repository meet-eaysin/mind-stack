import { z } from "zod";

// ── Shared Enums ──

export const IngestionStatusSchema = z.enum([
  "INGESTED",
  "INITIALIZING",
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
  "IS_PREREQUISITE_OF",
  "REFERENCES",
  "EXTENDS",
  "CONTRADICTS",
  "FOLLOW_UP_TO",
]);

export const LearningStatusSchema = z.enum([
  "TO_WATCH",
  "TO_READ",
  "UPCOMING",
  "IN_PROGRESS",
  "REVIEW",
  "COMPLETED",
  "PENDING_COMPLETION",
]);

export const DocumentTypeSchema = z.enum([
  "ARTICLE",
  "VIDEO",
  "COURSE_LESSON",
  "BOOK",
  "NOTE",
  "RFC",
  "BLOG",
  "TRANSCRIPT",
  "OTHER",
]);

export const AnnotationTypeSchema = z.enum([
  "HIGHLIGHT",
  "NOTE",
  "QUESTION",
  "INSIGHT",
]);

export const ModelProviderSchema = z.enum(["OLLAMA"]);

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
  documentId: z.string(),
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

export const DocumentSearchResultSchema = z.object({
  documentId: z.string(),
  title: z.string(),
  author: z.string().optional(),
  publishedAt: z.string().optional(),
  sourceUrl: z.string().nullable().optional(),
  score: z.number(),
  tags: z.array(z.string()),
  hasNote: z.boolean(),
});
