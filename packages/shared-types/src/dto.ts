import type { SourceType, IngestionStatus, RelationType } from "./enums.js";

// ── Ingestion DTOs ──

export interface IngestUrlRequest {
  url: string;
  title?: string | undefined;
}

export interface IngestTextRequest {
  title: string;
  content: string;
}

export interface IngestPdfRequest {
  title: string;
  fileBase64: string;
}

export interface IngestYoutubeRequest {
  url: string;
  title?: string | undefined;
}

export interface IngestionResponse {
  documentId: string;
  status: IngestionStatus;
  message: string;
}

// ── Knowledge DTOs ──

export interface DocumentListItem {
  id: string;
  title: string;
  sourceType: SourceType;
  sourceUrl: string | null;
  chunkCount: number;
  createdAt: string;
}

export interface DocumentListResponse {
  documents: DocumentListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ChunkResponse {
  id: string;
  content: string;
  startOffset: number;
  endOffset: number;
  tags: string[];
  note: string | null;
  importanceScore: number | null;
  createdAt: string;
}

export interface DocumentDetailResponse {
  id: string;
  title: string;
  sourceType: SourceType;
  sourceUrl: string | null;
  rawContent: string;
  chunks: ChunkResponse[];
  createdAt: string;
}

export interface AddTagRequest {
  chunkId: string;
  tagName: string;
}

export interface RemoveTagRequest {
  chunkId: string;
  tagName: string;
}

export interface AddNoteRequest {
  chunkId: string;
  content: string;
}

export interface UpdateNoteRequest {
  noteId: string;
  content: string;
}

export interface UpdateImportanceRequest {
  chunkId: string;
  score: number;
}

// ── Query DTOs ──

export interface SemanticSearchRequest {
  query: string;
  topK?: number | undefined;
}

export interface FilteredSearchRequest {
  query: string;
  tags?: string[] | undefined;
  fromDate?: string | undefined;
  toDate?: string | undefined;
  topK?: number | undefined;
}

export interface AskQuestionRequest {
  question: string;
  tags?: string[] | undefined;
  topK?: number | undefined;
}

export interface ChunkReference {
  chunkId: string;
  content: string;
  documentTitle: string;
  score: number;
  tags: string[];
}

export interface SearchResponse {
  chunks: ChunkReference[];
}

export interface AskQuestionResponse {
  answer: string;
  citations: ChunkReference[];
}

// ── Review DTOs ──

export interface ReviewItem {
  chunkId: string;
  content: string;
  documentTitle: string;
  summary: string;
  reason: string;
  lastReviewedAt: string | null;
}

export interface DailyReviewResponse {
  items: ReviewItem[];
  date: string;
}

export interface SubmitReviewFeedbackRequest {
  chunkId: string;
  score: number;
}

// ── Graph DTOs ──

export interface ConceptNode {
  id: string;
  label: string;
  chunkCount: number;
}

export interface ConceptEdge {
  fromId: string;
  toId: string;
  relationType: RelationType;
}

export interface GraphResponse {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
}

export interface ConceptNeighborhoodRequest {
  conceptId: string;
  depth?: number | undefined;
}

// ── Export DTOs ──

export interface ExportMarkdownRequest {
  chunkIds: string[];
}

export interface ExportMarkdownResponse {
  markdown: string;
}

export interface ExportNotionRequest {
  chunkIds: string[];
}

export interface ExportNotionResponse {
  payload: NotionBlock[];
}

export interface NotionBlock {
  type: string;
  content: string;
  metadata: Record<string, string>;
}

// ── Pagination ──

export interface PaginationQuery {
  page?: number | undefined;
  pageSize?: number | undefined;
}
