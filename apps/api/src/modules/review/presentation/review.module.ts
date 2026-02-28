import { Module } from '@nestjs/common';
import { ReviewController } from '@/modules/review/presentation/review.controller';
import { PrismaReviewRepository } from '@/modules/review/infrastructure/prisma-review.repository';
import { PrismaDocumentRepository } from '@/modules/ingestion/infrastructure/prisma-document.repository';
import { GenerateDailyReviewUseCase } from '@/modules/review/application/generate-daily-review.use-case';
import { SubmitReviewFeedbackUseCase } from '@/modules/review/application/submit-review-feedback.use-case';
import { IngestionModule } from '@/modules/ingestion/presentation/ingestion.module';
import { KnowledgeModule } from '@/modules/knowledge/presentation/knowledge.module';
import { PrismaTagRepository } from '@/modules/knowledge/infrastructure/prisma-tag.repository';

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
