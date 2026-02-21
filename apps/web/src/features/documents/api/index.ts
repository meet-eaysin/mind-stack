import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/constents/endpoints";
import * as schemas from "../schemas/documents.schemas";
import { SuccessResponseSchema } from "@/schemas/api.schemas";

export const documentsApi = {
  list: (page: number, pageSize: number, search?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });
    if (search) {
      params.append("search", search);
    }
    return apiClient.get(
      `${ENDPOINTS.KNOWLEDGE.ALL}?${params.toString()}`,
      schemas.DocumentListResponseSchema,
    );
  },

  get: (id: string) =>
    apiClient.get(
      ENDPOINTS.KNOWLEDGE.DETAIL(id),
      schemas.DocumentDetailResponseSchema,
    ),

  addTag: (documentId: string, tagName: string) =>
    apiClient.post(
      ENDPOINTS.KNOWLEDGE.TAGS,
      { documentId, tagName },
      SuccessResponseSchema,
    ),

  removeTag: (documentId: string, tagName: string) =>
    apiClient.delete(
      ENDPOINTS.KNOWLEDGE.TAGS,
      { documentId, tagName },
      SuccessResponseSchema,
    ),

  addNote: (documentId: string, content: string) =>
    apiClient.post(
      ENDPOINTS.KNOWLEDGE.NOTES,
      { documentId, content },
      schemas.NoteCreatedResponseSchema,
    ),

  updateImportance: (documentId: string, score: number) =>
    apiClient.post(
      ENDPOINTS.KNOWLEDGE.IMPORTANCE,
      { documentId, score },
      SuccessResponseSchema,
    ),

  updateNote: (noteId: string, content: string) =>
    apiClient.put(
      ENDPOINTS.KNOWLEDGE.NOTE(noteId),
      { content },
      SuccessResponseSchema,
    ),
};
