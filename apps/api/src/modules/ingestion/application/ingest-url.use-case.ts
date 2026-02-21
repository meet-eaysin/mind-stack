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
  }): Promise<{ documentId: string }> {
    const existing = await this.documentRepository.findBySourceUrl(input.url);
    if (existing) {
      return { documentId: existing.id };
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
    await this.jobProducer.enqueueUrlExtractionJob(saved.id);

    return { documentId: saved.id };
  }
}
