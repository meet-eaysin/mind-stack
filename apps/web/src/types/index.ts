import { z } from "zod";
import * as schemas from "@/schemas/api.schemas";

export type IngestionStatus = z.infer<typeof schemas.IngestionStatusSchema>;
export type SourceType = z.infer<typeof schemas.SourceTypeSchema>;
export type RelationType = z.infer<typeof schemas.RelationTypeSchema>;

export type Chunk = z.infer<typeof schemas.ChunkSchema>;
export type ChunkReference = z.infer<typeof schemas.ChunkReferenceSchema>;
export type NotionBlock = z.infer<typeof schemas.NotionBlockSchema>;

export type SuccessResponse = z.infer<typeof schemas.SuccessResponseSchema>;
