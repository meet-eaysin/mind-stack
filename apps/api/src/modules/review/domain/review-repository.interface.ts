export type ReviewEntity = {
  id: string;
  documentId: string;
  lastReviewedAt: Date;
  nextReviewDate: Date;
  interval: number;
  easeFactor: number;
  repetitionCount: number;
  reviewScore: number;
};

export type ReviewRepository = {
  findByDocumentId(documentId: string): Promise<ReviewEntity | null>;
  save(review: ReviewEntity): Promise<ReviewEntity>;
  findDueForReview(limit: number): Promise<ReviewEntity[]>;
  findAll(): Promise<ReviewEntity[]>;
  addLog(documentId: string, feedback: string, chunkId?: string): Promise<void>;
};
