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
  tags: z.array(z.string()),
  note: z.string().nullable(),
  importanceScore: z.number().nullable(),
  createdAt: z.string(),
});

export const ChunkReferenceSchema = z.object({
  chunkId: z.string(),
  content: z.string(),
  documentTitle: z.string(),
  score: z.number(),
  tags: z.array(z.string()),
});

export const NotionBlockSchema = z.object({
  type: z.string(),
  content: z.string(),
  metadata: z.record(z.string(), z.string()),
});

// ── Ingestion Schemas ──

export const IngestUrlRequestSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
});

export const IngestTextRequestSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
});

export const IngestPdfRequestSchema = z.object({
  title: z.string().min(1),
  fileBase64: z.string(),
});

export const IngestYoutubeRequestSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
});

export const IngestionResponseSchema = z.object({
  documentId: z.string(),
  status: IngestionStatusSchema,
  message: z.string(),
});

// ── Knowledge Schemas ──

export const DocumentListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  sourceType: SourceTypeSchema,
  sourceUrl: z.string().nullable(),
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
    createdAt: z.string(),
  }),
});

export const DocumentStatusResponseSchema = z.object({
  status: IngestionStatusSchema,
});

export const AddTagRequestSchema = z.object({
  chunkId: z.string(),
  tagName: z.string().min(1),
});

export const RemoveTagRequestSchema = z.object({
  chunkId: z.string(),
  tagName: z.string().min(1),
});

export const AddNoteRequestSchema = z.object({
  chunkId: z.string(),
  content: z.string(),
});

export const UpdateNoteRequestSchema = z.object({
  noteId: z.string(),
  content: z.string(),
});

export const UpdateImportanceRequestSchema = z.object({
  chunkId: z.string(),
  score: z.number().min(1).max(5),
});

export const SuccessResponseSchema = z.object({
  success: z.boolean(),
});

export const NoteCreatedResponseSchema = z.object({
  noteId: z.string(),
});

// ── Query Schemas ──

export const SemanticSearchRequestSchema = z.object({
  query: z.string(),
  topK: z.number().optional(),
});

export const FilteredSearchRequestSchema = z.object({
  query: z.string(),
  tags: z.array(z.string()).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  topK: z.number().optional(),
});

export const AskQuestionRequestSchema = z.object({
  question: z.string(),
  tags: z.array(z.string()).optional(),
  topK: z.number().optional(),
});

export const SearchResponseSchema = z.object({
  chunks: z.array(ChunkReferenceSchema),
});

export const RetrieveResponseSchema = z.object({
  chunks: z.array(ChunkReferenceSchema),
});

export const AskQuestionResponseSchema = z.object({
  answer: z.string(),
  citations: z.array(ChunkReferenceSchema),
});

export const StreamingAskResponseChunkSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("citations"),
    data: z.array(ChunkReferenceSchema),
  }),
  z.object({ type: z.literal("text"), data: z.string() }),
  z.object({ type: z.literal("done") }),
]);

// ── Review Schemas ──

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

// ── Graph Schemas ──

export const GraphNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  chunkCount: z.number(),
});

export const GraphEdgeSchema = z.object({
  fromId: z.string(),
  toId: z.string(),
  relationType: RelationTypeSchema,
});

export const GraphResponseSchema = z.object({
  nodes: z.array(GraphNodeSchema),
  edges: z.array(GraphEdgeSchema),
});

export const BuildGraphRequestSchema = z.object({
  forceRebuild: z.boolean().optional(),
});

export const BuildGraphResponseSchema = z.object({
  success: z.boolean(),
});

export const NeighborhoodRequestSchema = z.object({
  conceptId: z.string(),
  depth: z.number().optional(),
});

// ── Export Schemas ──

export const ExportRequestSchema = z.object({
  chunkIds: z.array(z.string()),
});

export const ExportMarkdownResponseSchema = z.object({
  markdown: z.string(),
});

export const ExportNotionResponseSchema = z.object({
  payload: z.array(NotionBlockSchema),
});
