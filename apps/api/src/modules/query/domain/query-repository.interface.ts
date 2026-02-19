export interface SearchResultEntity {
  chunkId: string;
  content: string;
  documentTitle: string;
  vectorScore: number;
  importanceScore: number | null;
  tagMatchBoost: number;
  recencyDecay: number;
  finalScore: number;
  tags: string[];
}

export interface QueryRepository {
  findChunksByIds(chunkIds: string[]): Promise<
    Array<{
      chunkId: string;
      content: string;
      documentTitle: string;
      importanceScore: number | null;
      tags: string[];
      createdAt: Date;
      hasNote: boolean;
      reviewCount: number;
    }>
  >;
  findChunksByTags(tags: string[]): Promise<string[]>;
  findChunksByDateRange(from: Date, to: Date): Promise<string[]>;
}
