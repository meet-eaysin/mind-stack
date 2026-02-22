import type {
  SourceType,
  IngestionStatus,
  RelationType,
  LearningStatus,
  AnnotationType,
  DocumentType,
} from "./enums";

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
  jobId?: string | undefined;
  status: IngestionStatus;
  message: string;
};

export type IngestionJobStatusResponse = {
  jobId: string;
  state: "waiting" | "active" | "completed" | "failed" | "delayed" | "unknown";
  progress: number;
  reason?: string | undefined;
};

// ── Knowledge DTOs ──

export type DocumentListItem = {
  id: string;
  title: string;
  sourceType: SourceType;
  sourceUrl: string | null;
  status: IngestionStatus;
  learningStatus: LearningStatus;
  type: DocumentType;
  author: string | null;
  publisher: string | null;
  publishedAt: string | null;
  language: string;
  chunkCount: number;
  addedByUserAt: string;
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
  type: AnnotationType;
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
  learningStatus: LearningStatus;
  type: DocumentType;
  author: string | null;
  publisher: string | null;
  publishedAt: string | null;
  language: string;
  rawContent: string;
  chunks: ChunkResponse[];
  tags: string[];
  notes: NoteResponse[];
  importanceScore: number | null;
  addedByUserAt: string;
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
  type?: AnnotationType | undefined;
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

// ── Admin DTOs ──

export type QueueMetricsResponse = {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
};

export type CleanupResponse = {
  deletedCount: number;
};

export type MissingEmbeddingsResponse = {
  chunksWithoutEmbeddings: Array<{ id: string; documentId: string }>;
};

export type OrphansResponse = {
  orphanChunks: Array<{ id: string; documentId: string }>;
  orphanConcepts: Array<{ id: string; label: string }>;
};

export type FailedDocumentsResponse = {
  failedDocuments: Array<{ id: string; title: string; createdAt: string }>;
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
  documentId: string;
  content: string;
  documentTitle: string;
  author?: string | undefined;
  publishedAt?: string | undefined;
  sourceUrl?: string | null;
  score: number;
  tags: string[];
  hasNote: boolean;
};

export type DocumentSearchResult = {
  documentId: string;
  title: string;
  author?: string | undefined;
  publishedAt?: string | undefined;
  sourceUrl?: string | null;
  score: number;
  tags: string[];
  hasNote: boolean;
  matchingChunks: {
    chunkId: string;
    content: string;
    score: number;
  }[];
};

export type SearchResponse = {
  documents: DocumentSearchResult[];
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

// ── Analysis DTOs ──

export type TopicMasteryData = {
  coverage: {
    totalConcepts: number;
    reviewedConcepts: number;
    percent: number;
  };
  levels: {
    mastered: number;
    consolidating: number;
    learning: number;
    unseen: number;
  };
  weakAreas: {
    id: string;
    label: string;
    easeFactor: number;
    interval: number;
  }[];
  learningStatusDistribution: Record<string, number>;
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

// ── Collection DTOs ──

export type CollectionListItem = {
  id: string;
  name: string;
  description: string | null;
  itemCount: number;
  progress: number; // calculated from items ready/completed
  createdAt: string;
  updatedAt: string;
};

export type CollectionItemResponse = {
  id: string;
  documentId: string;
  documentTitle: string;
  learningStatus: string;
  order: number;
  prerequisiteId: string | null;
};

export type CollectionDetailResponse = {
  id: string;
  name: string;
  description: string | null;
  goal: string | null;
  items: CollectionItemResponse[];
  createdAt: string;
  updatedAt: string;
};

export type CreateCollectionRequest = {
  name: string;
  description?: string;
  goal?: string;
};

export type UpdateCollectionRequest = {
  name?: string;
  description?: string;
  goal?: string;
};

export type AddDocumentToCollectionRequest = {
  documentId: string;
  order?: number;
  prerequisiteId?: string;
};

export type ReorderCollectionItemsRequest = {
  itemIds: string[]; // Order of IDs
};

// ── Learning Goal DTOs ──

export type LearningGoalListItem = {
  id: string;
  name: string;
  deadline: string | null;
  progress: number;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
};

export type LearningGoalItemResponse = {
  id: string;
  collectionId: string | null;
  collectionName: string | null;
  documentId: string | null;
  documentTitle: string | null;
};

export type LearningGoalDetailResponse = {
  id: string;
  name: string;
  deadline: string | null;
  progress: number;
  items: LearningGoalItemResponse[];
  createdAt: string;
  updatedAt: string;
};

export type CreateLearningGoalRequest = {
  name: string;
  deadline?: string;
};

export type UpdateLearningGoalRequest = {
  name?: string;
  deadline?: string;
};

export type AddItemToGoalRequest = {
  collectionId?: string;
  documentId?: string;
};
