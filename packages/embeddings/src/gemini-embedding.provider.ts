import { z } from "zod";
import {
  type EmbeddingProvider,
  type EmbeddingResult,
} from "./embedding-provider.interface.js";

export type GeminiEmbeddingOptions = {
  baseUrl: string;
  apiKey: string;
  model: string;
};

const ResponseSchema = z.object({
  embedding: z.object({
    values: z.array(z.number()),
  }),
});

export class GeminiEmbeddingProvider implements EmbeddingProvider {
  constructor(private readonly options: GeminiEmbeddingOptions) {}

  getDimensions(): number {
    return 0;
  }

  async embed(text: string): Promise<EmbeddingResult> {
    const resourceName = this.options.model.startsWith("models/")
      ? this.options.model
      : `models/${this.options.model}`;
    const url = `${this.options.baseUrl}/v1beta/${resourceName}:embedContent`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": this.options.apiKey,
      },
      body: JSON.stringify({
        content: {
          parts: [{ text }],
        },
      }),
    });

    if (!response.ok) {
      const details = (await response.text()).trim();
      const suffix = details.length > 0 ? ` - ${details}` : "";
      throw new Error(
        `Gemini embedding failed: ${response.status} ${response.statusText}${suffix}`,
      );
    }

    const payload = ResponseSchema.parse(await response.json());
    return {
      embedding: payload.embedding.values,
      dimensions: payload.embedding.values.length,
    };
  }

  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    const results: EmbeddingResult[] = [];
    for (const text of texts) {
      results.push(await this.embed(text));
    }
    return results;
  }
}
