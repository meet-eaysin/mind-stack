import { z } from "zod";
import * as schemas from "../schemas/api.schemas";

export type IngestionStatus = z.infer<typeof schemas.IngestionStatusSchema>;
export type SourceType = z.infer<typeof schemas.SourceTypeSchema>;
export type RelationType = z.infer<typeof schemas.RelationTypeSchema>;

export type Chunk = z.infer<typeof schemas.ChunkSchema>;
export type ChunkReference = z.infer<typeof schemas.ChunkReferenceSchema>;
export type NotionBlock = z.infer<typeof schemas.NotionBlockSchema>;

// Ingestion Requests
export type IngestUrlRequest = z.infer<typeof schemas.IngestUrlRequestSchema>;
export type IngestTextRequest = z.infer<typeof schemas.IngestTextRequestSchema>;
export type IngestPdfRequest = z.infer<typeof schemas.IngestPdfRequestSchema>;
export type IngestYoutubeRequest = z.infer<
  typeof schemas.IngestYoutubeRequestSchema
>;

// Ingestion Responses
export type IngestionResponse = z.infer<typeof schemas.IngestionResponseSchema>;

// Knowledge Responses
export type DocumentListItem = z.infer<typeof schemas.DocumentListItemSchema>;
export type DocumentListResponse = z.infer<
  typeof schemas.DocumentListResponseSchema
>;
export type DocumentDetailResponse = z.infer<
  typeof schemas.DocumentDetailResponseSchema
>;
export type DocumentStatusResponse = z.infer<
  typeof schemas.DocumentStatusResponseSchema
>;

// Knowledge Requests
export type AddTagRequest = z.infer<typeof schemas.AddTagRequestSchema>;
export type RemoveTagRequest = z.infer<typeof schemas.RemoveTagRequestSchema>;
export type AddNoteRequest = z.infer<typeof schemas.AddNoteRequestSchema>;
export type UpdateNoteRequest = z.infer<typeof schemas.UpdateNoteRequestSchema>;
export type UpdateImportanceRequest = z.infer<
  typeof schemas.UpdateImportanceRequestSchema
>;

// Query Requests
export type SemanticSearchRequest = z.infer<
  typeof schemas.SemanticSearchRequestSchema
>;
export type FilteredSearchRequest = z.infer<
  typeof schemas.FilteredSearchRequestSchema
>;
export type AskQuestionRequest = z.infer<
  typeof schemas.AskQuestionRequestSchema
>;

// Query Responses
export type SearchResponse = z.infer<typeof schemas.SearchResponseSchema>;
export type AskQuestionResponse = z.infer<
  typeof schemas.AskQuestionResponseSchema
>;

// Review Models
export type ReviewItem = z.infer<typeof schemas.ReviewItemSchema>;
export type DailyReviewResponse = z.infer<
  typeof schemas.DailyReviewResponseSchema
>;
export type SubmitFeedbackRequest = z.infer<
  typeof schemas.SubmitFeedbackRequestSchema
>;

// Graph Models
export type GraphNode = z.infer<typeof schemas.GraphNodeSchema>;
export type GraphEdge = z.infer<typeof schemas.GraphEdgeSchema>;
export type GraphResponse = z.infer<typeof schemas.GraphResponseSchema>;
export type BuildGraphRequest = z.infer<typeof schemas.BuildGraphRequestSchema>;
export type NeighborhoodRequest = z.infer<
  typeof schemas.NeighborhoodRequestSchema
>;

// Export Models
export type ExportRequest = z.infer<typeof schemas.ExportRequestSchema>;
export type ExportMarkdownResponse = z.infer<
  typeof schemas.ExportMarkdownResponseSchema
>;
export type ExportNotionResponse = z.infer<
  typeof schemas.ExportNotionResponseSchema
>;

// Shared Responses
export type SuccessResponse = z.infer<typeof schemas.SuccessResponseSchema>;
export type NoteCreatedResponse = z.infer<
  typeof schemas.NoteCreatedResponseSchema
>;
