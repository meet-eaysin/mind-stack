import { z } from "zod";
import { IngestionStatusSchema } from "@/schemas/api.schemas";

export const IngestUrlRequestSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
});

export const IngestTextRequestSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
});

export const IngestPdfRequestSchema = z.object({
  title: z.string().min(1),
  fileBase64: z.string(),
});

export const IngestYoutubeRequestSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
});

export const IngestionResponseSchema = z.object({
  documentId: z.string(),
  status: IngestionStatusSchema,
  message: z.string(),
});

export const DocumentStatusResponseSchema = z.object({
  status: IngestionStatusSchema,
});
