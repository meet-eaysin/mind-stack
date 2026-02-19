import { randomUUID } from 'node:crypto';
import type { DocumentRepository } from '../domain/document-repository.interface.js';
import type { IngestionJobProducer } from '../infrastructure/ingestion-job.producer.js';
import { createDocument } from '../domain/document.entity.js';

export class IngestUrlUseCase {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly jobProducer: IngestionJobProducer,
  ) {}

  async execute(input: {
    url: string;
    title?: string;
  }): Promise<{ documentId: string }> {
    const response = await fetch(input.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }
    const rawContent = await response.text();

    const document = createDocument({
      id: randomUUID(),
      title: input.title ?? new URL(input.url).hostname,
      sourceType: 'URL',
      sourceUrl: input.url,
      rawContent,
    });

    const saved = await this.documentRepository.save(document);
    await this.jobProducer.enqueueChunkingJob(saved.id);

    return { documentId: saved.id };
  }
}
