import { Module } from '@nestjs/common';
import { ExportController } from './export.controller.js';
import { PrismaQueryRepository } from '../../query/infrastructure/prisma-query.repository.js';
import { ExportMarkdownUseCase } from '../application/export-markdown.use-case.js';
import { ExportNotionUseCase } from '../application/export-notion.use-case.js';
import { QueryModule } from '../../query/presentation/query.module.js';
import { ExportFullUseCase } from '../application/export-full.use-case.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { IngestionModule } from '../../ingestion/presentation/ingestion.module.js';

@Module({
  imports: [QueryModule, IngestionModule],
  controllers: [ExportController],
  providers: [
    PrismaQueryRepository,
    {
      provide: ExportMarkdownUseCase,
      useFactory: (queryRepo: PrismaQueryRepository) =>
        new ExportMarkdownUseCase(queryRepo),
      inject: [PrismaQueryRepository],
    },
    {
      provide: ExportNotionUseCase,
      useFactory: (queryRepo: PrismaQueryRepository) =>
        new ExportNotionUseCase(queryRepo),
      inject: [PrismaQueryRepository],
    },
    {
      provide: ExportFullUseCase,
      useFactory: (prisma: PrismaService) => new ExportFullUseCase(prisma),
      inject: [PrismaService],
    },
  ],
})
export class ExportModule {}
