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
import { IngestClipUseCase } from '../application/ingest-clip.use-case.js';
import { RetryIngestionUseCase } from '../application/retry-ingestion.use-case.js';
import { GetIngestionJobStatusUseCase } from '../application/get-ingestion-job-status.use-case.js';
import { ClipController } from './clip.controller.js';

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
  controllers: [IngestionController, ClipController],
  providers: [
    PrismaDocumentRepository,
    IngestionJobProducer,
    {
      provide: GetIngestionJobStatusUseCase,
      useFactory: (producer: IngestionJobProducer) =>
        new GetIngestionJobStatusUseCase(producer),
      inject: [IngestionJobProducer],
    },
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
    {
      provide: IngestClipUseCase,
      useFactory: (ingestText: IngestTextUseCase) =>
        new IngestClipUseCase(ingestText),
      inject: [IngestTextUseCase],
    },
  ],
  exports: [PrismaDocumentRepository],
})
export class IngestionModule {}
