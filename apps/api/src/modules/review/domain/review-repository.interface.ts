export type ReviewEntity = {
  id: string;
  documentId: string;
  lastReviewedAt: Date;
  reviewScore: number;
};

export type ReviewRepository = {
  findByDocumentId(documentId: string): Promise<ReviewEntity | null>;
  upsert(documentId: string, score: number): Promise<ReviewEntity>;
  findDueForReview(limit: number): Promise<ReviewEntity[]>;
  findAll(): Promise<ReviewEntity[]>;
};
