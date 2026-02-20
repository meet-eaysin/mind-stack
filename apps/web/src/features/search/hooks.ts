import { useMutation } from "@tanstack/react-query";
import { searchApi } from "./api";
import type { ApiError } from "@/api/client";
import type {
  SearchResponse,
  AskQuestionResponse,
  FilteredSearchRequest,
} from "@/types/api";

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
