import { randomUUID } from 'node:crypto';
import { PDFParse } from 'pdf-parse';
import type { DocumentRepository } from '@/modules/ingestion/domain/document-repository.interface';
import type { IngestionJobProducerPort } from '@/modules/ingestion/domain/ingestion-job-producer.port';
import { createDocument } from '@/modules/ingestion/domain/document.entity';
import { SOURCE_TYPE } from '@repo/shared-types';

export class IngestPdfUseCase {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly jobProducer: IngestionJobProducerPort,
  ) {}

  async execute(input: {
    title: string;
    fileBase64: string;
    userId: string;
  }): Promise<{ documentId: string; jobId?: string }> {
    const buffer = Buffer.from(input.fileBase64, 'base64');
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await parser.getText();
    const rawContent = result.text;

    const document = createDocument({
      id: randomUUID(),
      title: input.title,
      userId: input.userId,
      sourceType: SOURCE_TYPE.PDF,
      sourceUrl: null,
      rawContent,
    });

    const saved = await this.documentRepository.save(document);
    const jobId = await this.jobProducer.enqueueChunkingJob(
      saved.id,
      input.userId,
    );

    return { documentId: saved.id, jobId };
  }
}
