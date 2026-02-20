import { apiClient } from "@/api/client";
import { ENDPOINTS } from "@/api/endpoints";
import * as schemas from "@/schemas/api.schemas";
import type { ExportMarkdownResponse, ExportNotionResponse } from "@/types/api";

export const exportApi = {
  markdown: (chunkIds: string[]): Promise<ExportMarkdownResponse> =>
    apiClient.post(
      ENDPOINTS.export.markdown,
      { chunkIds },
      schemas.ExportMarkdownResponseSchema,
    ),

  notion: (chunkIds: string[]): Promise<ExportNotionResponse> =>
    apiClient.post(
      ENDPOINTS.export.notion,
      { chunkIds },
      schemas.ExportNotionResponseSchema,
    ),
};
