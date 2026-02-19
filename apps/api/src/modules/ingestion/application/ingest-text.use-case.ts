import { randomUUID } from 'node:crypto';
import type { DocumentRepository } from '../domain/document-repository.interface.js';
import type { IngestionJobProducer } from '../infrastructure/ingestion-job.producer.js';
import { createDocument } from '../domain/document.entity.js';

export class IngestTextUseCase {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly jobProducer: IngestionJobProducer,
  ) {}

  async execute(input: {
    title: string;
    content: string;
  }): Promise<{ documentId: string }> {
    const document = createDocument({
      id: randomUUID(),
      title: input.title,
      sourceType: 'TEXT',
      sourceUrl: null,
      rawContent: input.content,
    });

    const saved = await this.documentRepository.save(document);
    await this.jobProducer.enqueueChunkingJob(saved.id);

    return { documentId: saved.id };
  }
}
