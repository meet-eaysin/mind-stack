import { useMutation, useQuery } from "@tanstack/react-query";
import { ingestionApi } from "../api";
import { useState, useEffect } from "react";
import { QUERY_KEYS } from "@/constents/query-keys";
import type {
  IngestionResponse,
  IngestUrlRequest,
  IngestTextRequest,
  IngestPdfRequest,
  IngestYoutubeRequest,
  DocumentStatusResponse,
} from "../types";
import type { IngestionStatus } from "@/types";
import type { ApiError } from "@/lib/api-client";

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
    queryKey: QUERY_KEYS.KNOWLEDGE.STATUS(documentId || ""),
    queryFn: () => ingestionApi.getStatus(documentId!),
    enabled: !!documentId && status !== "READY" && status !== "FAILED",
    refetchInterval: (query: any) => {
      // Re-added any temporarily to focus on MSW, but I will try to fix properly in a moment or just skip if it's too much noise.
      const data = query.state.data as DocumentStatusResponse | undefined;
      if (data?.status === "READY" || data?.status === "FAILED") {
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

  useEffect(() => {
    if (documentId === null) {
      setStatus(null);
    }
  }, [documentId]);

  return status;
}
