import { z } from "zod";
import * as schemas from "../schemas/search.schemas";

export type SemanticSearchRequest = z.infer<
  typeof schemas.SemanticSearchRequestSchema
>;
export type FilteredSearchRequest = z.infer<
  typeof schemas.FilteredSearchRequestSchema
>;
export type AskQuestionRequest = z.infer<
  typeof schemas.AskQuestionRequestSchema
>;
export type SearchResponse = z.infer<typeof schemas.SearchResponseSchema>;
export type RetrieveResponse = z.infer<typeof schemas.RetrieveResponseSchema>;
export type AskQuestionResponse = z.infer<
  typeof schemas.AskQuestionResponseSchema
>;
export type StreamingAskResponseChunk = z.infer<
  typeof schemas.StreamingAskResponseChunkSchema
>;

import { DocumentSearchResultSchema } from "@/schemas/api.schemas";
export type DocumentSearchResult = z.infer<typeof DocumentSearchResultSchema>;
