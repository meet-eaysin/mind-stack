export type ReviewEntity = {
  id: string;
  chunkId: string;
  lastReviewedAt: Date;
  reviewScore: number;
};

export type ReviewRepository = {
  findByChunkId(chunkId: string): Promise<ReviewEntity | null>;
  upsert(chunkId: string, score: number): Promise<ReviewEntity>;
  findDueForReview(limit: number): Promise<ReviewEntity[]>;
  findAll(): Promise<ReviewEntity[]>;
};
