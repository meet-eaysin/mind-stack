import { z } from "zod";
import { ChunkReferenceSchema } from "@/schemas/api.schemas";

export const SemanticSearchRequestSchema = z.object({
  query: z.string(),
  topK: z.number().optional(),
});

export const FilteredSearchRequestSchema = z.object({
  query: z.string(),
  tags: z.array(z.string()).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  topK: z.number().optional(),
});

export const AskQuestionRequestSchema = z.object({
  question: z.string(),
  tags: z.array(z.string()).optional(),
  topK: z.number().optional(),
});

export const SearchResponseSchema = z.object({
  chunks: z.array(ChunkReferenceSchema),
});

export const RetrieveResponseSchema = z.object({
  chunks: z.array(ChunkReferenceSchema),
});

export const AskQuestionResponseSchema = z.object({
  answer: z.string(),
  citations: z.array(ChunkReferenceSchema),
});

export const StreamingAskResponseChunkSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("citations"),
    data: z.array(ChunkReferenceSchema),
  }),
  z.object({ type: z.literal("text"), data: z.string() }),
  z.object({ type: z.literal("done") }),
]);
