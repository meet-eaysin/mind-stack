import { z } from "zod";
import {
  ModelCapabilitySchema,
  ModelProviderSchema,
} from "@/schemas/api.schemas";
import { MODEL_CAPABILITY, MODEL_PROVIDER } from "@repo/shared-types";

export const UserLlmConfigSchema = z.object({
  userId: z.string(),
  provider: ModelProviderSchema,
  model: z.string(),
  baseUrl: z.string().nullable(),
  enabledCapabilities: z.array(ModelCapabilitySchema),
  hasApiKey: z.boolean(),
});

export const UpdateUserLlmConfigSchema = z
  .object({
    provider: ModelProviderSchema,
    model: z.string().min(1, "Model is required"),
    baseUrl: z
      .string()
      .url("Base URL must be a valid URL")
      .optional()
      .or(z.literal("")),
    apiKey: z.string().optional(),
    enabledCapabilities: z.array(ModelCapabilitySchema).min(1),
  })
  .superRefine((value, context) => {
    const providerCapabilities: Record<string, string[]> = {
      [MODEL_PROVIDER.OLLAMA]: [
        MODEL_CAPABILITY.CHAT,
        MODEL_CAPABILITY.EMBEDDING,
      ],
      [MODEL_PROVIDER.OPENAI]: [
        MODEL_CAPABILITY.CHAT,
        MODEL_CAPABILITY.EMBEDDING,
      ],
      [MODEL_PROVIDER.OPENROUTER]: [
        MODEL_CAPABILITY.CHAT,
        MODEL_CAPABILITY.EMBEDDING,
      ],
      [MODEL_PROVIDER.GEMINI]: [
        MODEL_CAPABILITY.CHAT,
        MODEL_CAPABILITY.EMBEDDING,
      ],
    };

    const supported = providerCapabilities[value.provider] ?? [];
    for (const capability of value.enabledCapabilities) {
      if (!supported.includes(capability)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["enabledCapabilities"],
          message: `${value.provider} does not support ${capability}`,
        });
        break;
      }
    }
  });

export const EmbeddingModelHealthSchema = z.object({
  provider: ModelProviderSchema,
  model: z.string(),
  baseUrl: z.string(),
  available: z.boolean(),
  reason: z.string().optional(),
});
