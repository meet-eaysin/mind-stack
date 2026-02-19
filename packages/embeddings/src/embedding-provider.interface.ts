export type EmbeddingResult = {
  embedding: number[];
  dimensions: number;
};

export type EmbeddingProvider = {
  embed(text: string): Promise<EmbeddingResult>;
  embedBatch(texts: string[]): Promise<EmbeddingResult[]>;
  getDimensions(): number;
};
