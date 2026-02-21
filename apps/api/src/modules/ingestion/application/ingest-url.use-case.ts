import { randomUUID } from 'node:crypto';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import type { DocumentRepository } from '../domain/document-repository.interface.js';
import type { IngestionJobProducerPort } from '../domain/ingestion-job-producer.port.js';
import { createDocument } from '../domain/document.entity.js';
import { SOURCE_TYPE } from '@repo/shared-types';
import type { LLMProvider } from '@repo/llm';

export class IngestUrlUseCase {
  constructor(
    private readonly documentRepository: DocumentRepository,
    private readonly jobProducer: IngestionJobProducerPort,
    private readonly llm: LLMProvider,
  ) {}

  async execute(input: {
    url: string;
    title?: string;
  }): Promise<{ documentId: string }> {
    // ... existing duplicate check ...
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

    const TurndownService = (await import('turndown')).default;
    const turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
    });

    turndownService.addRule('images', {
      filter: 'img',
      replacement: function (_content, node) {
        const img = node as HTMLElement;
        const alt = img.getAttribute('alt') || '';
        const src = img.getAttribute('src') || '';
        const title = img.getAttribute('title') || '';
        const titlePart = title ? ' "' + title + '"' : '';
        return src ? '![' + alt + '](' + src + titlePart + ')' : '';
      },
    });

    const initialMarkdown = turndownService.turndown(article.content || '');

    // 3. AI-Enhanced Structuring
    const prompt = `
      You are an expert content analyzer. I have some Markdown extracted from a website. 
      It might have some junk formatting, inconsistent headers, or missed structures.
      
      Your task is to:
      1. Clean up any weird character artifacting.
      2. Ensure a logical header hierarchy (H1, then H2, etc.).
      3. CRITICAL: Preserve all image tags exactly as they are: ![alt](url).
      4. Ensure clean paragraphs and consistent bold/italic usage.
      5. Output ONLY the improved Markdown content.
      
      CONTENT:
      ${initialMarkdown}
    `;

    const llmResponse = await this.llm.generate({ prompt });
    const markdownContent = llmResponse.text;

    const document = createDocument({
      id: randomUUID(),
      title: input.title ?? article.title ?? new URL(input.url).hostname,
      sourceType: SOURCE_TYPE.URL,
      sourceUrl: input.url,
      rawContent: markdownContent || '',
    });

    const saved = await this.documentRepository.save(document);
    await this.jobProducer.enqueueChunkingJob(saved.id);

    return { documentId: saved.id };
  }
}
