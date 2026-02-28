import { Module } from '@nestjs/common';
import { CollectionController } from '@/modules/collection/presentation/collection.controller';
import { PrismaCollectionRepository } from '@/modules/collection/infrastructure/prisma-collection.repository';
import { CreateCollectionUseCase } from '@/modules/collection/application/create-collection.use-case';
import { ListCollectionsUseCase } from '@/modules/collection/application/list-collections.use-case';
import { GetCollectionUseCase } from '@/modules/collection/application/get-collection.use-case';
import { UpdateCollectionUseCase } from '@/modules/collection/application/update-collection.use-case';
import { DeleteCollectionUseCase } from '@/modules/collection/application/delete-collection.use-case';
import { AddDocumentToCollectionUseCase } from '@/modules/collection/application/add-document-to-collection.use-case';
import { RemoveDocumentFromCollectionUseCase } from '@/modules/collection/application/remove-document-from-collection.use-case';
import { ReorderCollectionItemsUseCase } from '@/modules/collection/application/reorder-collection-items.use-case';
import { IngestionModule } from '@/modules/ingestion/presentation/ingestion.module';
import { PrismaDocumentRepository } from '@/modules/ingestion/infrastructure/prisma-document.repository';

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
