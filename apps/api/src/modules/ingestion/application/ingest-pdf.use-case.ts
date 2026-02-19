import { randomUUID } from 'node:crypto';
import type { DocumentRepository } from '../domain/document-repository.interface.js';
import type { IngestionJobProducer } from '../infrastructure/ingestion-job.producer.js';
import { createDocument } from '../domain/document.entity.js';

export class IngestPdfUseCase {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly jobProducer: IngestionJobProducer,
  ) {}

  async execute(input: {
    title: string;
    fileBase64: string;
  }): Promise<{ documentId: string }> {
    const buffer = Buffer.from(input.fileBase64, 'base64');
    const rawContent = buffer.toString('utf-8');

    const document = createDocument({
      id: randomUUID(),
      title: input.title,
      sourceType: 'PDF',
      sourceUrl: null,
      rawContent,
    });

    const saved = await this.documentRepository.save(document);
    await this.jobProducer.enqueueChunkingJob(saved.id);

    return { documentId: saved.id };
  }
}
