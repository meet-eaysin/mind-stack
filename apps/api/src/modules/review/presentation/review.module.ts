import { Module } from '@nestjs/common';
import { ReviewController } from './review.controller.js';
import { PrismaReviewRepository } from '../infrastructure/prisma-review.repository.js';
import { PrismaDocumentRepository } from '../../ingestion/infrastructure/prisma-document.repository.js';
import { GenerateDailyReviewUseCase } from '../application/generate-daily-review.use-case.js';
import { SubmitReviewFeedbackUseCase } from '../application/submit-review-feedback.use-case.js';
import { UpdateReviewScoreUseCase } from '../application/update-review-score.use-case.js';
import { IngestionModule } from '../../ingestion/presentation/ingestion.module.js';

@Module({
  imports: [IngestionModule],
  controllers: [ReviewController],
  providers: [
    PrismaReviewRepository,
    {
      provide: GenerateDailyReviewUseCase,
      useFactory: (
        reviewRepo: PrismaReviewRepository,
        docRepo: PrismaDocumentRepository,
      ) => new GenerateDailyReviewUseCase(reviewRepo, docRepo),
      inject: [PrismaReviewRepository, PrismaDocumentRepository],
    },
    {
      provide: SubmitReviewFeedbackUseCase,
      useFactory: (repo: PrismaReviewRepository) =>
        new SubmitReviewFeedbackUseCase(repo),
      inject: [PrismaReviewRepository],
    },
    {
      provide: UpdateReviewScoreUseCase,
      useFactory: (repo: PrismaReviewRepository) =>
        new UpdateReviewScoreUseCase(repo),
      inject: [PrismaReviewRepository],
    },
  ],
})
export class ReviewModule {}
