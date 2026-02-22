import { Module } from '@nestjs/common';
import { CollectionController } from './collection.controller.js';
import { PrismaCollectionRepository } from '../infrastructure/prisma-collection.repository.js';
import { CreateCollectionUseCase } from '../application/create-collection.use-case.js';
import { ListCollectionsUseCase } from '../application/list-collections.use-case.js';
import { GetCollectionUseCase } from '../application/get-collection.use-case.js';
import { UpdateCollectionUseCase } from '../application/update-collection.use-case.js';
import { DeleteCollectionUseCase } from '../application/delete-collection.use-case.js';
import { AddDocumentToCollectionUseCase } from '../application/add-document-to-collection.use-case.js';
import { RemoveDocumentFromCollectionUseCase } from '../application/remove-document-from-collection.use-case.js';
import { ReorderCollectionItemsUseCase } from '../application/reorder-collection-items.use-case.js';
import { IngestionModule } from '../../ingestion/presentation/ingestion.module.js';
import { PrismaDocumentRepository } from '../../ingestion/infrastructure/prisma-document.repository.js';

@Module({
  imports: [IngestionModule],
  controllers: [CollectionController],
  providers: [
    PrismaCollectionRepository,
    {
      provide: CreateCollectionUseCase,
      useFactory: (repo: PrismaCollectionRepository) =>
        new CreateCollectionUseCase(repo),
      inject: [PrismaCollectionRepository],
    },
    {
      provide: ListCollectionsUseCase,
      useFactory: (repo: PrismaCollectionRepository) =>
        new ListCollectionsUseCase(repo),
      inject: [PrismaCollectionRepository],
    },
    {
      provide: GetCollectionUseCase,
      useFactory: (repo: PrismaCollectionRepository) =>
        new GetCollectionUseCase(repo),
      inject: [PrismaCollectionRepository],
    },
    {
      provide: UpdateCollectionUseCase,
      useFactory: (repo: PrismaCollectionRepository) =>
        new UpdateCollectionUseCase(repo),
      inject: [PrismaCollectionRepository],
    },
    {
      provide: DeleteCollectionUseCase,
      useFactory: (repo: PrismaCollectionRepository) =>
        new DeleteCollectionUseCase(repo),
      inject: [PrismaCollectionRepository],
    },
    {
      provide: AddDocumentToCollectionUseCase,
      useFactory: (
        cRepo: PrismaCollectionRepository,
        dRepo: PrismaDocumentRepository,
      ) => new AddDocumentToCollectionUseCase(cRepo, dRepo),
      inject: [PrismaCollectionRepository, PrismaDocumentRepository],
    },
    {
      provide: RemoveDocumentFromCollectionUseCase,
      useFactory: (repo: PrismaCollectionRepository) =>
        new RemoveDocumentFromCollectionUseCase(repo),
      inject: [PrismaCollectionRepository],
    },
    {
      provide: ReorderCollectionItemsUseCase,
      useFactory: (repo: PrismaCollectionRepository) =>
        new ReorderCollectionItemsUseCase(repo),
      inject: [PrismaCollectionRepository],
    },
  ],
  exports: [PrismaCollectionRepository],
})
export class CollectionModule {}
