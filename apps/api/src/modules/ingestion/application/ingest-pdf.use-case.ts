import { randomUUID } from 'node:crypto';
import { PDFParse } from 'pdf-parse';
import type { DocumentRepository } from '../domain/document-repository.interface.js';
import type { IngestionJobProducerPort } from '../domain/ingestion-job-producer.port.js';
import { createDocument } from '../domain/document.entity.js';
import { SOURCE_TYPE } from '@repo/shared-types';

export class IngestPdfUseCase {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly jobProducer: IngestionJobProducerPort,
  ) {}

  async execute(input: {
    title: string;
    fileBase64: string;
  }): Promise<{ documentId: string }> {
    const buffer = Buffer.from(input.fileBase64, 'base64');
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await parser.getText();
    const rawContent = result.text;

    const document = createDocument({
      id: randomUUID(),
      title: input.title,
      sourceType: SOURCE_TYPE.PDF,
      sourceUrl: null,
      rawContent,
    });

    const saved = await this.documentRepository.save(document);
    await this.jobProducer.enqueueChunkingJob(saved.id);

    return { documentId: saved.id };
  }
}
