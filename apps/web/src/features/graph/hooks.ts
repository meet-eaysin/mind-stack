import { useQuery } from "@tanstack/react-query";
import { graphApi } from "./api";
import { QUERY_KEYS } from "@/api/query-keys";
import type { ApiError } from "@/api/client";
import type { GraphResponse } from "@/types/api";

export function useGraph() {
  return useQuery<GraphResponse, ApiError>({
    queryKey: QUERY_KEYS.graph.all,
    queryFn: () => graphApi.get(),
  });
}

export function useNeighborhood(conceptId: string | null, depth = 1) {
  return useQuery<GraphResponse, ApiError>({
    queryKey: ["graph", "neighborhood", conceptId, depth],
    queryFn: () => graphApi.getNeighborhood(conceptId!, depth),
    enabled: conceptId !== null,
  });
}
