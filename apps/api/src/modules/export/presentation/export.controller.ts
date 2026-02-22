import { Controller, Post, Body, Get } from '@nestjs/common';
import {
  type ExportMarkdownResponse,
  type ExportNotionResponse,
  type ExportCompleteResponse,
  INGESTION_STATUS,
  type IngestionResponse,
} from '@repo/shared-types';
import { ExportMarkdownUseCase } from '../application/export-markdown.use-case.js';
import { ExportNotionUseCase } from '../application/export-notion.use-case.js';
import { ExportFullUseCase } from '../application/export-full.use-case.js';
import { ExportChunksDto, NotionImportDto } from './export.dtos.js';

@Controller('export')
export class ExportController {
  constructor(
    private readonly exportMarkdown: ExportMarkdownUseCase,
    private readonly exportNotion: ExportNotionUseCase,
    private readonly exportFull: ExportFullUseCase,
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
    @Body() _dto: NotionImportDto,
  ): Promise<IngestionResponse> {
    // Stub implementation for Notion tool import
    return {
      documentId: 'stub-notion-import-id',
      status: INGESTION_STATUS.READY,
      message: 'Notion data imported successfully (stub)',
    };
  }
}
