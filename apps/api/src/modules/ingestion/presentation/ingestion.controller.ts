import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { type IngestionResponse, INGESTION_STATUS } from '@repo/shared-types';
import { IngestUrlUseCase } from '../application/ingest-url.use-case.js';
import { IngestTextUseCase } from '../application/ingest-text.use-case.js';
import { IngestPdfUseCase } from '../application/ingest-pdf.use-case.js';
import { IngestYoutubeUseCase } from '../application/ingest-youtube.use-case.js';
import { RetryIngestionUseCase } from '../application/retry-ingestion.use-case.js';
import { GetIngestionJobStatusUseCase } from '../application/get-ingestion-job-status.use-case.js';
import { PrismaDocumentRepository } from '../infrastructure/prisma-document.repository.js';
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
    private readonly getJobStatus: GetIngestionJobStatusUseCase,
    private readonly documentRepository: PrismaDocumentRepository,
  ) {}

  @Post('url')
  async ingestFromUrl(@Body() dto: IngestUrlDto): Promise<IngestionResponse> {
    const result = await this.ingestUrl.execute(dto);
    return {
      documentId: result.documentId,
      jobId: result.jobId,
      status: INGESTION_STATUS.INGESTED,
      message: 'Document ingestion started',
    };
  }

  @Post('text')
  async ingestFromText(@Body() dto: IngestTextDto): Promise<IngestionResponse> {
    const result = await this.ingestText.execute(dto);
    return {
      documentId: result.documentId,
      jobId: result.jobId,
      status: INGESTION_STATUS.INGESTED,
      message: 'Text ingestion started',
    };
  }

  @Post('pdf')
  async ingestFromPdf(@Body() dto: IngestPdfDto): Promise<IngestionResponse> {
    const result = await this.ingestPdf.execute(dto);
    return {
      documentId: result.documentId,
      jobId: result.jobId,
      status: INGESTION_STATUS.INGESTED,
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
      jobId: result.jobId,
      status: INGESTION_STATUS.INGESTED,
      message: 'YouTube transcript ingestion started',
    };
  }

  @Post('retry/:documentId')
  async retry(
    @Param('documentId') documentId: string,
  ): Promise<IngestionResponse> {
    const result = await this.retryIngestion.execute(documentId);
    return {
      documentId,
      jobId: result.jobId,
      status: INGESTION_STATUS.INGESTED,
      message: 'Ingestion retry started',
    };
  }

  @Get('job/:jobId')
  async getStatus(@Param('jobId') jobId: string) {
    return this.getJobStatus.execute(jobId);
  }

  @Get('status/:documentId')
  async getDocumentStatus(@Param('documentId') documentId: string) {
    const doc = await this.documentRepository.findById(documentId);
    if (!doc) {
      throw new Error(`Document not found: ${documentId}`);
    }
    return {
      documentId: doc.id,
      status: doc.status,
      learningStatus: doc.learningStatus,
    };
  }
}
