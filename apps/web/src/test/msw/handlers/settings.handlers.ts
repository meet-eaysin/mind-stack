import { http, HttpResponse } from "msw";
import { z } from "zod";

let config = {
  userId: "default",
  embeddingProvider: "OLLAMA",
  embeddingModel: "nomic-embed-text",
  generationProvider: "OLLAMA",
  generationModel: "llama3",
};

export const handlers = [
  http.get("*/settings/llm", () => HttpResponse.json(config)),
  http.put("*/settings/llm", async ({ request }) => {
    const bodySchema = z.object({
      embeddingProvider: z.string(),
      embeddingModel: z.string(),
      generationProvider: z.string(),
      generationModel: z.string(),
    });
    const body = bodySchema.parse(await request.json());
    config = { ...config, ...body };
    return HttpResponse.json(config);
  }),
  http.get("*/admin/health/embedding-model", () =>
    HttpResponse.json({
      provider: "OLLAMA",
      model: config.embeddingModel,
      baseUrl: "http://localhost:11434",
      available: true,
    }),
  ),
];
