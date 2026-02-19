import { createLogger } from "@repo/logger";
import type {
  EmbeddingProvider,
  EmbeddingResult,
} from "./embedding-provider.interface.js";

export interface OllamaEmbeddingOptions {
  baseUrl: string;
  model: string;
  dimensions?: number;
}

export class OllamaEmbeddingProvider implements EmbeddingProvider {
  private readonly logger = createLogger("OllamaEmbeddingProvider");
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly dims: number;

  constructor(options: OllamaEmbeddingOptions) {
    this.baseUrl = options.baseUrl;
    this.model = options.model;
    this.dims = options.dimensions ?? 768;
    this.logger.info(`Initialized with model: ${this.model}`);
  }

  getDimensions(): number {
    return this.dims;
  }

  async embed(text: string): Promise<EmbeddingResult> {
    const response = await fetch(`${this.baseUrl}/api/embeddings`, {
      method: "POST",
      body: JSON.stringify({
        model: this.model,
        prompt: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama embedding failed: ${response.statusText}`);
    }

    const data = (await response.json()) as { embedding: number[] };
    return {
      embedding: data.embedding,
      dimensions: this.dims,
    };
  }

  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    return Promise.all(texts.map((t) => this.embed(t)));
  }
}
