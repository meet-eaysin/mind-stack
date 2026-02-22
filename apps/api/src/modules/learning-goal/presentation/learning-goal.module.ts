import { Module } from '@nestjs/common';
import { LearningGoalController } from './learning-goal.controller.js';
import { PrismaLearningGoalRepository } from '../infrastructure/prisma-learning-goal.repository.js';
import { CreateLearningGoalUseCase } from '../application/create-learning-goal.use-case.js';
import { ListLearningGoalsUseCase } from '../application/list-learning-goals.use-case.js';
import { GetLearningGoalUseCase } from '../application/get-learning-goal.use-case.js';
import { UpdateLearningGoalUseCase } from '../application/update-learning-goal.use-case.js';
import { DeleteLearningGoalUseCase } from '../application/delete-learning-goal.use-case.js';
import { AddItemToLearningGoalUseCase } from '../application/add-item-to-learning-goal.use-case.js';
import { RemoveItemFromLearningGoalUseCase } from '../application/remove-item-from-learning-goal.use-case.js';
import { CollectionModule } from '../../collection/presentation/collection.module.js';
import { IngestionModule } from '../../ingestion/presentation/ingestion.module.js';
import { PrismaDocumentRepository } from '../../ingestion/infrastructure/prisma-document.repository.js';
import { PrismaCollectionRepository } from '../../collection/infrastructure/prisma-collection.repository.js';

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
