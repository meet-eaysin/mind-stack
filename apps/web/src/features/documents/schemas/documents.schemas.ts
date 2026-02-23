import { z } from "zod";
import {
  SourceTypeSchema,
  IngestionStatusSchema,
  ChunkSchema,
  LearningStatusSchema,
  DocumentTypeSchema,
  AnnotationTypeSchema,
} from "@/schemas/api.schemas";

const MetadataValueSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const MetadataSchema = z.record(z.string(), MetadataValueSchema);

export const DocumentListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  sourceType: SourceTypeSchema,
  sourceUrl: z.string().nullable(),
  status: IngestionStatusSchema,
  learningStatus: LearningStatusSchema.default("UPCOMING"),
  type: DocumentTypeSchema.default("OTHER"),
  author: z.string().nullable().optional(),
  publisher: z.string().nullable().optional(),
  publishedAt: z.string().nullable().optional(),
  language: z.string().optional(),
  addedByUserAt: z.string().optional(),
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

export const NoteResponseSchema = z.object({
  id: z.string(),
  content: z.string(),
  type: AnnotationTypeSchema,
  chunkId: z.string().nullable(),
  selectedText: z.string().nullable(),
  metadata: MetadataSchema.nullable(),
  createdAt: z.string(),
});

const DocumentDetailSchema = z.object({
  id: z.string(),
  title: z.string(),
  sourceType: SourceTypeSchema,
  sourceUrl: z.string().nullable(),
  rawContent: z.string(),
  chunks: z.array(ChunkSchema),
  tags: z.array(z.string()),
  notes: z.array(NoteResponseSchema),
  importanceScore: z.number().nullable(),
  status: IngestionStatusSchema,
  learningStatus: LearningStatusSchema.default("UPCOMING"),
  type: DocumentTypeSchema.default("OTHER"),
  author: z.string().nullable().optional(),
  publisher: z.string().nullable().optional(),
  publishedAt: z.string().nullable().optional(),
  language: z.string().optional(),
  addedByUserAt: z.string().optional(),
  createdAt: z.string(),
});

export const DocumentDetailResponseSchema = z
  .union([
    z.object({ document: DocumentDetailSchema }),
    DocumentDetailSchema,
  ])
  .transform((value) => {
    if ("document" in value) {
      return value;
    }
    return { document: value };
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
  metadata: MetadataSchema.optional(),
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

export const RelatedSuggestionSchema = z.object({
  chunkId: z.string(),
  documentId: z.string(),
  content: z.string(),
  documentTitle: z.string(),
  author: z.string().optional().nullable(),
  publishedAt: z.string().optional().nullable(),
  sourceUrl: z.string().optional().nullable(),
  score: z.number(),
  tags: z.array(z.string()),
  hasNote: z.boolean(),
});

export const RelatedSuggestionsResponseSchema = z.array(RelatedSuggestionSchema);
