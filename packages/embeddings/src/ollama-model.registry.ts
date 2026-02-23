import { z } from "zod";
import { createLogger } from "@repo/logger";

const logger = createLogger("OllamaModelRegistry");

const ModelSchema = z
  .object({
    name: z.string().optional(),
    model: z.string().optional(),
  })
  .refine((value) => Boolean(value.name ?? value.model), {
    message: "Model entry missing name",
  });

const TagsResponseSchema = z.object({
  models: z.array(ModelSchema),
});

export class OllamaModelRegistry {
  constructor(private readonly baseUrl: string) {}

  private normalizeModelName(name: string): string {
    return name.trim().toLowerCase();
  }

  private withFallbackTags(name: string): Set<string> {
    const normalized = this.normalizeModelName(name);
    const values = new Set<string>([normalized]);
    const colonIndex = normalized.indexOf(":");
    if (colonIndex > 0) {
      values.add(normalized.slice(0, colonIndex));
    } else {
      values.add(`${normalized}:latest`);
    }
    return values;
  }

  async listModels(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/api/tags`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      const body = await response.text();
      logger.error("Failed to fetch Ollama model tags", {
        status: response.status,
        body,
      });
      throw new Error(`Ollama model list failed: ${response.statusText}`);
    }

    const data = TagsResponseSchema.parse(await response.json());
    return data.models
      .map((model) => model.name ?? model.model ?? "")
      .filter((name) => name.length > 0);
  }

  async hasModel(model: string): Promise<boolean> {
    const models = await this.listModels();
    const requested = this.withFallbackTags(model);
    const available = new Set<string>();
    for (const entry of models) {
      const candidates = this.withFallbackTags(entry);
      for (const candidate of candidates) {
        available.add(candidate);
      }
    }
    for (const requestName of requested) {
      if (available.has(requestName)) {
        return true;
      }
    }
    return false;
  }
}
