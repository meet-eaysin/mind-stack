import { randomUUID } from 'node:crypto';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import type { DocumentRepository } from '../domain/document-repository.interface.js';
import type { IngestionJobProducerPort } from '../domain/ingestion-job-producer.port.js';
import { createDocument } from '../domain/document.entity.js';

export class IngestUrlUseCase {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly jobProducer: IngestionJobProducerPort,
  ) {}

  async execute(input: {
    url: string;
    title?: string;
  }): Promise<{ documentId: string }> {
    // 1. Check for duplicate
    const existing = await this.documentRepository.findBySourceUrl(input.url);
    if (existing) {
      return { documentId: existing.id };
    }

    // 2. Fetch and Extract
    const response = await fetch(input.url);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }
    const html = await response.text();

    const dom = new JSDOM(html, { url: input.url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      throw new Error('Failed to extract readable content from URL');
    }

    const document = createDocument({
      id: randomUUID(),
      title: input.title ?? article.title ?? new URL(input.url).hostname,
      sourceType: 'URL',
      sourceUrl: input.url,
      rawContent: article.textContent || '',
    });

    const saved = await this.documentRepository.save(document);
    await this.jobProducer.enqueueChunkingJob(saved.id);

    return { documentId: saved.id };
  }
}
