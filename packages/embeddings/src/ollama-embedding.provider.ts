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

const EmbedResponseSchema = z.object({
  embeddings: z.array(z.array(z.number())).optional(),
  embedding: z.array(z.number()).optional(),
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
    const response = await fetch(`${this.baseUrl}/api/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        input: text,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      const errorMessage = errorBody.trim();
      const suffix = errorMessage ? ` - ${errorMessage}` : "";
      throw new Error(
        `Ollama embedding failed: ${response.status} ${response.statusText}${suffix}`,
      );
    }

    const data = EmbedResponseSchema.parse(await response.json());
    const first = data.embeddings?.[0] ?? data.embedding;
    if (!first) {
      throw new Error(
        "Ollama embedding failed: response missing embedding data",
      );
    }

    return {
      embedding: first,
      dimensions: this.dims,
    };
  }

  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    return Promise.all(texts.map((t) => this.embed(t)));
  }
}
