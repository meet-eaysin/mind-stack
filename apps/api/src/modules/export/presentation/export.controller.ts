import { Controller, Post, Body, Get, Headers } from '@nestjs/common';
import {
  type ExportMarkdownResponse,
  type ExportNotionResponse,
  type ExportCompleteResponse,
  INGESTION_STATUS,
  type IngestionResponse,
} from '@repo/shared-types';
import { ExportMarkdownUseCase } from '@/modules/export/application/export-markdown.use-case';
import { ExportNotionUseCase } from '@/modules/export/application/export-notion.use-case';
import { ExportFullUseCase } from '@/modules/export/application/export-full.use-case';
import { IngestTextUseCase } from '@/modules/ingestion/application/ingest-text.use-case';
import { ExportChunksDto, NotionImportDto } from '@/modules/export/presentation/export.dtos';
import { getUserIdFromHeader } from '@/common/request-user';

@Controller('export')
export class ExportController {
  constructor(
    private readonly exportMarkdown: ExportMarkdownUseCase,
    private readonly exportNotion: ExportNotionUseCase,
    private readonly exportFull: ExportFullUseCase,
    private readonly ingestText: IngestTextUseCase,
  ) {}

  @Post('markdown')
  async toMarkdown(
    @Body() dto: ExportChunksDto,
  ): Promise<ExportMarkdownResponse> {
    const markdown = await this.exportMarkdown.execute(dto.chunkIds);
    return { markdown };
  }

  @Post('notion')
  async toNotion(@Body() dto: ExportChunksDto): Promise<ExportNotionResponse> {
    const payload = await this.exportNotion.execute(dto.chunkIds);
    return { payload };
  }

  @Get('full')
  async fullExport(): Promise<ExportCompleteResponse> {
    return this.exportFull.execute();
  }

  @Post('import')
  async fromNotionImport(
    @Body() dto: NotionImportDto,
    @Headers('x-user-id') userId?: string,
  ): Promise<IngestionResponse> {
    const result = await this.ingestText.execute({
      title: dto.title,
      content: dto.content,
      userId: getUserIdFromHeader(userId),
    });

    return {
      documentId: result.documentId,
      jobId: result.jobId,
      status: INGESTION_STATUS.INGESTED,
      message: 'Notion content ingestion started',
    };
  }
}
