import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { IngestionController } from '@/modules/ingestion/presentation/ingestion.controller';
import { PrismaDocumentRepository } from '@/modules/ingestion/infrastructure/prisma-document.repository';
import {
  IngestionJobProducer,
  INGESTION_QUEUE,
} from '@/modules/ingestion/infrastructure/ingestion-job.producer';
import { IngestionProcessor } from '@/modules/ingestion/infrastructure/ingestion.processor';
import { IngestUrlUseCase } from '@/modules/ingestion/application/ingest-url.use-case';
import { IngestTextUseCase } from '@/modules/ingestion/application/ingest-text.use-case';
import { IngestPdfUseCase } from '@/modules/ingestion/application/ingest-pdf.use-case';
import { IngestYoutubeUseCase } from '@/modules/ingestion/application/ingest-youtube.use-case';
import { IngestClipUseCase } from '@/modules/ingestion/application/ingest-clip.use-case';
import { RetryIngestionUseCase } from '@/modules/ingestion/application/retry-ingestion.use-case';
import { GetIngestionJobStatusUseCase } from '@/modules/ingestion/application/get-ingestion-job-status.use-case';
import { ClipController } from '@/modules/ingestion/presentation/clip.controller';

import { KnowledgeModule } from '@/modules/knowledge/presentation/knowledge.module';
import { GraphModule } from '@/modules/graph/presentation/graph.module';
import { QueryModule } from '@/modules/query/presentation/query.module';
import { SettingsModule } from '@/modules/settings/presentation/settings.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: INGESTION_QUEUE }),
    forwardRef(() => KnowledgeModule),
    GraphModule,
    QueryModule,
    SettingsModule,
  ],
  controllers: [IngestionController, ClipController],
  providers: [
    PrismaDocumentRepository,
    IngestionJobProducer,
    IngestionProcessor,
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
        config: ConfigService,
      ) =>
        new IngestYoutubeUseCase(repo, producer, {
          youtubeCookie: config.get<string>('YOUTUBE_COOKIE'),
          youtubeProxyUrl: config.get<string>('YOUTUBE_PROXY_URL'),
        }),
      inject: [PrismaDocumentRepository, IngestionJobProducer, ConfigService],
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
  exports: [PrismaDocumentRepository, IngestTextUseCase],
})
export class IngestionModule {}
