import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/constants/endpoints";
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
  getRelated: (id: string) =>
    apiClient.get(
      ENDPOINTS.KNOWLEDGE.RELATED(id),
      schemas.RelatedSuggestionsResponseSchema,
    ),
  update: (
    id: string,
    updates: {
      title?: string;
      sourceUrl?: string;
      learningStatus?: string;
      type?: string;
      author?: string;
      publisher?: string;
      publishedAt?: string;
      language?: string;
    },
  ) =>
    apiClient.post(
      ENDPOINTS.KNOWLEDGE.UPDATE(id),
      updates,
      SuccessResponseSchema,
    ),

  delete: (id: string) =>
    apiClient.delete(ENDPOINTS.KNOWLEDGE.DELETE(id), {}, SuccessResponseSchema),

  addTag: (documentId: string, tagName: string) =>
    apiClient.post(
      ENDPOINTS.KNOWLEDGE.TAGS_ADD,
      { documentId, tagName },
      SuccessResponseSchema,
    ),

  removeTag: (documentId: string, tagName: string) =>
    apiClient.post(
      ENDPOINTS.KNOWLEDGE.TAGS_REMOVE,
      { documentId, tagName },
      SuccessResponseSchema,
    ),

  addNote: (
    documentId: string,
    content: string,
    type?: string,
    chunkId?: string,
    selectedText?: string,
    metadata?: Record<string, string | number | boolean | null>,
  ) =>
    apiClient.post(
      ENDPOINTS.KNOWLEDGE.NOTES_ADD,
      { documentId, content, type, chunkId, selectedText, metadata },
      schemas.NoteResponseSchema,
    ),

  updateImportance: (documentId: string, score: number) =>
    apiClient.post(
      ENDPOINTS.KNOWLEDGE.IMPORTANCE,
      { documentId, score },
      SuccessResponseSchema,
    ),

  updateNote: (noteId: string, content: string) =>
    apiClient.post(
      ENDPOINTS.KNOWLEDGE.NOTES_UPDATE(noteId),
      { content },
      schemas.NoteResponseSchema,
    ),
};
