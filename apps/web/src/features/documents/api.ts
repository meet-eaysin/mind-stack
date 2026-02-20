import { apiClient } from "@/api/client";
import { ENDPOINTS } from "@/api/endpoints";
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
      `${ENDPOINTS.knowledge.all}?${params.toString()}`,
      schemas.DocumentListResponseSchema,
    );
  },

  get: (id: string) =>
    apiClient.get(
      ENDPOINTS.knowledge.detail(id),
      schemas.DocumentDetailResponseSchema,
    ),

  addTag: (chunkId: string, tagName: string) =>
    apiClient.post(
      ENDPOINTS.knowledge.tags,
      { chunkId, tagName },
      schemas.SuccessResponseSchema,
    ),

  removeTag: (chunkId: string, tagName: string) =>
    apiClient.delete(
      ENDPOINTS.knowledge.tags,
      { chunkId, tagName },
      schemas.SuccessResponseSchema,
    ),

  addNote: (chunkId: string, content: string) =>
    apiClient.post(
      ENDPOINTS.knowledge.notes,
      { chunkId, content },
      schemas.NoteCreatedResponseSchema,
    ),

  updateImportance: (chunkId: string, score: number) =>
    apiClient.post(
      ENDPOINTS.knowledge.importance,
      { chunkId, score },
      schemas.SuccessResponseSchema,
    ),
};
