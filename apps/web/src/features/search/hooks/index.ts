import { useMutation } from "@tanstack/react-query";
import { searchApi } from "../api";
import type { ApiError } from "@/lib/api-client";
import type {
  SearchResponse,
  RetrieveResponse,
  AskQuestionResponse,
  FilteredSearchRequest,
} from "../types";

export function useSearch() {
  return useMutation<
    SearchResponse,
    ApiError,
    { query: string; topK?: number }
  >({
    mutationFn: ({ query, topK }) => searchApi.search(query, topK),
  });
}

export function useFilteredSearch() {
  return useMutation<SearchResponse, ApiError, FilteredSearchRequest>({
    mutationFn: (payload) => searchApi.filteredSearch(payload),
  });
}

export function useAskQuestion() {
  return useMutation<
    AskQuestionResponse,
    ApiError,
    { question: string; tags?: string[]; topK?: number }
  >({
    mutationFn: ({ question, tags, topK }) =>
      searchApi.ask(question, tags, topK),
  });
}

export function useRetrieve() {
  return useMutation<
    RetrieveResponse,
    ApiError,
    { query: string; topK?: number }
  >({
    mutationFn: ({ query, topK }) => searchApi.retrieve(query, topK),
  });
}
