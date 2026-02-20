import { z } from "zod";
import { NotionBlockSchema } from "@/schemas/api.schemas";

export const ExportRequestSchema = z.object({
  chunkIds: z.array(z.string()),
});

export const ExportMarkdownResponseSchema = z.object({
  markdown: z.string(),
});

export const ExportNotionResponseSchema = z.object({
  payload: z.array(NotionBlockSchema),
});
