import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/constents/endpoints";
import * as schemas from "@/schemas/api.schemas";
import type { ExportMarkdownResponse, ExportNotionResponse } from "@/types";

export const exportApi = {
  markdown: (chunkIds: string[]): Promise<ExportMarkdownResponse> =>
    apiClient.post(
      ENDPOINTS.EXPORT.MARKDOWN,
      { chunkIds },
      schemas.ExportMarkdownResponseSchema,
    ),

  notion: (chunkIds: string[]): Promise<ExportNotionResponse> =>
    apiClient.post(
      ENDPOINTS.EXPORT.NOTION,
      { chunkIds },
      schemas.ExportNotionResponseSchema,
    ),
};
