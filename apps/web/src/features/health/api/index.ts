import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/constants/endpoints";
import * as schemas from "../schemas/health.schemas";
import type {
  MissingEmbeddingsResponse,
  OrphansResponse,
  FailedDocumentsResponse,
  QueueMetricsResponse,
  ExportCompleteResponse,
} from "../types";

export const healthApi = {
  getMissingEmbeddings: (): Promise<MissingEmbeddingsResponse> =>
    apiClient.get(
      ENDPOINTS.ADMIN.HEALTH.MISSING_EMBEDDINGS,
      schemas.MissingEmbeddingsResponseSchema,
    ),

  getOrphans: (): Promise<OrphansResponse> =>
    apiClient.get(
      ENDPOINTS.ADMIN.HEALTH.ORPHANS,
      schemas.OrphansResponseSchema,
    ),

  getFailedDocuments: (): Promise<FailedDocumentsResponse> =>
    apiClient.get(
      ENDPOINTS.ADMIN.HEALTH.FAILED_DOCUMENTS,
      schemas.FailedDocumentsResponseSchema,
    ),

  getQueueMetrics: (): Promise<QueueMetricsResponse> =>
    apiClient.get(ENDPOINTS.ADMIN.JOBS, schemas.QueueMetricsResponseSchema),

  getFullExport: (): Promise<ExportCompleteResponse> =>
    apiClient.get(ENDPOINTS.EXPORT.FULL, schemas.ExportCompleteResponseSchema),
} as const;
