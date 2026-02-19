export type SearchResultEntity = {
  chunkId: string;
  content: string;
  documentTitle: string;
  vectorScore: number;
  importanceScore: number | null;
  tagMatchBoost: number;
  recencyDecay: number;
  finalScore: number;
  tags: string[];
};

export type QueryChunkDetail = {
  chunkId: string;
  content: string;
  documentTitle: string;
  importanceScore: number | null;
  tags: string[];
  createdAt: Date;
  hasNote: boolean;
  reviewCount: number;
};

export type QueryRepository = {
  findChunksByIds(chunkIds: string[]): Promise<QueryChunkDetail[]>;
  findChunksByTags(tags: string[]): Promise<string[]>;
  findChunksByDateRange(from: Date, to: Date): Promise<string[]>;
};
