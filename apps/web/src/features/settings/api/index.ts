import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/constants/endpoints";
import * as schemas from "../schemas/settings.schemas";
import type { UpdateUserLlmConfig } from "../types";

export const settingsApi = {
  getLlmConfig: () =>
    apiClient.get(ENDPOINTS.SETTINGS.LLM, schemas.UserLlmConfigSchema),
  updateLlmConfig: (data: UpdateUserLlmConfig) =>
    apiClient.put(ENDPOINTS.SETTINGS.LLM, data, schemas.UserLlmConfigSchema),
  getEmbeddingModelHealth: () =>
    apiClient.get(
      ENDPOINTS.ADMIN.HEALTH.EMBEDDING_MODEL,
      schemas.EmbeddingModelHealthSchema,
    ),
};
