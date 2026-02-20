import { useMutation, useQuery } from "@tanstack/react-query";
import { ingestionApi } from "./api";
import { useState, useEffect } from "react";
import { QUERY_KEYS } from "@/api/query-keys";
import type {
  IngestionStatus,
  IngestionResponse,
  IngestUrlRequest,
  IngestTextRequest,
  IngestPdfRequest,
  IngestYoutubeRequest,
  DocumentStatusResponse,
} from "@/types/api";
import type { ApiError } from "@/api/client";

export function useIngestUrl() {
  return useMutation<IngestionResponse, ApiError, IngestUrlRequest>({
    mutationFn: ingestionApi.url,
  });
}

export function useIngestText() {
  return useMutation<IngestionResponse, ApiError, IngestTextRequest>({
    mutationFn: ingestionApi.text,
  });
}

export function useIngestPdf() {
  return useMutation<IngestionResponse, ApiError, IngestPdfRequest>({
    mutationFn: ingestionApi.pdf,
  });
}

export function useIngestYoutube() {
  return useMutation<IngestionResponse, ApiError, IngestYoutubeRequest>({
    mutationFn: ingestionApi.youtube,
  });
}

export function useIngestionStatus(documentId: string | null) {
  const [status, setStatus] = useState<IngestionStatus | null>(null);

  const { data } = useQuery<DocumentStatusResponse, ApiError>({
    queryKey: QUERY_KEYS.knowledge.status(documentId || ""),
    queryFn: () => ingestionApi.getStatus(documentId!),
    enabled: !!documentId && status !== "READY" && status !== "FAILED",
    refetchInterval: (query) => {
      const currentStatus = query.state.data?.status;
      if (currentStatus === "READY" || currentStatus === "FAILED") {
        return false;
      }
      return 2000;
    },
  });

  useEffect(() => {
    if (data?.status) {
      setStatus(data.status);
    }
  }, [data?.status]);

  // Reset status when documentId changes (new ingestion)
  useEffect(() => {
    if (documentId === null) {
      setStatus(null);
    }
  }, [documentId]);

  return status;
}
