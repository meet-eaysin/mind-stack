import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { settingsApi } from "../api";
import { QUERY_KEYS } from "@/constants/query-keys";
import type { ApiError } from "@/lib/api-client";
import type {
  UpdateUserLlmConfig,
  UserLlmConfig,
  EmbeddingModelHealth,
} from "../types";

export function useLlmConfig() {
  return useQuery<UserLlmConfig, ApiError>({
    queryKey: QUERY_KEYS.SETTINGS.LLM,
    queryFn: () => settingsApi.getLlmConfig(),
  });
}

export function useEmbeddingModelHealth() {
  return useQuery<EmbeddingModelHealth, ApiError>({
    queryKey: QUERY_KEYS.SETTINGS.EMBEDDING_HEALTH,
    queryFn: () => settingsApi.getEmbeddingModelHealth(),
  });
}

export function useUpdateLlmConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateUserLlmConfig) =>
      settingsApi.updateLlmConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SETTINGS.LLM });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.SETTINGS.EMBEDDING_HEALTH,
      });
    },
  });
}
