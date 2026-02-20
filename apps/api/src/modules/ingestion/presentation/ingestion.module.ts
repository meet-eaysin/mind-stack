import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { IngestionController } from './ingestion.controller.js';
import { PrismaDocumentRepository } from '../infrastructure/prisma-document.repository.js';
import {
  IngestionJobProducer,
  INGESTION_QUEUE,
} from '../infrastructure/ingestion-job.producer.js';
import { IngestUrlUseCase } from '../application/ingest-url.use-case.js';
import { IngestTextUseCase } from '../application/ingest-text.use-case.js';
import { IngestPdfUseCase } from '../application/ingest-pdf.use-case.js';
import { IngestYoutubeUseCase } from '../application/ingest-youtube.use-case.js';
import { RetryIngestionUseCase } from '../application/retry-ingestion.use-case.js';

import { ChunkingProcessor } from '../infrastructure/processors/chunking.processor.js';
import { EmbeddingProcessor } from '../infrastructure/processors/embedding.processor.js';
import { ConceptExtractionProcessor } from '../infrastructure/processors/concept-extraction.processor.js';

import { KnowledgeModule } from '../../knowledge/presentation/knowledge.module.js';
import { GraphModule } from '../../graph/presentation/graph.module.js';
import { QueryModule } from '../../query/presentation/query.module.js';

@Module({
  imports: [
    BullModule.registerQueue({ name: INGESTION_QUEUE }),
    forwardRef(() => KnowledgeModule),
    GraphModule,
    QueryModule,
  ],
  controllers: [IngestionController],
  providers: [
    PrismaDocumentRepository,
    IngestionJobProducer,
    ChunkingProcessor,
    EmbeddingProcessor,
    ConceptExtractionProcessor,
    {
      provide: IngestUrlUseCase,
      useFactory: (
        repo: PrismaDocumentRepository,
        producer: IngestionJobProducer,
      ) => new IngestUrlUseCase(repo, producer),
      inject: [PrismaDocumentRepository, IngestionJobProducer],
    },
    {
      provide: IngestTextUseCase,
      useFactory: (
        repo: PrismaDocumentRepository,
        producer: IngestionJobProducer,
      ) => new IngestTextUseCase(repo, producer),
      inject: [PrismaDocumentRepository, IngestionJobProducer],
    },
    {
      provide: IngestPdfUseCase,
      useFactory: (
        repo: PrismaDocumentRepository,
        producer: IngestionJobProducer,
      ) => new IngestPdfUseCase(repo, producer),
      inject: [PrismaDocumentRepository, IngestionJobProducer],
    },
    {
      provide: IngestYoutubeUseCase,
      useFactory: (
        repo: PrismaDocumentRepository,
        producer: IngestionJobProducer,
      ) => new IngestYoutubeUseCase(repo, producer),
      inject: [PrismaDocumentRepository, IngestionJobProducer],
    },
    {
      provide: RetryIngestionUseCase,
      useFactory: (
        repo: PrismaDocumentRepository,
        producer: IngestionJobProducer,
      ) => new RetryIngestionUseCase(repo, producer),
      inject: [PrismaDocumentRepository, IngestionJobProducer],
    },
  ],
  exports: [PrismaDocumentRepository],
})
export class IngestionModule {}
