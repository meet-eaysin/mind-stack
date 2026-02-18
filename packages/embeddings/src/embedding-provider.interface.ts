export interface EmbeddingResult {
  embedding: number[];
  dimensions: number;
}

export interface EmbeddingProvider {
  embed(text: string): Promise<EmbeddingResult>;
  embedBatch(texts: string[]): Promise<EmbeddingResult[]>;
  getDimensions(): number;
}
