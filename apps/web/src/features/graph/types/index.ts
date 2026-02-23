import { z } from "zod";
import * as schemas from "../schemas/graph.schemas";

export type GraphNode = z.infer<typeof schemas.GraphNodeSchema>;
export type GraphEdge = z.infer<typeof schemas.GraphEdgeSchema>;
export type GraphResponse = z.infer<typeof schemas.GraphResponseSchema>;
export type BuildGraphRequest = z.infer<typeof schemas.BuildGraphRequestSchema>;
export type BuildGraphResponse = z.infer<
  typeof schemas.BuildGraphResponseSchema
>;
export type NeighborhoodRequest = z.infer<
  typeof schemas.NeighborhoodRequestSchema
>;
export type CreateRelationRequest = z.infer<
  typeof schemas.CreateRelationRequestSchema
>;
export type CreateRelationResponse = z.infer<
  typeof schemas.CreateRelationResponseSchema
>;
