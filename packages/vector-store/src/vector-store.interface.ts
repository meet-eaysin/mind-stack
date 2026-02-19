export type VectorDocument = {
  id: string;
  embedding: number[];
  content: string;
  metadata?: Record<string, string | number | boolean>;
};

export type VectorSearchResult = {
  id: string;
  content: string;
  metadata: Record<string, string | number | boolean>;
  score: number;
};

export type VectorSearchOptions = {
  topK?: number;
  filter?: Record<string, string | number | boolean>;
};

export type VectorStore = {
  upsert(documents: VectorDocument[]): Promise<void>;
  search(
    query: number[],
    options?: VectorSearchOptions,
  ): Promise<VectorSearchResult[]>;
  delete(ids: string[]): Promise<void>;
  count(): Promise<number>;
};
