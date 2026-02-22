import { useQuery } from "@tanstack/react-query";
import { healthApi } from "../api";
import { QUERY_KEYS } from "@/constants/query-keys";
import type { ApiError } from "@/lib/api-client";
import type {
  MissingEmbeddingsResponse,
  OrphansResponse,
  FailedDocumentsResponse,
  QueueMetricsResponse,
} from "../types";

export function useMissingEmbeddings() {
  return useQuery<MissingEmbeddingsResponse, ApiError>({
    queryKey: QUERY_KEYS.HEALTH.MISSING_EMBEDDINGS,
    queryFn: () => healthApi.getMissingEmbeddings(),
  });
}

export function useOrphans() {
  return useQuery<OrphansResponse, ApiError>({
    queryKey: QUERY_KEYS.HEALTH.ORPHANS,
    queryFn: () => healthApi.getOrphans(),
  });
}

export function useFailedDocuments() {
  return useQuery<FailedDocumentsResponse, ApiError>({
    queryKey: QUERY_KEYS.HEALTH.FAILED_DOCUMENTS,
    queryFn: () => healthApi.getFailedDocuments(),
  });
}

export function useQueueMetrics() {
  return useQuery<QueueMetricsResponse, ApiError>({
    queryKey: QUERY_KEYS.HEALTH.QUEUE_METRICS,
    queryFn: () => healthApi.getQueueMetrics(),
  });
}
