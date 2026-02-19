import { Module } from '@nestjs/common';
import { ReviewController } from './review.controller.js';
import { PrismaReviewRepository } from '../infrastructure/prisma-review.repository.js';
import { PrismaQueryRepository } from '../../query/infrastructure/prisma-query.repository.js';
import { GenerateDailyReviewUseCase } from '../application/generate-daily-review.use-case.js';
import { SubmitReviewFeedbackUseCase } from '../application/submit-review-feedback.use-case.js';
import { UpdateReviewScoreUseCase } from '../application/update-review-score.use-case.js';
import { QueryModule } from '../../query/presentation/query.module.js';

@Module({
  imports: [QueryModule],
  controllers: [ReviewController],
  providers: [
    PrismaReviewRepository,
    PrismaQueryRepository,
    {
      provide: GenerateDailyReviewUseCase,
      useFactory: (
        reviewRepo: PrismaReviewRepository,
        queryRepo: PrismaQueryRepository,
      ) => new GenerateDailyReviewUseCase(reviewRepo, queryRepo),
      inject: [PrismaReviewRepository, PrismaQueryRepository],
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
