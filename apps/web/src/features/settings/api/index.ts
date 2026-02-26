import { apiClient } from "@/lib/api-client";
import { ENDPOINTS } from "@/constants/endpoints";
import * as schemas from "../schemas/settings.schemas";
import type { UpdateUserLlmConfig } from "../types";
import { z } from "zod";

const buildEnvelopeSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    success: z.literal(true),
    data,
    meta: z.object({ timestamp: z.string() }),
  });

export const settingsApi = {
  getLlmConfig: () =>
    apiClient
      .get(
        ENDPOINTS.SETTINGS.LLM,
        buildEnvelopeSchema(schemas.UserLlmConfigSchema),
      )
      .then((result) => result.data),
  updateLlmConfig: (data: UpdateUserLlmConfig) =>
    apiClient
      .put(
        ENDPOINTS.SETTINGS.LLM,
        data,
        buildEnvelopeSchema(schemas.UserLlmConfigSchema),
      )
      .then((result) => result.data),
  deleteLlmConfig: () =>
    apiClient
      .delete(
        ENDPOINTS.SETTINGS.LLM,
        {},
        buildEnvelopeSchema(z.object({ deleted: z.literal(true) })),
      )
      .then((result) => result.data),
  getEmbeddingModelHealth: () =>
    apiClient.get(
      ENDPOINTS.ADMIN.HEALTH.EMBEDDING_MODEL,
      schemas.EmbeddingModelHealthSchema,
    ),
};
