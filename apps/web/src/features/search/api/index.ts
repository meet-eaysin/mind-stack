import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/constents/endpoints";
import * as schemas from "../schemas/search.schemas";
import type {
  SemanticSearchRequest,
  FilteredSearchRequest,
  AskQuestionRequest,
  SearchResponse,
  RetrieveResponse,
  AskQuestionResponse,
} from "../types";

export const searchApi = {
  search: (query: string, topK: number = 10) =>
    apiClient.post<SearchResponse, SemanticSearchRequest>(
      ENDPOINTS.QUERY.SEARCH,
      { query, topK },
      schemas.SearchResponseSchema,
    ),

  filteredSearch: (payload: FilteredSearchRequest) =>
    apiClient.post<SearchResponse, FilteredSearchRequest>(
      ENDPOINTS.QUERY.FILTERED,
      payload,
      schemas.SearchResponseSchema,
    ),

  ask: (question: string, tags?: string[], topK: number = 5) =>
    apiClient.post<AskQuestionResponse, AskQuestionRequest>(
      ENDPOINTS.QUERY.ASK,
      { question, tags, topK },
      schemas.AskQuestionResponseSchema,
    ),

  askStream: (question: string, tags?: string[], topK: number = 5) => {
    const params = new URLSearchParams({ question, topK: topK.toString() });
    if (tags && tags.length > 0) {
      tags.forEach((tag) => params.append("tags", tag));
    }
    return new EventSource(
      `${ENDPOINTS.QUERY.ASK_STREAM}?${params.toString()}`,
    );
  },

  retrieve: (query: string, topK: number = 10) =>
    apiClient.post<RetrieveResponse, SemanticSearchRequest>(
      ENDPOINTS.QUERY.RETRIEVE,
      { query, topK },
      schemas.RetrieveResponseSchema,
    ),
};
