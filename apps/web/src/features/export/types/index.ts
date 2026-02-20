import { z } from "zod";
import * as schemas from "../schemas/export.schemas";

export type ExportRequest = z.infer<typeof schemas.ExportRequestSchema>;
export type ExportMarkdownResponse = z.infer<
  typeof schemas.ExportMarkdownResponseSchema
>;
export type ExportNotionResponse = z.infer<
  typeof schemas.ExportNotionResponseSchema
>;
