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
    // Add User-Agent and other headers to mimic a browser and avoid 403 Forbidden on some sites
    const response = await fetch(input.url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error(
          `Access Denied: The website at ${input.url} is blocking our automated extraction. Please try uploading a PDF or pasting the content manually.`,
        );
      }
      throw new Error(
        `Failed to fetch URL (${response.status}): ${response.statusText}`,
      );
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
      1. Extract all meaningful semantic content (articles, lists, key facts).
      2. Remove all nav menus, footers, and redundant UI text.
      3. CRITICAL: Preserve the core text structure for AI analysis (entities, relations, concepts).
      4. Ensure clean paragraphs and consistent markdown tagging for key terms.
      5. Output ONLY the refined Markdown content.
      
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
