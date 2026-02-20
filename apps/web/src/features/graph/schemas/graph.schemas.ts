import { z } from "zod";
import { RelationTypeSchema } from "@/schemas/api.schemas";

export const GraphNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  chunkCount: z.number(),
  associatedChunks: z
    .array(
      z.object({
        id: z.string(),
        content: z.string(),
        documentTitle: z.string(),
      }),
    )
    .optional(),
});

export const GraphEdgeSchema = z.object({
  fromId: z.string(),
  toId: z.string(),
  relationType: RelationTypeSchema,
});

export const GraphResponseSchema = z.object({
  nodes: z.array(GraphNodeSchema),
  edges: z.array(GraphEdgeSchema),
});

export const BuildGraphRequestSchema = z.object({
  forceRebuild: z.boolean().optional(),
});

export const BuildGraphResponseSchema = z.object({
  success: z.boolean(),
});

export const NeighborhoodRequestSchema = z.object({
  conceptId: z.string(),
  depth: z.number().optional(),
});
