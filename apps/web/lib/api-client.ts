import type {
  IngestionResponse,
  DocumentListResponse,
  DocumentDetailResponse,
  SearchResponse,
  AskQuestionResponse,
  DailyReviewResponse,
  GraphResponse,
  ExportMarkdownResponse,
  ExportNotionResponse,
  IngestUrlRequest,
  IngestTextRequest,
  IngestPdfRequest,
  IngestYoutubeRequest,
  SemanticSearchRequest,
  FilteredSearchRequest,
  AskQuestionRequest,
  SubmitReviewFeedbackRequest,
  AddTagRequest,
  AddNoteRequest,
  UpdateImportanceRequest,
  ExportMarkdownRequest,
  ExportNotionRequest,
  ConceptNeighborhoodRequest,
} from "@repo/shared-types";

const API_BASE =
  process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error ${response.status}: ${text}`);
  }

  return response.json() as Promise<T>;
}

function post<TReq, TRes>(path: string, body: TReq): Promise<TRes> {
  return request<TRes>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

function get<T>(path: string): Promise<T> {
  return request<T>(path);
}

// ── Ingestion ──

export function ingestUrl(data: IngestUrlRequest): Promise<IngestionResponse> {
  return post("/ingest/url", data);
}

export function ingestText(
  data: IngestTextRequest,
): Promise<IngestionResponse> {
  return post("/ingest/text", data);
}

export function ingestPdf(data: IngestPdfRequest): Promise<IngestionResponse> {
  return post("/ingest/pdf", data);
}

export function ingestYoutube(
  data: IngestYoutubeRequest,
): Promise<IngestionResponse> {
  return post("/ingest/youtube", data);
}

export function retryIngestion(documentId: string): Promise<IngestionResponse> {
  return post(`/ingest/retry/${documentId}`, {});
}

// ── Knowledge ──

export function listDocuments(
  page: number = 1,
  pageSize: number = 20,
): Promise<DocumentListResponse> {
  return get(`/knowledge/documents?page=${page}&pageSize=${pageSize}`);
}

export function getDocument(id: string): Promise<DocumentDetailResponse> {
  return get(`/knowledge/documents/${id}`);
}

export function addTag(data: AddTagRequest): Promise<{ success: boolean }> {
  return post("/knowledge/tags", data);
}

export function removeTag(data: AddTagRequest): Promise<{ success: boolean }> {
  return request("/knowledge/tags", {
    method: "DELETE",
    body: JSON.stringify(data),
  });
}

export function addNote(data: AddNoteRequest): Promise<{ noteId: string }> {
  return post("/knowledge/notes", data);
}

export function updateNote(
  noteId: string,
  content: string,
): Promise<{ success: boolean }> {
  return request(`/knowledge/notes/${noteId}`, {
    method: "PUT",
    body: JSON.stringify({ content }),
  });
}

export function updateImportance(
  data: UpdateImportanceRequest,
): Promise<{ success: boolean }> {
  return post("/knowledge/importance", data);
}

// ── Query ──

export function semanticSearch(
  data: SemanticSearchRequest,
): Promise<SearchResponse> {
  return post("/query/search", data);
}

export function filteredSearch(
  data: FilteredSearchRequest,
): Promise<SearchResponse> {
  return post("/query/search/filtered", data);
}

export function askQuestion(
  data: AskQuestionRequest,
): Promise<AskQuestionResponse> {
  return post("/query/ask", data);
}

export function retrieveChunks(
  data: SemanticSearchRequest,
): Promise<SearchResponse> {
  return post("/query/retrieve", data);
}

// ── Review ──

export function getDailyReview(): Promise<DailyReviewResponse> {
  return get("/review/daily");
}

export function submitReviewFeedback(
  data: SubmitReviewFeedbackRequest,
): Promise<{ success: boolean }> {
  return post("/review/feedback", data);
}

// ── Graph ──

export function getGraph(): Promise<GraphResponse> {
  return get("/graph");
}

export function getConceptNeighborhood(
  data: ConceptNeighborhoodRequest,
): Promise<GraphResponse> {
  return post("/graph/neighborhood", data);
}

// ── Export ──

export function exportMarkdown(
  data: ExportMarkdownRequest,
): Promise<ExportMarkdownResponse> {
  return post("/export/markdown", data);
}

export function exportNotion(
  data: ExportNotionRequest,
): Promise<ExportNotionResponse> {
  return post("/export/notion", data);
}
