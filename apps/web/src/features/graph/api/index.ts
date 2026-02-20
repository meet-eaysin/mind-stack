import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/constents/endpoints";
import * as schemas from "../schemas/graph.schemas";
import type {
  GraphResponse,
  BuildGraphResponse,
  BuildGraphRequest,
} from "../types";

export const graphApi = {
  build: (forceRebuild?: boolean): Promise<BuildGraphResponse> =>
    apiClient.post<BuildGraphResponse, BuildGraphRequest>(
      ENDPOINTS.GRAPH.BUILD,
      { forceRebuild },
      schemas.BuildGraphResponseSchema,
    ),
  get: (): Promise<GraphResponse> =>
    apiClient.get(ENDPOINTS.GRAPH.ALL, schemas.GraphResponseSchema),

  getNeighborhood: (
    conceptId: string,
    depth: number = 1,
  ): Promise<GraphResponse> =>
    apiClient.post(
      ENDPOINTS.GRAPH.NEIGHBORHOOD,
      { conceptId, depth },
      schemas.GraphResponseSchema,
    ),
};
