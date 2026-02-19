import { Controller, Post, Body } from '@nestjs/common';
import type {
  ExportMarkdownResponse,
  ExportNotionResponse,
} from '@repo/shared-types';
import { ExportMarkdownUseCase } from '../application/export-markdown.use-case.js';
import { ExportNotionUseCase } from '../application/export-notion.use-case.js';
import { ExportChunksDto } from './export.dtos.js';

@Controller('export')
export class ExportController {
  constructor(
    private readonly exportMarkdown: ExportMarkdownUseCase,
    private readonly exportNotion: ExportNotionUseCase,
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
}
