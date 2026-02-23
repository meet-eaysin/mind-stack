import { Module, forwardRef } from '@nestjs/common';
import { KnowledgeController } from './knowledge.controller.js';
import { PrismaChunkRepository } from '../infrastructure/prisma-chunk.repository.js';
import { PrismaTagRepository } from '../infrastructure/prisma-tag.repository.js';
import { PrismaNoteRepository } from '../infrastructure/prisma-note.repository.js';
import { PrismaDocumentRepository } from '../../ingestion/infrastructure/prisma-document.repository.js';
import { PrismaConceptRepository } from '../../graph/infrastructure/prisma-concept.repository.js';
import { ListDocumentsUseCase } from '../application/list-documents.use-case.js';
import { ViewDocumentUseCase } from '../application/view-document.use-case.js';
import { GetRelatedSuggestionsUseCase } from '../application/get-related-suggestions.use-case.js';
import { AddTagUseCase } from '../application/add-tag.use-case.js';
import { RemoveTagUseCase } from '../application/remove-tag.use-case.js';
import { AddNoteUseCase } from '../application/add-note.use-case.js';
import { UpdateNoteUseCase } from '../application/update-note.use-case.js';
import { UpdateImportanceUseCase } from '../application/update-importance.use-case.js';
import { DeleteDocumentUseCase } from '../application/delete-document.use-case.js';
import { UpdateDocumentUseCase } from '../application/update-document.use-case.js';
import { IngestionModule } from '../../ingestion/presentation/ingestion.module.js';
import { QueryModule } from '../../query/presentation/query.module.js';
import { PrismaQueryRepository } from '../../query/infrastructure/prisma-query.repository.js';
import { VECTOR_STORE } from '../../../common/tokens.js';
import type { VectorStore } from '@repo/vector-store';
import { ConfigModule } from '@nestjs/config';
import { VectorModule } from '../../../common/vector.module.js';
import { SettingsModule } from '../../settings/presentation/settings.module.js';
import { LlmProviderFactory } from '../../settings/application/llm-provider.factory.js';

@Module({
  imports: [
    forwardRef(() => IngestionModule),
    ConfigModule,
    forwardRef(() => QueryModule),
    VectorModule,
    SettingsModule,
  ],
  controllers: [KnowledgeController],
  providers: [
    PrismaChunkRepository,
    PrismaTagRepository,
    PrismaNoteRepository,
    PrismaConceptRepository,
    {
      provide: ListDocumentsUseCase,
      useFactory: (
        docRepo: PrismaDocumentRepository,
        chunkRepo: PrismaChunkRepository,
      ) => new ListDocumentsUseCase(docRepo, chunkRepo),
      inject: [PrismaDocumentRepository, PrismaChunkRepository],
    },
    {
      provide: ViewDocumentUseCase,
      useFactory: (
        docRepo: PrismaDocumentRepository,
        chunkRepo: PrismaChunkRepository,
        tagRepo: PrismaTagRepository,
        noteRepo: PrismaNoteRepository,
      ) => new ViewDocumentUseCase(docRepo, chunkRepo, tagRepo, noteRepo),
      inject: [
        PrismaDocumentRepository,
        PrismaChunkRepository,
        PrismaTagRepository,
        PrismaNoteRepository,
      ],
    },
    {
      provide: DeleteDocumentUseCase,
      useFactory: (
        docRepo: PrismaDocumentRepository,
        chunkRepo: PrismaChunkRepository,
        vectorStore: VectorStore,
        conceptRepo: PrismaConceptRepository,
      ) =>
        new DeleteDocumentUseCase(docRepo, chunkRepo, vectorStore, conceptRepo),
      inject: [
        PrismaDocumentRepository,
        PrismaChunkRepository,
        VECTOR_STORE,
        PrismaConceptRepository,
      ],
    },
    {
      provide: AddTagUseCase,
      useFactory: (tagRepo: PrismaTagRepository) => new AddTagUseCase(tagRepo),
      inject: [PrismaTagRepository],
    },
    {
      provide: RemoveTagUseCase,
      useFactory: (tagRepo: PrismaTagRepository) =>
        new RemoveTagUseCase(tagRepo),
      inject: [PrismaTagRepository],
    },
    {
      provide: AddNoteUseCase,
      useFactory: (noteRepo: PrismaNoteRepository) =>
        new AddNoteUseCase(noteRepo),
      inject: [PrismaNoteRepository],
    },
    {
      provide: UpdateNoteUseCase,
      useFactory: (noteRepo: PrismaNoteRepository) =>
        new UpdateNoteUseCase(noteRepo),
      inject: [PrismaNoteRepository],
    },
    {
      provide: UpdateImportanceUseCase,
      useFactory: (docRepo: PrismaDocumentRepository) =>
        new UpdateImportanceUseCase(docRepo),
      inject: [PrismaDocumentRepository],
    },
    {
      provide: UpdateDocumentUseCase,
      useFactory: (docRepo: PrismaDocumentRepository) =>
        new UpdateDocumentUseCase(docRepo),
      inject: [PrismaDocumentRepository],
    },
    {
      provide: GetRelatedSuggestionsUseCase,
      useFactory: (
        vectorStore: VectorStore,
        queryRepo: PrismaQueryRepository,
        chunkRepo: PrismaChunkRepository,
        providerFactory: LlmProviderFactory,
      ) =>
        new GetRelatedSuggestionsUseCase(
          providerFactory,
          vectorStore,
          queryRepo,
          chunkRepo,
        ),
      inject: [
        VECTOR_STORE,
        PrismaQueryRepository,
        PrismaChunkRepository,
        LlmProviderFactory,
      ],
    },
  ],
  exports: [PrismaChunkRepository, PrismaTagRepository],
})
export class KnowledgeModule {}
