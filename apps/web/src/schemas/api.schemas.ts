import { z } from "zod";
import {
  INGESTION_STATUS,
  SOURCE_TYPE,
  RELATION_TYPE,
  LEARNING_STATUS,
  DOCUMENT_TYPE,
  ANNOTATION_TYPE,
  MODEL_CAPABILITY,
  MODEL_PROVIDER,
} from "@repo/shared-types";

// ── Shared Enums ──

export const IngestionStatusSchema = z.enum(INGESTION_STATUS);

export const SourceTypeSchema = z.enum(SOURCE_TYPE);

export const RelationTypeSchema = z.enum(RELATION_TYPE);

export const LearningStatusSchema = z.enum(LEARNING_STATUS);

export const DocumentTypeSchema = z.enum(DOCUMENT_TYPE);

export const AnnotationTypeSchema = z.enum(ANNOTATION_TYPE);

export const ModelProviderSchema = z.enum(MODEL_PROVIDER);
export const ModelCapabilitySchema = z.enum(MODEL_CAPABILITY);

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
