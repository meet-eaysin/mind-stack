import { Module } from '@nestjs/common';
import { ExportController } from './export.controller.js';
import { PrismaQueryRepository } from '../../query/infrastructure/prisma-query.repository.js';
import { ExportMarkdownUseCase } from '../application/export-markdown.use-case.js';
import { ExportNotionUseCase } from '../application/export-notion.use-case.js';
import { QueryModule } from '../../query/presentation/query.module.js';

@Module({
  imports: [QueryModule],
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
  ],
})
export class ExportModule {}
