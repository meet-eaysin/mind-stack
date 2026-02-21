import { Module } from '@nestjs/common';
import { ReviewController } from './review.controller.js';
import { PrismaReviewRepository } from '../infrastructure/prisma-review.repository.js';
import { PrismaDocumentRepository } from '../../ingestion/infrastructure/prisma-document.repository.js';
import { GenerateDailyReviewUseCase } from '../application/generate-daily-review.use-case.js';
import { SubmitReviewFeedbackUseCase } from '../application/submit-review-feedback.use-case.js';
import { IngestionModule } from '../../ingestion/presentation/ingestion.module.js';
import { KnowledgeModule } from '../../knowledge/presentation/knowledge.module.js';
import { PrismaTagRepository } from '../../knowledge/infrastructure/prisma-tag.repository.js';

@Module({
  imports: [IngestionModule, KnowledgeModule],
  controllers: [ReviewController],
  providers: [
    PrismaReviewRepository,
    {
      provide: GenerateDailyReviewUseCase,
      useFactory: (
        reviewRepo: PrismaReviewRepository,
        docRepo: PrismaDocumentRepository,
        tagRepo: PrismaTagRepository,
      ) => new GenerateDailyReviewUseCase(reviewRepo, docRepo, tagRepo),
      inject: [
        PrismaReviewRepository,
        PrismaDocumentRepository,
        PrismaTagRepository,
      ],
    },
    {
      provide: SubmitReviewFeedbackUseCase,
      useFactory: (repo: PrismaReviewRepository) =>
        new SubmitReviewFeedbackUseCase(repo),
      inject: [PrismaReviewRepository],
    },
  ],
})
export class ReviewModule {}
