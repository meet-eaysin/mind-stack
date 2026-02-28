import { randomUUID } from 'node:crypto';

import type { DocumentRepository } from '@/modules/ingestion/domain/document-repository.interface';
import type { IngestionJobProducerPort } from '@/modules/ingestion/domain/ingestion-job-producer.port';
import { createDocument } from '@/modules/ingestion/domain/document.entity';
import { SOURCE_TYPE, INGESTION_STATUS } from '@repo/shared-types';

export class IngestUrlUseCase {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly jobProducer: IngestionJobProducerPort,
  ) {}

  async execute(input: {
    url: string;
    title?: string;
    userId: string;
  }): Promise<{ documentId: string; jobId?: string }> {
    const existing = await this.documentRepository.findBySourceUrl(
      input.url,
      input.userId,
    );

    if (existing) {
      if (
        existing.status !== INGESTION_STATUS.FAILED &&
        existing.status !== INGESTION_STATUS.READY
      ) {
        return { documentId: existing.id };
      }

      if (existing.status === INGESTION_STATUS.READY) {
        return { documentId: existing.id };
      }
    }

    const document = createDocument({
      id: randomUUID(),
      title: input.title ?? new URL(input.url).hostname,
      userId: input.userId,
      sourceType: SOURCE_TYPE.URL,
      sourceUrl: input.url,
      rawContent: '',
      status: INGESTION_STATUS.INITIALIZING,
    });

    const saved = await this.documentRepository.save(document);
    const jobId = await this.jobProducer.enqueueUrlExtractionJob(
      saved.id,
      input.userId,
    );
    return { documentId: saved.id, jobId };
  }
}
