import { z } from "zod";
import * as apiSchemas from "@/schemas/api.schemas";

export const UrlFormSchema = apiSchemas.IngestUrlRequestSchema;
export const TextFormSchema = apiSchemas.IngestTextRequestSchema;
export const PdfFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  file: z
    .custom<FileList>()
    .refine(
      (files) => files instanceof FileList && files.length === 1,
      "PDF file is required",
    )
    .refine(
      (files) => files?.[0]?.type === "application/pdf",
      "Must be a PDF file",
    ),
});
export const YoutubeFormSchema = apiSchemas.IngestYoutubeRequestSchema;
