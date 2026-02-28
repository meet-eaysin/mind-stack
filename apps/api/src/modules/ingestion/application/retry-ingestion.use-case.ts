import type { DocumentRepository } from '@/modules/ingestion/domain/document-repository.interface';
import type { IngestionJobProducerPort } from '@/modules/ingestion/domain/ingestion-job-producer.port';
import { INGESTION_STATUS, SOURCE_TYPE } from '@repo/shared-types';
import {
  ConflictException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';

export class RetryIngestionUseCase {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly jobProducer: IngestionJobProducerPort,
  ) {}

  async execute(documentId: string): Promise<{ jobId: string }> {
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new NotFoundException(`Document not found: ${documentId}`);
    }

    if (document.status !== INGESTION_STATUS.FAILED) {
      throw new ConflictException(
        `Cannot retry document with status: ${document.status}`,
      );
    }

    await this.documentRepository.updateStatus(
      documentId,
      INGESTION_STATUS.INGESTED,
    );
    await this.documentRepository.updateProcessingError(documentId, null);
    const jobId = await this.enqueueRetryJob(document);
    return { jobId };
  }

  private enqueueRetryJob(document: {
    id: string;
    userId: string;
    sourceType: string;
    sourceUrl: string | null;
    rawContent: string;
  }): Promise<string> {
    if (
      document.sourceType === SOURCE_TYPE.URL &&
      document.rawContent.trim().length === 0
    ) {
      if (!document.sourceUrl) {
        throw new ServiceUnavailableException(
          'Cannot retry URL document without source URL',
        );
      }
      return this.jobProducer.enqueueUrlExtractionJob(
        document.id,
        document.userId,
      );
    }

    return this.jobProducer.enqueueChunkingJob(document.id, document.userId);
  }
}
