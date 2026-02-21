import { Module, forwardRef } from '@nestjs/common';
import { KnowledgeController } from './knowledge.controller.js';
import { PrismaChunkRepository } from '../infrastructure/prisma-chunk.repository.js';
import { PrismaTagRepository } from '../infrastructure/prisma-tag.repository.js';
import { PrismaNoteRepository } from '../infrastructure/prisma-note.repository.js';
import { PrismaDocumentRepository } from '../../ingestion/infrastructure/prisma-document.repository.js';
import { ListDocumentsUseCase } from '../application/list-documents.use-case.js';
import { ViewDocumentUseCase } from '../application/view-document.use-case.js';
import { AddTagUseCase } from '../application/add-tag.use-case.js';
import { RemoveTagUseCase } from '../application/remove-tag.use-case.js';
import { AddNoteUseCase } from '../application/add-note.use-case.js';
import { UpdateNoteUseCase } from '../application/update-note.use-case.js';
import { UpdateImportanceUseCase } from '../application/update-importance.use-case.js';
import { DeleteDocumentUseCase } from '../application/delete-document.use-case.js';
import { IngestionModule } from '../../ingestion/presentation/ingestion.module.js';
import { VECTOR_STORE } from '../../../common/tokens.js';
import type { VectorStore } from '@repo/vector-store';
import { ChromaVectorStore } from '@repo/vector-store';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [forwardRef(() => IngestionModule), ConfigModule],
  controllers: [KnowledgeController],
  providers: [
    PrismaChunkRepository,
    PrismaTagRepository,
    PrismaNoteRepository,
    {
      provide: VECTOR_STORE,
      useFactory: (config: ConfigService) => {
        return new ChromaVectorStore(
          config.getOrThrow('CHROMA_URL'),
          'mind-stack',
        );
      },
      inject: [ConfigService],
    },
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
      ) => new DeleteDocumentUseCase(docRepo, chunkRepo, vectorStore),
      inject: [PrismaDocumentRepository, PrismaChunkRepository, VECTOR_STORE],
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
  ],
  exports: [PrismaChunkRepository, PrismaTagRepository],
})
export class KnowledgeModule {}
