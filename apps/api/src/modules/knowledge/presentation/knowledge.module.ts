import { Module } from "@nestjs/common";
import { KnowledgeController } from "./knowledge.controller.js";
import { PrismaChunkRepository } from "../infrastructure/prisma-chunk.repository.js";
import { PrismaTagRepository } from "../infrastructure/prisma-tag.repository.js";
import { PrismaNoteRepository } from "../infrastructure/prisma-note.repository.js";
import { PrismaDocumentRepository } from "../../ingestion/infrastructure/prisma-document.repository.js";
import { ListDocumentsUseCase } from "../application/list-documents.use-case.js";
import { ViewDocumentUseCase } from "../application/view-document.use-case.js";
import { AddTagUseCase } from "../application/add-tag.use-case.js";
import { RemoveTagUseCase } from "../application/remove-tag.use-case.js";
import { AddNoteUseCase } from "../application/add-note.use-case.js";
import { UpdateNoteUseCase } from "../application/update-note.use-case.js";
import { UpdateImportanceUseCase } from "../application/update-importance.use-case.js";
import { IngestionModule } from "../../ingestion/presentation/ingestion.module.js";

@Module({
  imports: [IngestionModule],
  controllers: [KnowledgeController],
  providers: [
    PrismaChunkRepository,
    PrismaTagRepository,
    PrismaNoteRepository,
    {
      provide: ListDocumentsUseCase,
      useFactory: (
        docRepo: PrismaDocumentRepository,
        chunkRepo: PrismaChunkRepository
      ) => new ListDocumentsUseCase(docRepo, chunkRepo),
      inject: [PrismaDocumentRepository, PrismaChunkRepository],
    },
    {
      provide: ViewDocumentUseCase,
      useFactory: (
        docRepo: PrismaDocumentRepository,
        chunkRepo: PrismaChunkRepository
      ) => new ViewDocumentUseCase(docRepo, chunkRepo),
      inject: [PrismaDocumentRepository, PrismaChunkRepository],
    },
    {
      provide: AddTagUseCase,
      useFactory: (tagRepo: PrismaTagRepository) =>
        new AddTagUseCase(tagRepo),
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
      useFactory: (chunkRepo: PrismaChunkRepository) =>
        new UpdateImportanceUseCase(chunkRepo),
      inject: [PrismaChunkRepository],
    },
  ],
  exports: [PrismaChunkRepository, PrismaTagRepository],
})
export class KnowledgeModule {}
