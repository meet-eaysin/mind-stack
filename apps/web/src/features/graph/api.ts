import { apiClient } from "@/api/client";
import { ENDPOINTS } from "@/api/endpoints";
import * as schemas from "@/schemas/api.schemas";
import type { GraphResponse } from "@/types/api";

export const graphApi = {
  get: (): Promise<GraphResponse> =>
    apiClient.get(ENDPOINTS.graph.all, schemas.GraphResponseSchema),

  getNeighborhood: (
    conceptId: string,
    depth: number = 1,
  ): Promise<GraphResponse> =>
    apiClient.post(
      ENDPOINTS.graph.neighborhood,
      { conceptId, depth },
      schemas.GraphResponseSchema,
    ),
};
