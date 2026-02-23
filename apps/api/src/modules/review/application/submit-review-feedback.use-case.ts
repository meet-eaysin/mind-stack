import { randomUUID } from 'node:crypto';
import type {
  ReviewRepository,
  ReviewEntity,
} from '../domain/review-repository.interface';
import { BadRequestException } from '@nestjs/common';

export class SubmitReviewFeedbackUseCase {
  constructor(private readonly reviewRepository: ReviewRepository) {}

  async execute(input: {
    documentId: string;
    score: number;
    chunkId?: string;
  }): Promise<void> {
    if (input.score < 0 || input.score > 5) {
      throw new BadRequestException('Review score must be between 0 and 5');
    }

    const existingReview = await this.reviewRepository.findByDocumentId(
      input.documentId,
    );

    let review: ReviewEntity;

    if (!existingReview) {
      // First time review
      const initialInterval = input.score >= 3 ? 1 : 0;
      const initialRepetitionCount = input.score >= 3 ? 1 : 0;
      const initialEaseFactor = 2.5;

      review = {
        id: randomUUID(),
        documentId: input.documentId,
        lastReviewedAt: new Date(),
        nextReviewDate: this.calculateNextReviewDate(initialInterval),
        interval: initialInterval,
        easeFactor: initialEaseFactor,
        repetitionCount: initialRepetitionCount,
        reviewScore: input.score,
      };
    } else {
      // Update existing review using SM-2
      const prevEF = existingReview.easeFactor;
      const prevInterval = existingReview.interval;
      const prevRepCount = existingReview.repetitionCount;

      let nextInterval: number;
      let nextEF: number;
      let nextRepCount: number;

      if (input.score >= 3) {
        // Correct response
        if (prevRepCount === 0) {
          nextInterval = 1;
        } else if (prevRepCount === 1) {
          nextInterval = 6;
        } else {
          nextInterval = Math.round(prevInterval * prevEF);
        }
        nextRepCount = prevRepCount + 1;
        // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        nextEF =
          prevEF +
          (0.1 - (5 - input.score) * (0.08 + (5 - input.score) * 0.02));
      } else {
        // Incorrect response
        nextInterval = 1;
        nextRepCount = 0;
        nextEF = prevEF; // or slightly decrease? Let's stay with prevEF for now as per standard SM-2 reset
      }

      if (nextEF < 1.3) nextEF = 1.3;

      review = {
        ...existingReview,
        lastReviewedAt: new Date(),
        nextReviewDate: this.calculateNextReviewDate(nextInterval),
        interval: nextInterval,
        easeFactor: nextEF,
        repetitionCount: nextRepCount,
        reviewScore: input.score,
      };
    }

    await this.reviewRepository.save(review);

    // Map numeric score to feedback string for logs
    const feedbackMap: Record<number, string> = {
      0: 'BLACKOUT',
      1: 'INCORRECT',
      2: 'RECALL_FAILED',
      3: 'DIFFICULT',
      4: 'GOOD',
      5: 'EASY',
    };
    const feedback = feedbackMap[input.score] || 'MANUAL';

    await this.reviewRepository.addLog(
      input.documentId,
      feedback,
      input.chunkId,
    );
  }

  private calculateNextReviewDate(intervalDays: number): Date {
    const nextDate = new Date();
    // Use Math.max(1, ...) to ensure we don't schedule for today if interval is small
    // But for SM-2, interval=1 means tomorrow.
    nextDate.setDate(nextDate.getDate() + intervalDays);
    return nextDate;
  }
}
