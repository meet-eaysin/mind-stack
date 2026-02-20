import { apiClient } from "@/api/client";
import { ENDPOINTS } from "@/api/endpoints";
import * as schemas from "@/schemas/api.schemas";
import type {
  SemanticSearchRequest,
  FilteredSearchRequest,
  AskQuestionRequest,
  SearchResponse,
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
};
