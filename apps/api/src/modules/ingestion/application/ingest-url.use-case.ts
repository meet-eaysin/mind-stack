import { randomUUID } from 'node:crypto';

import type { DocumentRepository } from '../domain/document-repository.interface.js';
import type { IngestionJobProducerPort } from '../domain/ingestion-job-producer.port.js';
import { createDocument } from '../domain/document.entity.js';
import { SOURCE_TYPE, INGESTION_STATUS } from '@repo/shared-types';

export class IngestUrlUseCase {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly jobProducer: IngestionJobProducerPort,
  ) {}

  async execute(input: {
    url: string;
    title?: string;
  }): Promise<{ documentId: string; jobId?: string }> {
    const existing = await this.documentRepository.findBySourceUrl(input.url);
    if (existing) {
      if (
        existing.status !== INGESTION_STATUS.FAILED &&
        existing.status !== INGESTION_STATUS.READY
      ) {
        // Already in progress
        return { documentId: existing.id };
      }
      // If it's FAILED or READY (and we are re-ingesting), we might want to allow it or return existing
      // For now, let's just return existing if it's already finished successfully
      if (existing.status === INGESTION_STATUS.READY) {
        return { documentId: existing.id };
      }
    }

    const document = createDocument({
      id: randomUUID(),
      title: input.title ?? new URL(input.url).hostname,
      sourceType: SOURCE_TYPE.URL,
      sourceUrl: input.url,
      rawContent: '',
      status: INGESTION_STATUS.INITIALIZING,
    });

    const saved = await this.documentRepository.save(document);
    const jobId = await this.jobProducer.enqueueUrlExtractionJob(saved.id);
    return { documentId: saved.id, jobId };
  }
}
