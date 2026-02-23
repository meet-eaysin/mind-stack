import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/constants/endpoints";
import * as schemas from "../schemas/graph.schemas";
import { z } from "zod";
import type {
  GraphResponse,
  BuildGraphResponse,
  BuildGraphRequest,
  CreateRelationRequest,
  CreateRelationResponse,
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

  createRelation: (
    payload: CreateRelationRequest,
  ): Promise<CreateRelationResponse> =>
    apiClient.post(
      ENDPOINTS.GRAPH.RELATIONS,
      payload,
      schemas.CreateRelationResponseSchema,
    ),

  deleteRelation: (relationId: string): Promise<void> =>
    apiClient.delete(ENDPOINTS.GRAPH.RELATION(relationId), {}, z.void()),
};
