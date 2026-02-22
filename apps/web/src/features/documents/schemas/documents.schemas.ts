import { z } from "zod";
import {
  SourceTypeSchema,
  IngestionStatusSchema,
  ChunkSchema,
  LearningStatusSchema,
  DocumentTypeSchema,
  AnnotationTypeSchema,
} from "@/schemas/api.schemas";

export const DocumentListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  sourceType: SourceTypeSchema,
  sourceUrl: z.string().nullable(),
  status: IngestionStatusSchema,
  learningStatus: LearningStatusSchema,
  type: DocumentTypeSchema,
  chunkCount: z.number(),
  createdAt: z.string(),
});

export const DocumentListRequestSchema = z.object({
  page: z.number().optional(),
  pageSize: z.number().optional(),
});

export const DocumentListResponseSchema = z.object({
  documents: z.array(DocumentListItemSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export const DocumentDetailResponseSchema = z.object({
  document: z.object({
    id: z.string(),
    title: z.string(),
    sourceType: SourceTypeSchema,
    sourceUrl: z.string().nullable(),
    rawContent: z.string(),
    chunks: z.array(ChunkSchema),
    tags: z.array(z.string()),
    notes: z.array(
      z.object({
        id: z.string(),
        content: z.string(),
        type: AnnotationTypeSchema,
        chunkId: z.string().nullable(),
        selectedText: z.string().nullable(),
        metadata: z.record(z.string(), z.any()).nullable(),
        createdAt: z.string(),
      }),
    ),
    importanceScore: z.number().nullable(),
    status: IngestionStatusSchema,
    learningStatus: LearningStatusSchema,
    type: DocumentTypeSchema,
    author: z.string().nullable(),
    publisher: z.string().nullable(),
    publishedAt: z.string().nullable(),
    language: z.string(),
    addedByUserAt: z.string(),
    createdAt: z.string(),
  }),
});

export const DocumentStatusResponseSchema = z.object({
  status: IngestionStatusSchema,
});

export const AddTagRequestSchema = z.object({
  documentId: z.string(),
  tagName: z.string().min(1),
});

export const RemoveTagRequestSchema = z.object({
  documentId: z.string(),
  tagName: z.string().min(1),
});

export const AddNoteRequestSchema = z.object({
  documentId: z.string(),
  content: z.string(),
  type: AnnotationTypeSchema.optional(),
  chunkId: z.string().optional(),
  selectedText: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const UpdateNoteRequestSchema = z.object({
  content: z.string(),
});

export const UpdateImportanceRequestSchema = z.object({
  documentId: z.string(),
  score: z.number().min(1).max(5),
});

export const NoteCreatedResponseSchema = z.object({
  noteId: z.string(),
});
