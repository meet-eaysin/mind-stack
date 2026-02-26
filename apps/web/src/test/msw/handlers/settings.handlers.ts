import { http, HttpResponse } from "msw";
import { z } from "zod";
import { MODEL_CAPABILITY, MODEL_PROVIDER } from "@repo/shared-types";
import {
  UpdateUserLlmConfigSchema,
  UserLlmConfigSchema,
} from "@/features/settings/schemas/settings.schemas";

let config: z.infer<typeof UserLlmConfigSchema> = {
  userId: "default",
  provider: MODEL_PROVIDER.OLLAMA,
  model: "llama3",
  baseUrl: "http://localhost:11434",
  enabledCapabilities: [MODEL_CAPABILITY.CHAT, MODEL_CAPABILITY.EMBEDDING],
  hasApiKey: false,
};

export const handlers = [
  http.get("*/me/llm-config", () =>
    HttpResponse.json({
      success: true,
      data: config,
      meta: { timestamp: new Date().toISOString() },
    }),
  ),
  http.put("*/me/llm-config", async ({ request }) => {
    const body = UpdateUserLlmConfigSchema.parse(await request.json());
    config = {
      ...config,
      provider: body.provider,
      model: body.model,
      baseUrl: body.baseUrl && body.baseUrl.length > 0 ? body.baseUrl : null,
      enabledCapabilities: body.enabledCapabilities,
      hasApiKey: Boolean(body.apiKey),
    };
    return HttpResponse.json({
      success: true,
      data: config,
      meta: { timestamp: new Date().toISOString() },
    });
  }),
  http.delete("*/me/llm-config", () => {
    config = {
      userId: "default",
      provider: MODEL_PROVIDER.OLLAMA,
      model: "llama3",
      baseUrl: "http://localhost:11434",
      enabledCapabilities: [MODEL_CAPABILITY.CHAT, MODEL_CAPABILITY.EMBEDDING],
      hasApiKey: false,
    };
    return HttpResponse.json({
      success: true,
      data: { deleted: true },
      meta: { timestamp: new Date().toISOString() },
    });
  }),
  http.get("*/admin/health/embedding-model", () =>
    HttpResponse.json({
      provider: config.provider,
      model: config.model,
      baseUrl: config.baseUrl ?? "http://localhost:11434",
      available: config.enabledCapabilities.includes(
        MODEL_CAPABILITY.EMBEDDING,
      ),
    }),
  ),
];
