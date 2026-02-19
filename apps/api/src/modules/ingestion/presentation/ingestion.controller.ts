import { Controller, Post, Body, Param } from '@nestjs/common';
import type { IngestionResponse } from '@repo/shared-types';
import { IngestUrlUseCase } from '../application/ingest-url.use-case.js';
import { IngestTextUseCase } from '../application/ingest-text.use-case.js';
import { IngestPdfUseCase } from '../application/ingest-pdf.use-case.js';
import { IngestYoutubeUseCase } from '../application/ingest-youtube.use-case.js';
import { RetryIngestionUseCase } from '../application/retry-ingestion.use-case.js';
import {
  IngestUrlDto,
  IngestTextDto,
  IngestPdfDto,
  IngestYoutubeDto,
} from './ingestion.dtos.js';

@Controller('ingest')
export class IngestionController {
  constructor(
    private readonly ingestUrl: IngestUrlUseCase,
    private readonly ingestText: IngestTextUseCase,
    private readonly ingestPdf: IngestPdfUseCase,
    private readonly ingestYoutube: IngestYoutubeUseCase,
    private readonly retryIngestion: RetryIngestionUseCase,
  ) {}

  @Post('url')
  async ingestFromUrl(@Body() dto: IngestUrlDto): Promise<IngestionResponse> {
    const result = await this.ingestUrl.execute(dto);
    return {
      documentId: result.documentId,
      status: 'PENDING',
      message: 'Document ingestion started',
    };
  }

  @Post('text')
  async ingestFromText(@Body() dto: IngestTextDto): Promise<IngestionResponse> {
    const result = await this.ingestText.execute(dto);
    return {
      documentId: result.documentId,
      status: 'PENDING',
      message: 'Text ingestion started',
    };
  }

  @Post('pdf')
  async ingestFromPdf(@Body() dto: IngestPdfDto): Promise<IngestionResponse> {
    const result = await this.ingestPdf.execute(dto);
    return {
      documentId: result.documentId,
      status: 'PENDING',
      message: 'PDF ingestion started',
    };
  }

  @Post('youtube')
  async ingestFromYoutube(
    @Body() dto: IngestYoutubeDto,
  ): Promise<IngestionResponse> {
    const result = await this.ingestYoutube.execute(dto);
    return {
      documentId: result.documentId,
      status: 'PENDING',
      message: 'YouTube transcript ingestion started',
    };
  }

  @Post('retry/:documentId')
  async retry(
    @Param('documentId') documentId: string,
  ): Promise<IngestionResponse> {
    await this.retryIngestion.execute(documentId);
    return {
      documentId,
      status: 'PENDING',
      message: 'Ingestion retry started',
    };
  }
}
