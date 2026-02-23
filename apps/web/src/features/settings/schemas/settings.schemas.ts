import { z } from "zod";
import { ModelProviderSchema } from "@/schemas/api.schemas";

export const UserLlmConfigSchema = z.object({
  userId: z.string(),
  embeddingProvider: ModelProviderSchema,
  embeddingModel: z.string(),
  generationProvider: ModelProviderSchema,
  generationModel: z.string(),
});

export const UpdateUserLlmConfigSchema = z.object({
  embeddingProvider: ModelProviderSchema,
  embeddingModel: z.string().min(1, "Embedding model is required"),
  generationProvider: ModelProviderSchema,
  generationModel: z.string().min(1, "Generation model is required"),
});

export const EmbeddingModelHealthSchema = z.object({
  provider: ModelProviderSchema,
  model: z.string(),
  baseUrl: z.string(),
  available: z.boolean(),
  reason: z.string().optional(),
});
