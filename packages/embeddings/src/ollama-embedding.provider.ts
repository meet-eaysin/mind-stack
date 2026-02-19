import { z } from "zod";
import { createLogger } from "@repo/logger";
import {
  type EmbeddingProvider,
  type EmbeddingResult,
} from "./embedding-provider.interface.js";

export type OllamaEmbeddingOptions = {
  baseUrl: string;
  model: string;
  dimensions?: number;
};

const EmbeddingResponseSchema = z.object({
  embedding: z.array(z.number()),
});

const logger = createLogger("OllamaEmbeddingProvider");

export class OllamaEmbeddingProvider implements EmbeddingProvider {
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly dims: number;

  constructor(options: OllamaEmbeddingOptions) {
    this.baseUrl = options.baseUrl;
    this.model = options.model;
    this.dims = options.dimensions ?? 768;
    logger.info(`Initialized with model: ${this.model}`);
  }

  getDimensions(): number {
    return this.dims;
  }

  async embed(text: string): Promise<EmbeddingResult> {
    const response = await fetch(`${this.baseUrl}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        prompt: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama embedding failed: ${response.statusText}`);
    }

    const rawData: unknown = await response.json();
    const data = EmbeddingResponseSchema.parse(rawData);

    return {
      embedding: data.embedding,
      dimensions: this.dims,
    };
  }

  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    return Promise.all(texts.map((t) => this.embed(t)));
  }
}
