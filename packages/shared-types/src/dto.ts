import type { SourceType, IngestionStatus, RelationType } from "./enums";

// ── Ingestion DTOs ──

export type IngestUrlRequest = {
  url: string;
  title?: string | undefined;
};

export type IngestTextRequest = {
  title: string;
  content: string;
};

export type IngestPdfRequest = {
  title: string;
  fileBase64: string;
};

export type IngestYoutubeRequest = {
  url: string;
  title?: string | undefined;
};

export type IngestClipRequest = {
  url: string;
  title: string;
  content: string;
};

export type IngestionResponse = {
  documentId: string;
  status: IngestionStatus;
  message: string;
};

// ── Knowledge DTOs ──

export type DocumentListItem = {
  id: string;
  title: string;
  sourceType: SourceType;
  sourceUrl: string | null;
  status: IngestionStatus;
  chunkCount: number;
  createdAt: string;
};

export type DocumentListResponse = {
  documents: DocumentListItem[];
  total: number;
  page: number;
  pageSize: number;
};

export type ChunkResponse = {
  id: string;
  content: string;
  startOffset: number;
  endOffset: number;
  createdAt: string;
};

export type NoteResponse = {
  id: string;
  content: string;
  chunkId: string | null;
  selectedText: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type DocumentDetailResponse = {
  id: string;
  title: string;
  sourceType: SourceType;
  sourceUrl: string | null;
  status: IngestionStatus;
  rawContent: string;
  chunks: ChunkResponse[];
  tags: string[];
  notes: NoteResponse[];
  importanceScore: number | null;
  createdAt: string;
};

export type AddTagRequest = {
  documentId: string;
  tagName: string;
};

export type RemoveTagRequest = {
  documentId: string;
  tagName: string;
};

export type AddNoteRequest = {
  documentId: string;
  content: string;
  chunkId?: string | undefined;
  selectedText?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
};

export type UpdateNoteRequest = {
  noteId: string;
  content: string;
};

export type UpdateImportanceRequest = {
  documentId: string;
  score: number;
};

// ── Query DTOs ──

export type SemanticSearchRequest = {
  query: string;
  topK?: number | undefined;
};

export type FilteredSearchRequest = {
  query: string;
  tags?: string[] | undefined;
  fromDate?: string | undefined;
  toDate?: string | undefined;
  topK?: number | undefined;
};

export type AskQuestionRequest = {
  question: string;
  tags?: string[] | undefined;
  topK?: number | undefined;
};

export type ChunkReference = {
  chunkId: string;
  content: string;
  documentTitle: string;
  score: number;
  tags: string[];
  hasNote: boolean;
};

export type SearchResponse = {
  chunks: ChunkReference[];
};

export type AskQuestionResponse = {
  answer: string;
  citations: ChunkReference[];
};

export type StreamingAskResponseChunk =
  | { type: "citations"; data: ChunkReference[] }
  | { type: "text"; data: string }
  | { type: "done" };

// ── Review DTOs ──

export type ReviewItem = {
  documentId: string;
  content: string;
  documentTitle: string;
  summary: string;
  reason: string;
  lastReviewedAt: string | null;
  tags: string[];
};

export type DailyReviewResponse = {
  items: ReviewItem[];
  date: string;
};

export type SubmitReviewFeedbackRequest = {
  documentId: string;
  score: number;
};

// ── Graph DTOs ──

export type ConceptNode = {
  id: string;
  label: string;
  chunkCount: number;
  associatedChunks?: Array<{
    id: string;
    content: string;
    documentTitle: string;
  }>;
};

export type ConceptEdge = {
  fromId: string;
  toId: string;
  relationType: RelationType;
};

export type GraphResponse = {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
};

export type ConceptNeighborhoodRequest = {
  conceptId: string;
  depth?: number | undefined;
};

// ── Export DTOs ──
export type ExportMarkdownRequest = {
  chunkIds: string[];
};

export type ExportMarkdownResponse = {
  markdown: string;
};

export type ExportNotionRequest = {
  chunkIds: string[];
};

export type ExportNotionResponse = {
  payload: NotionBlock[];
};

export type NotionImportRequest = {
  title: string;
  content: string;
};

export type NotionBlock = {
  type: string;
  content: string;
  metadata: Record<string, string>;
};

// ── Pagination ──

export type PaginationQuery = {
  page?: number | undefined;
  pageSize?: number | undefined;
};
