import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/constents/endpoints";
import * as schemas from "@/schemas/api.schemas";

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

  addTag: (chunkId: string, tagName: string) =>
    apiClient.post(
      ENDPOINTS.KNOWLEDGE.TAGS,
      { chunkId, tagName },
      schemas.SuccessResponseSchema,
    ),

  removeTag: (chunkId: string, tagName: string) =>
    apiClient.delete(
      ENDPOINTS.KNOWLEDGE.TAGS,
      { chunkId, tagName },
      schemas.SuccessResponseSchema,
    ),

  addNote: (chunkId: string, content: string) =>
    apiClient.post(
      ENDPOINTS.KNOWLEDGE.NOTES,
      { chunkId, content },
      schemas.NoteCreatedResponseSchema,
    ),

  updateImportance: (chunkId: string, score: number) =>
    apiClient.post(
      ENDPOINTS.KNOWLEDGE.IMPORTANCE,
      { chunkId, score },
      schemas.SuccessResponseSchema,
    ),
};
