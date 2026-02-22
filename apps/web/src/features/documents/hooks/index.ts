import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { documentsApi } from "../api";
import { QUERY_KEYS } from "@/constants/query-keys";
import type { DocumentListResponse, DocumentDetailResponse } from "../types";
import type { ApiError } from "@/lib/api-client";

export function useDocuments(page: number, pageSize: number, search?: string) {
  return useQuery<DocumentListResponse, ApiError>({
    queryKey: QUERY_KEYS.KNOWLEDGE.LIST(page, pageSize, search),
    queryFn: () => documentsApi.list(page, pageSize, search),
    placeholderData: keepPreviousData,
  });
}

export function useDocument(id: string) {
  return useQuery<DocumentDetailResponse, ApiError>({
    queryKey: QUERY_KEYS.KNOWLEDGE.DETAIL(id),
    queryFn: () => documentsApi.get(id),
    enabled: !!id,
  });
}

export function useAddTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      documentId,
      tagName,
    }: {
      documentId: string;
      tagName: string;
    }) => documentsApi.addTag(documentId, tagName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge", "detail"] });
    },
  });
}

export function useRemoveTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      documentId,
      tagName,
    }: {
      documentId: string;
      tagName: string;
    }) => documentsApi.removeTag(documentId, tagName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge", "detail"] });
    },
  });
}

export function useAddNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      documentId,
      content,
      chunkId,
      selectedText,
      metadata,
    }: {
      documentId: string;
      content: string;
      chunkId?: string;
      selectedText?: string;
      metadata?: Record<string, unknown>;
    }) =>
      documentsApi.addNote(
        documentId,
        content,
        chunkId,
        selectedText,
        metadata,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge", "detail"] });
    },
  });
}

export function useUpdateImportance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      documentId,
      score,
    }: {
      documentId: string;
      score: number;
    }) => documentsApi.updateImportance(documentId, score),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge", "detail"] });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ noteId, content }: { noteId: string; content: string }) =>
      documentsApi.updateNote(noteId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge", "detail"] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge"] });
    },
  });
}

export function useUpdateDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...updates
    }: {
      id: string;
      title?: string;
      sourceUrl?: string;
      learningStatus?: string;
      type?: string;
      author?: string;
      publisher?: string;
      publishedAt?: string;
      language?: string;
    }) => documentsApi.update(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.KNOWLEDGE.DETAIL(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: ["knowledge", "list"],
      });
    },
  });
}
