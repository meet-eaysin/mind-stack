export interface VectorDocument {
  id: string;
  embedding: number[];
  metadata: Record<string, string | number | boolean>;
  content: string;
}

export interface VectorSearchResult {
  id: string;
  score: number;
  metadata: Record<string, string | number | boolean>;
  content: string;
}

export interface VectorSearchOptions {
  topK: number;
  filter?: Record<string, string | number | boolean>;
  minScore?: number;
}

export interface VectorStore {
  upsert(documents: VectorDocument[]): Promise<void>;
  query(
    embedding: number[],
    options: VectorSearchOptions
  ): Promise<VectorSearchResult[]>;
  delete(ids: string[]): Promise<void>;
  count(): Promise<number>;
}
