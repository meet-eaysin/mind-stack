export type SearchResultEntity = {
  chunkId: string;
  documentId: string;
  content: string;
  documentTitle: string;
  author?: string;
  publishedAt?: string;
  sourceUrl?: string | null;
  vectorScore: number;
  importanceScore: number | null;
  tagMatchBoost: number;
  recencyDecay: number;
  finalScore: number;
  tags: string[];
  hasNote: boolean;
};

export type QueryChunkDetail = {
  chunkId: string;
  documentId: string;
  content: string;
  documentTitle: string;
  author: string | null;
  publishedAt: Date | null;
  sourceUrl: string | null;
  importanceScore: number | null;
  tags: string[];
  createdAt: Date;
  hasNote: boolean;
  reviewCount: number;
  documentStatus: string;
};

export type QueryRepository = {
  findChunksByIds(chunkIds: string[]): Promise<QueryChunkDetail[]>;
  findChunksByTags(tags: string[]): Promise<string[]>;
  findChunksByDateRange(from: Date, to: Date): Promise<string[]>;
  findChunksByFilters(filters: {
    tags?: string[];
    fromDate?: Date;
    toDate?: Date;
    status?: string;
    collectionId?: string;
    conceptId?: string;
    keyword?: string;
  }): Promise<string[]>;
};
