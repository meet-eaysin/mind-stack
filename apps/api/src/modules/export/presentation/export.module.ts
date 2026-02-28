import { Module } from '@nestjs/common';
import { ExportController } from '@/modules/export/presentation/export.controller';
import { PrismaQueryRepository } from '@/modules/query/infrastructure/prisma-query.repository';
import { ExportMarkdownUseCase } from '@/modules/export/application/export-markdown.use-case';
import { ExportNotionUseCase } from '@/modules/export/application/export-notion.use-case';
import { QueryModule } from '@/modules/query/presentation/query.module';
import { ExportFullUseCase } from '@/modules/export/application/export-full.use-case';
import { PrismaService } from '@/prisma/prisma.service';
import { IngestionModule } from '@/modules/ingestion/presentation/ingestion.module';

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
