import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { graphApi } from "../api";
import { QUERY_KEYS } from "@/constants/query-keys";
import type { ApiError } from "@/lib/api-client";
import type {
  GraphResponse,
  BuildGraphResponse,
  CreateRelationRequest,
  CreateRelationResponse,
} from "../types";

export function useBuildGraph() {
  const queryClient = useQueryClient();
  return useMutation<BuildGraphResponse, ApiError, { forceRebuild?: boolean }>({
    mutationFn: ({ forceRebuild }) => graphApi.build(forceRebuild),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GRAPH.ALL });
    },
  });
}

export function useGraph() {
  return useQuery<GraphResponse, ApiError>({
    queryKey: QUERY_KEYS.GRAPH.ALL,
    queryFn: () => graphApi.get(),
  });
}

export function useNeighborhood(conceptId: string | null, depth = 1) {
  return useQuery<GraphResponse, ApiError>({
    queryKey: ["graph", "neighborhood", conceptId, depth],
    queryFn: () => graphApi.getNeighborhood(conceptId ?? "", depth),
    enabled: conceptId !== null,
  });
}

export function useCreateRelation() {
  const queryClient = useQueryClient();
  return useMutation<CreateRelationResponse, ApiError, CreateRelationRequest>({
    mutationFn: (payload) => graphApi.createRelation(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GRAPH.ALL });
    },
  });
}

export function useDeleteRelation() {
  const queryClient = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (relationId) => graphApi.deleteRelation(relationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GRAPH.ALL });
    },
  });
}
