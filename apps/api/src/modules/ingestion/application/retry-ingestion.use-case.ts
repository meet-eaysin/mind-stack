import type { DocumentRepository } from '../domain/document-repository.interface';
import type { IngestionJobProducerPort } from '../domain/ingestion-job-producer.port';
import { INGESTION_STATUS } from '@repo/shared-types';
import { ConflictException, NotFoundException } from '@nestjs/common';

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
    const jobId = await this.jobProducer.enqueueChunkingJob(
      documentId,
      document.userId,
    );
    return { jobId };
  }
}
