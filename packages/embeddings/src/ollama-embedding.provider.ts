import { createLogger } from "@repo/logger";
import type {
  EmbeddingProvider,
  EmbeddingResult,
} from "./embedding-provider.interface.js";

interface OllamaEmbedResponse {
  embeddings: number[][];
}

export class OllamaEmbeddingProvider implements EmbeddingProvider {
  private readonly logger = createLogger("OllamaEmbeddingProvider");
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly dims: number;

  constructor(baseUrl: string, model: string, dimensions: number = 768) {
    this.baseUrl = baseUrl;
    this.model = model;
    this.dims = dimensions;
  }

  getDimensions(): number {
    return this.dims;
  }

  async embed(text: string): Promise<EmbeddingResult> {
    const results = await this.embedBatch([text]);
    const first = results[0];
    if (!first) {
      throw new Error("Embedding returned no results");
    }
    return first;
  }

  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    const response = await fetch(`${this.baseUrl}/api/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        input: texts,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Ollama embed failed: ${response.status} ${errorText}`
      );
    }

    const data = (await response.json()) as OllamaEmbedResponse;

    return data.embeddings.map((embedding) => ({
      embedding,
      dimensions: embedding.length,
    }));
  }
}
