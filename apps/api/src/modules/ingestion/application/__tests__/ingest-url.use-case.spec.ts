import {
  type IngestionStatus,
  INGESTION_STATUS,
  SOURCE_TYPE,
} from '@repo/shared-types';
import { IngestUrlUseCase } from '../ingest-url.use-case.js';
import type { DocumentRepository } from '../../domain/document-repository.interface.js';
import type { IngestionJobProducerPort } from '../../domain/ingestion-job-producer.port.js';
import type { DocumentEntity } from '../../domain/document.entity.js';

jest.mock('jsdom', () => ({
  JSDOM: jest.fn().mockImplementation(() => ({
    window: { document: {} },
  })),
}));

jest.mock('@mozilla/readability', () => ({
  Readability: jest.fn().mockImplementation(() => ({
    parse: jest.fn().mockReturnValue({
      title: 'Mocked Title',
      textContent: 'Mocked Content',
    }),
  })),
}));

// ── Fakes ──

class FakeDocumentRepository implements DocumentRepository {
  readonly saved: DocumentEntity[] = [];

  save(document: DocumentEntity): Promise<DocumentEntity> {
    this.saved.push(document);
    return Promise.resolve(document);
  }

  findById(_id: string): Promise<DocumentEntity | null> {
    return Promise.resolve(this.saved.find((d) => d.id === _id) ?? null);
  }

  findAll(): Promise<DocumentEntity[]> {
    return Promise.resolve(this.saved);
  }

  findBySourceUrl(url: string): Promise<DocumentEntity | null> {
    return Promise.resolve(this.saved.find((d) => d.sourceUrl === url) ?? null);
  }

  updateStatus(_id: string, _status: IngestionStatus): Promise<void> {
    const doc = this.saved.find((d) => d.id === _id);
    if (doc) {
      doc.status = _status;
    }
    return Promise.resolve();
  }

  updateImportance(_id: string, _score: number): Promise<void> {
    return Promise.resolve();
  }

  getImportance(_id: string): Promise<number | null> {
    return Promise.resolve(null);
  }
}

class FakeIngestionJobProducer implements IngestionJobProducerPort {
  readonly enqueuedIds: string[] = [];

  async enqueueChunkingJob(documentId: string): Promise<void> {
    this.enqueuedIds.push(documentId);
  }

  async enqueueEmbeddingJob(_documentId: string): Promise<void> {}
  async enqueueConceptExtractionJob(_documentId: string): Promise<void> {}
}

// ── Tests ──

describe('IngestUrlUseCase', () => {
  let useCase: IngestUrlUseCase;
  let documentRepository: FakeDocumentRepository;
  let jobProducer: FakeIngestionJobProducer;

  beforeEach(() => {
    documentRepository = new FakeDocumentRepository();
    jobProducer = new FakeIngestionJobProducer();
    useCase = new IngestUrlUseCase(documentRepository, jobProducer);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should fetch the URL content, save the document, and enqueue a chunking job', async () => {
    const fakeResponse = new Response(
      '<html><body><h1>Title</h1><p>Content</p></body></html>',
      { status: 200 },
    );
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(fakeResponse);

    const result = await useCase.execute({
      url: 'https://example.com/article',
      title: 'My Article',
    });

    expect(result.documentId).toBeDefined();
    expect(documentRepository.saved).toHaveLength(1);

    const saved = documentRepository.saved[0];
    expect(saved).toBeDefined();
    expect(saved?.rawContent).toBe('Mocked Content');
    expect(saved?.title).toBe('My Article');
    expect(saved?.sourceType).toBe('URL');
    expect(saved?.sourceUrl).toBe('https://example.com/article');
    expect(saved?.status).toBe(INGESTION_STATUS.INGESTED);

    expect(jobProducer.enqueuedIds).toHaveLength(1);
    expect(jobProducer.enqueuedIds[0]).toBe(result.documentId);
  });

  it('should return existing documentId if URL is already ingested', async () => {
    const existingDoc: DocumentEntity = {
      id: 'existing-id',
      title: 'Existing',
      sourceType: SOURCE_TYPE.URL,
      sourceUrl: 'https://example.com/already-here',
      rawContent: 'content',
      status: INGESTION_STATUS.READY,
      createdAt: new Date(),
    };
    documentRepository.saved.push(existingDoc);

    const result = await useCase.execute({
      url: 'https://example.com/already-here',
    });

    expect(result.documentId).toBe('existing-id');
    expect(documentRepository.saved).toHaveLength(1); // No new document saved
    expect(jobProducer.enqueuedIds).toHaveLength(0); // No new job enqueued
  });

  it('should use the article title as the title when no title is provided', async () => {
    const fakeResponse = new Response('content', { status: 200 });
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(fakeResponse);

    await useCase.execute({ url: 'https://example.com/page' });

    const saved = documentRepository.saved[0];
    expect(saved?.title).toBe('Mocked Title');
  });

  it('should throw when the fetch fails', async () => {
    const fakeResponse = new Response('Not Found', { status: 404 });
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(fakeResponse);

    await expect(
      useCase.execute({ url: 'https://example.com/missing' }),
    ).rejects.toThrow('Failed to fetch URL: 404');

    expect(documentRepository.saved).toHaveLength(0);
    expect(jobProducer.enqueuedIds).toHaveLength(0);
  });
});
