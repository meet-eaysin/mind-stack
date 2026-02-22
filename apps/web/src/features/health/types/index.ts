import { z } from "zod";
import * as schemas from "../schemas/health.schemas";

export type MissingEmbeddingsResponse = z.infer<
  typeof schemas.MissingEmbeddingsResponseSchema
>;
export type OrphansResponse = z.infer<typeof schemas.OrphansResponseSchema>;
export type FailedDocumentsResponse = z.infer<
  typeof schemas.FailedDocumentsResponseSchema
>;
export type QueueMetricsResponse = z.infer<
  typeof schemas.QueueMetricsResponseSchema
>;
