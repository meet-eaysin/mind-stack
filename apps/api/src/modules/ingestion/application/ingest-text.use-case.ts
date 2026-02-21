import { randomUUID } from 'node:crypto';
import type { DocumentRepository } from '../domain/document-repository.interface.js';
import type { IngestionJobProducerPort } from '../domain/ingestion-job-producer.port.js';
import { createDocument } from '../domain/document.entity.js';
import { SOURCE_TYPE } from '@repo/shared-types';

export class IngestTextUseCase {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly jobProducer: IngestionJobProducerPort,
  ) {}

  async execute(input: {
    title: string;
    content: string;
    sourceUrl?: string;
  }): Promise<{ documentId: string }> {
    const document = createDocument({
      id: randomUUID(),
      title: input.title,
      sourceType: SOURCE_TYPE.TEXT,
      sourceUrl: input.sourceUrl ?? null,
      rawContent: input.content,
    });

    const saved = await this.documentRepository.save(document);
    await this.jobProducer.enqueueChunkingJob(saved.id);

    return { documentId: saved.id };
  }
}
