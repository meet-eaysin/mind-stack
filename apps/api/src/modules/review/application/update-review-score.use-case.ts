import type { ReviewRepository } from '../domain/review-repository.interface.js';

export class UpdateReviewScoreUseCase {
  constructor(private readonly reviewRepository: ReviewRepository) {}

  async execute(input: { chunkId: string; score: number }): Promise<void> {
    const existing = await this.reviewRepository.findByChunkId(input.chunkId);
    if (!existing) {
      throw new Error(`No review found for chunk: ${input.chunkId}`);
    }
    await this.reviewRepository.upsert(input.chunkId, input.score);
  }
}
