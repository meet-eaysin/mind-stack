import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/constents/endpoints";
import * as schemas from "@/schemas/api.schemas";
import type {
  IngestUrlRequest,
  IngestTextRequest,
  IngestPdfRequest,
  IngestYoutubeRequest,
} from "@/types";

export const ingestionApi = {
  url: (data: IngestUrlRequest) =>
    apiClient.post(
      ENDPOINTS.INGESTION.URL,
      data,
      schemas.IngestionResponseSchema,
    ),

  text: (data: IngestTextRequest) =>
    apiClient.post(
      ENDPOINTS.INGESTION.TEXT,
      data,
      schemas.IngestionResponseSchema,
    ),

  pdf: (data: IngestPdfRequest) =>
    apiClient.post(
      ENDPOINTS.INGESTION.PDF,
      data,
      schemas.IngestionResponseSchema,
    ),

  youtube: (data: IngestYoutubeRequest) =>
    apiClient.post(
      ENDPOINTS.INGESTION.YOUTUBE,
      data,
      schemas.IngestionResponseSchema,
    ),

  getStatus: (documentId: string) =>
    apiClient.get(
      ENDPOINTS.KNOWLEDGE.STATUS(documentId),
      schemas.DocumentStatusResponseSchema,
    ),
};
