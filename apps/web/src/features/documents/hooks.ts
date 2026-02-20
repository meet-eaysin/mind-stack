import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { documentsApi } from "./api";
import { QUERY_KEYS } from "@/api/query-keys";
import type { DocumentListResponse, DocumentDetailResponse } from "@/types/api";
import type { ApiError } from "@/api/client";

export function useDocuments(page: number, pageSize: number, search?: string) {
  return useQuery<DocumentListResponse, ApiError>({
    queryKey: QUERY_KEYS.knowledge.list(page, pageSize, search),
    queryFn: () => documentsApi.list(page, pageSize, search),
    placeholderData: keepPreviousData,
  });
}

export function useDocument(id: string) {
  return useQuery<DocumentDetailResponse, ApiError>({
    queryKey: QUERY_KEYS.knowledge.detail(id),
    queryFn: () => documentsApi.get(id),
    enabled: !!id,
  });
}

export function useAddTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chunkId, tagName }: { chunkId: string; tagName: string }) =>
      documentsApi.addTag(chunkId, tagName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge", "detail"] });
    },
  });
}

export function useRemoveTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chunkId, tagName }: { chunkId: string; tagName: string }) =>
      documentsApi.removeTag(chunkId, tagName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge", "detail"] });
    },
  });
}

export function useAddNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chunkId, content }: { chunkId: string; content: string }) =>
      documentsApi.addNote(chunkId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge", "detail"] });
    },
  });
}

export function useUpdateImportance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chunkId, score }: { chunkId: string; score: number }) =>
      documentsApi.updateImportance(chunkId, score),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge", "detail"] });
    },
  });
}
