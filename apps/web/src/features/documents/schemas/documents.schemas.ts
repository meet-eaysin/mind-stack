import { z } from "zod";
import {
  SourceTypeSchema,
  IngestionStatusSchema,
  ChunkSchema,
} from "@/schemas/api.schemas";

export const DocumentListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  sourceType: SourceTypeSchema,
  sourceUrl: z.string().nullable(),
  status: IngestionStatusSchema,
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
    status: IngestionStatusSchema,
    rawContent: z.string(),
    chunks: z.array(ChunkSchema),
    tags: z.array(z.string()),
    note: z.string().nullable(),
    importanceScore: z.number().nullable(),
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
