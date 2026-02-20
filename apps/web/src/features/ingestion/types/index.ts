import { z } from "zod";
import * as schemas from "../schemas/ingestion.schemas";

export type IngestUrlRequest = z.infer<typeof schemas.IngestUrlRequestSchema>;
export type IngestTextRequest = z.infer<typeof schemas.IngestTextRequestSchema>;
export type IngestPdfRequest = z.infer<typeof schemas.IngestPdfRequestSchema>;
export type IngestYoutubeRequest = z.infer<
  typeof schemas.IngestYoutubeRequestSchema
>;
export type IngestionResponse = z.infer<typeof schemas.IngestionResponseSchema>;
export type DocumentStatusResponse = z.infer<
  typeof schemas.DocumentStatusResponseSchema
>;
