import { z } from "zod";
import {
  type EmbeddingProvider,
  type EmbeddingResult,
} from "./embedding-provider.interface.js";

export type OpenAIEmbeddingOptions = {
  baseUrl: string;
  apiKey: string;
  model: string;
};

const ResponseSchema = z.object({
  data: z
    .array(
      z.object({
        embedding: z.array(z.number()),
      }),
    )
    .min(1),
});

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  constructor(private readonly options: OpenAIEmbeddingOptions) {}

  getDimensions(): number {
    return 0;
  }

  async embed(text: string): Promise<EmbeddingResult> {
    const [first] = await this.embedBatch([text]);
    if (!first) {
      throw new Error("OpenAI embedding failed: empty embedding response");
    }
    return first;
  }

  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    const response = await fetch(`${this.options.baseUrl}/v1/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.options.apiKey}`,
      },
      body: JSON.stringify({
        model: this.options.model,
        input: texts,
      }),
    });

    if (!response.ok) {
      const details = (await response.text()).trim();
      const suffix = details.length > 0 ? ` - ${details}` : "";
      throw new Error(
        `OpenAI embedding failed: ${response.status} ${response.statusText}${suffix}`,
      );
    }

    const payload = ResponseSchema.parse(await response.json());
    return payload.data.map((item) => ({
      embedding: item.embedding,
      dimensions: item.embedding.length,
    }));
  }
}
