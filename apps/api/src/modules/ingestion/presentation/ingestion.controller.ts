import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Headers,
  NotFoundException,
} from '@nestjs/common';
import { type IngestionResponse, INGESTION_STATUS } from '@repo/shared-types';
import { IngestUrlUseCase } from '@/modules/ingestion/application/ingest-url.use-case';
import { IngestTextUseCase } from '@/modules/ingestion/application/ingest-text.use-case';
import { IngestPdfUseCase } from '@/modules/ingestion/application/ingest-pdf.use-case';
import { IngestYoutubeUseCase } from '@/modules/ingestion/application/ingest-youtube.use-case';
import { RetryIngestionUseCase } from '@/modules/ingestion/application/retry-ingestion.use-case';
import { GetIngestionJobStatusUseCase } from '@/modules/ingestion/application/get-ingestion-job-status.use-case';
import { PrismaDocumentRepository } from '@/modules/ingestion/infrastructure/prisma-document.repository';
import {
  IngestUrlDto,
  IngestTextDto,
  IngestPdfDto,
  IngestYoutubeDto,
} from '@/modules/ingestion/presentation/ingestion.dtos';
import { getUserIdFromHeader } from '@/common/request-user';

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
  async ingestFromUrl(
    @Body() dto: IngestUrlDto,
    @Headers('x-user-id') userId?: string,
  ): Promise<IngestionResponse> {
    const result = await this.ingestUrl.execute({
      ...dto,
      userId: getUserIdFromHeader(userId),
    });
    return {
      documentId: result.documentId,
      jobId: result.jobId,
      status: INGESTION_STATUS.INGESTED,
      message: 'Document ingestion started',
    };
  }

  @Post('text')
  async ingestFromText(
    @Body() dto: IngestTextDto,
    @Headers('x-user-id') userId?: string,
  ): Promise<IngestionResponse> {
    const result = await this.ingestText.execute({
      ...dto,
      userId: getUserIdFromHeader(userId),
    });
    return {
      documentId: result.documentId,
      jobId: result.jobId,
      status: INGESTION_STATUS.INGESTED,
      message: 'Text ingestion started',
    };
  }

  @Post('pdf')
  async ingestFromPdf(
    @Body() dto: IngestPdfDto,
    @Headers('x-user-id') userId?: string,
  ): Promise<IngestionResponse> {
    const result = await this.ingestPdf.execute({
      ...dto,
      userId: getUserIdFromHeader(userId),
    });
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
    @Headers('x-user-id') userId?: string,
  ): Promise<IngestionResponse> {
    const result = await this.ingestYoutube.execute({
      ...dto,
      userId: getUserIdFromHeader(userId),
    });
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
      throw new NotFoundException(`Document not found: ${documentId}`);
    }
    return {
      documentId: doc.id,
      status: doc.status,
      learningStatus: doc.learningStatus,
    };
  }
}
