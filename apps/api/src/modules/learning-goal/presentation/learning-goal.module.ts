import { Module } from '@nestjs/common';
import { LearningGoalController } from '@/modules/learning-goal/presentation/learning-goal.controller';
import { PrismaLearningGoalRepository } from '@/modules/learning-goal/infrastructure/prisma-learning-goal.repository';
import { CreateLearningGoalUseCase } from '@/modules/learning-goal/application/create-learning-goal.use-case';
import { ListLearningGoalsUseCase } from '@/modules/learning-goal/application/list-learning-goals.use-case';
import { GetLearningGoalUseCase } from '@/modules/learning-goal/application/get-learning-goal.use-case';
import { UpdateLearningGoalUseCase } from '@/modules/learning-goal/application/update-learning-goal.use-case';
import { DeleteLearningGoalUseCase } from '@/modules/learning-goal/application/delete-learning-goal.use-case';
import { AddItemToLearningGoalUseCase } from '@/modules/learning-goal/application/add-item-to-learning-goal.use-case';
import { RemoveItemFromLearningGoalUseCase } from '@/modules/learning-goal/application/remove-item-from-learning-goal.use-case';
import { CollectionModule } from '@/modules/collection/presentation/collection.module';
import { IngestionModule } from '@/modules/ingestion/presentation/ingestion.module';
import { PrismaDocumentRepository } from '@/modules/ingestion/infrastructure/prisma-document.repository';
import { PrismaCollectionRepository } from '@/modules/collection/infrastructure/prisma-collection.repository';

@Module({
  imports: [CollectionModule, IngestionModule],
  controllers: [LearningGoalController],
  providers: [
    PrismaLearningGoalRepository,
    {
      provide: CreateLearningGoalUseCase,
      useFactory: (repo: PrismaLearningGoalRepository) =>
        new CreateLearningGoalUseCase(repo),
      inject: [PrismaLearningGoalRepository],
    },
    {
      provide: ListLearningGoalsUseCase,
      useFactory: (repo: PrismaLearningGoalRepository) =>
        new ListLearningGoalsUseCase(repo),
      inject: [PrismaLearningGoalRepository],
    },
    {
      provide: GetLearningGoalUseCase,
      useFactory: (repo: PrismaLearningGoalRepository) =>
        new GetLearningGoalUseCase(repo),
      inject: [PrismaLearningGoalRepository],
    },
    {
      provide: UpdateLearningGoalUseCase,
      useFactory: (repo: PrismaLearningGoalRepository) =>
        new UpdateLearningGoalUseCase(repo),
      inject: [PrismaLearningGoalRepository],
    },
    {
      provide: DeleteLearningGoalUseCase,
      useFactory: (repo: PrismaLearningGoalRepository) =>
        new DeleteLearningGoalUseCase(repo),
      inject: [PrismaLearningGoalRepository],
    },
    {
      provide: AddItemToLearningGoalUseCase,
      useFactory: (
        gRepo: PrismaLearningGoalRepository,
        cRepo: PrismaCollectionRepository,
        dRepo: PrismaDocumentRepository,
      ) => new AddItemToLearningGoalUseCase(gRepo, cRepo, dRepo),
      inject: [
        PrismaLearningGoalRepository,
        PrismaCollectionRepository,
        PrismaDocumentRepository,
      ],
    },
    {
      provide: RemoveItemFromLearningGoalUseCase,
      useFactory: (repo: PrismaLearningGoalRepository) =>
        new RemoveItemFromLearningGoalUseCase(repo),
      inject: [PrismaLearningGoalRepository],
    },
  ],
})
export class LearningGoalModule {}
