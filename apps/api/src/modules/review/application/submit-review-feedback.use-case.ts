import type { ReviewRepository } from "../domain/review-repository.interface.js";

export class SubmitReviewFeedbackUseCase {
  constructor(private readonly reviewRepository: ReviewRepository) {}

  async execute(input: {
    chunkId: string;
    score: number;
  }): Promise<void> {
    if (input.score < 0 || input.score > 5) {
      throw new Error("Review score must be between 0 and 5");
    }
    await this.reviewRepository.upsert(input.chunkId, input.score);
  }
}
