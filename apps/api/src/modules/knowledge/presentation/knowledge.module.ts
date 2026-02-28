import { Module, forwardRef } from '@nestjs/common';
import { KnowledgeController } from '@/modules/knowledge/presentation/knowledge.controller';
import { PrismaChunkRepository } from '@/modules/knowledge/infrastructure/prisma-chunk.repository';
import { PrismaTagRepository } from '@/modules/knowledge/infrastructure/prisma-tag.repository';
import { PrismaNoteRepository } from '@/modules/knowledge/infrastructure/prisma-note.repository';
import { PrismaDocumentRepository } from '@/modules/ingestion/infrastructure/prisma-document.repository';
import { PrismaConceptRepository } from '@/modules/graph/infrastructure/prisma-concept.repository';
import { ListDocumentsUseCase } from '@/modules/knowledge/application/list-documents.use-case';
import { ViewDocumentUseCase } from '@/modules/knowledge/application/view-document.use-case';
import { GetRelatedSuggestionsUseCase } from '@/modules/knowledge/application/get-related-suggestions.use-case';
import { AddTagUseCase } from '@/modules/knowledge/application/add-tag.use-case';
import { RemoveTagUseCase } from '@/modules/knowledge/application/remove-tag.use-case';
import { AddNoteUseCase } from '@/modules/knowledge/application/add-note.use-case';
import { UpdateNoteUseCase } from '@/modules/knowledge/application/update-note.use-case';
import { UpdateImportanceUseCase } from '@/modules/knowledge/application/update-importance.use-case';
import { DeleteDocumentUseCase } from '@/modules/knowledge/application/delete-document.use-case';
import { UpdateDocumentUseCase } from '@/modules/knowledge/application/update-document.use-case';
import { IngestionModule } from '@/modules/ingestion/presentation/ingestion.module';
import { QueryModule } from '@/modules/query/presentation/query.module';
import { PrismaQueryRepository } from '@/modules/query/infrastructure/prisma-query.repository';
import { VECTOR_STORE } from '@/common/tokens';
import type { VectorStore } from '@repo/vector-store';
import { ConfigModule } from '@nestjs/config';
import { VectorModule } from '@/common/vector.module';
import { SettingsModule } from '@/modules/settings/presentation/settings.module';
import { LlmProviderFactory } from '@/modules/settings/application/llm-provider.factory';

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
