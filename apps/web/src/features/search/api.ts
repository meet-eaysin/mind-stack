import { apiClient } from "@/api/client";
import { ENDPOINTS } from "@/api/endpoints";
import * as schemas from "@/schemas/api.schemas";
import type {
  SemanticSearchRequest,
  FilteredSearchRequest,
  AskQuestionRequest,
  SearchResponse,
  RetrieveResponse,
  AskQuestionResponse,
} from "@/types/api";

export const searchApi = {
  search: (query: string, topK: number = 10) =>
    apiClient.post<SearchResponse, SemanticSearchRequest>(
      ENDPOINTS.query.search,
      { query, topK },
      schemas.SearchResponseSchema,
    ),

  filteredSearch: (payload: FilteredSearchRequest) =>
    apiClient.post<SearchResponse, FilteredSearchRequest>(
      ENDPOINTS.query.filtered,
      payload,
      schemas.SearchResponseSchema,
    ),

  ask: (question: string, tags?: string[], topK: number = 5) =>
    apiClient.post<AskQuestionResponse, AskQuestionRequest>(
      ENDPOINTS.query.ask,
      { question, tags, topK },
      schemas.AskQuestionResponseSchema,
    ),

  askStream: (question: string, tags?: string[], topK: number = 5) => {
    const params = new URLSearchParams({ question, topK: topK.toString() });
    if (tags && tags.length > 0) {
      tags.forEach((tag) => params.append("tags", tag));
    }
    return new EventSource(`${ENDPOINTS.query.askStream}?${params.toString()}`);
  },

  retrieve: (query: string, topK: number = 10) =>
    apiClient.post<RetrieveResponse, SemanticSearchRequest>(
      ENDPOINTS.query.retrieve,
      { query, topK },
      schemas.RetrieveResponseSchema,
    ),
};
