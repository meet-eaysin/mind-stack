import type { ReviewRepository } from '../domain/review-repository.interface.js';

export class UpdateReviewScoreUseCase {
  constructor(private readonly reviewRepository: ReviewRepository) {}

  async execute(input: { documentId: string; score: number }): Promise<void> {
    const existing = await this.reviewRepository.findByDocumentId(
      input.documentId,
    );
    if (!existing) {
      throw new Error(`No review found for document: ${input.documentId}`);
    }
    await this.reviewRepository.upsert(input.documentId, input.score);
  }
}
