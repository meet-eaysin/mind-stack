import { apiClient } from "@/api/client";
import { ENDPOINTS } from "@/api/endpoints";
import * as schemas from "@/schemas/api.schemas";
import * as types from "@/types/api";

export const ingestionApi = {
  url: (data: types.IngestUrlRequest) =>
    apiClient.post(
      ENDPOINTS.ingestion.url,
      data,
      schemas.IngestionResponseSchema,
    ),

  text: (data: types.IngestTextRequest) =>
    apiClient.post(
      ENDPOINTS.ingestion.text,
      data,
      schemas.IngestionResponseSchema,
    ),

  pdf: (data: types.IngestPdfRequest) =>
    apiClient.post(
      ENDPOINTS.ingestion.pdf,
      data,
      schemas.IngestionResponseSchema,
    ),

  youtube: (data: types.IngestYoutubeRequest) =>
    apiClient.post(
      ENDPOINTS.ingestion.youtube,
      data,
      schemas.IngestionResponseSchema,
    ),

  getStatus: (documentId: string) =>
    apiClient.get(
      ENDPOINTS.knowledge.status(documentId),
      schemas.DocumentStatusResponseSchema,
    ),
};
