import {
  type IngestionStatus,
  INGESTION_STATUS,
  type LearningStatus,
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
  saved: DocumentEntity[] = [];

  async save(document: DocumentEntity): Promise<DocumentEntity> {
    this.saved.push(document);
    return Promise.resolve(document);
  }

  async findById(_id: string): Promise<DocumentEntity | null> {
    return Promise.resolve(this.saved.find((d) => d.id === _id) ?? null);
  }

  async findAll(): Promise<DocumentEntity[]> {
    return Promise.resolve(this.saved);
  }

  async findBySourceUrl(url: string): Promise<DocumentEntity | null> {
    return Promise.resolve(this.saved.find((d) => d.sourceUrl === url) ?? null);
  }

  async updateStatus(_id: string, _status: IngestionStatus): Promise<void> {
    const doc = this.saved.find((d) => d.id === _id);
    if (doc) {
      doc.status = _status;
    }
    return Promise.resolve();
  }

  async updateImportance(_id: string, _score: number): Promise<void> {
    return Promise.resolve();
  }

  async getImportance(_id: string): Promise<number | null> {
    return Promise.resolve(null);
  }

  async addStatusHistory(
    _documentId: string,
    _status: IngestionStatus,
    _learningStatus: LearningStatus,
  ): Promise<void> {
    return Promise.resolve();
  }

  async delete(id: string): Promise<void> {
    this.saved = this.saved.filter((d) => d.id !== id);
    return Promise.resolve();
  }
}

class FakeIngestionJobProducer implements IngestionJobProducerPort {
  readonly enqueuedIds: string[] = [];

  async enqueueUrlExtractionJob(documentId: string): Promise<string> {
    this.enqueuedIds.push(documentId);
    return 'mock-job-id';
  }

  async enqueueChunkingJob(_documentId: string): Promise<string> {
    return 'mock-job-id';
  }
  async enqueueEmbeddingJob(_documentId: string): Promise<string> {
    return 'mock-job-id';
  }
  async enqueueConceptExtractionJob(_documentId: string): Promise<string> {
    return 'mock-job-id';
  }
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

  it('should save the document with INITIALIZING status and enqueue a URL extraction job', async () => {
    const result = await useCase.execute({
      url: 'https://example.com/article',
      title: 'My Article',
    });

    expect(result.documentId).toBeDefined();
    expect(documentRepository.saved).toHaveLength(1);

    const saved = documentRepository.saved[0];
    expect(saved).toBeDefined();
    expect(saved?.title).toBe('My Article');
    expect(saved?.sourceType).toBe('URL');
    expect(saved?.sourceUrl).toBe('https://example.com/article');
    expect(saved?.status).toBe(INGESTION_STATUS.INITIALIZING);

    expect(jobProducer.enqueuedIds).toHaveLength(1);
    expect(jobProducer.enqueuedIds[0]).toBe(result.documentId);
  });

  it('should return existing documentId if URL is already ingested', async () => {
    const doc: DocumentEntity = {
      id: 'doc-1',
      title: 'Title',
      sourceType: 'URL',
      sourceUrl: 'https://example.com/already-here',
      rawContent: 'Content',
      status: 'READY',
      learningStatus: 'UPCOMING',
      type: 'ARTICLE',
      author: null,
      publisher: null,
      publishedAt: null,
      language: 'en',
      addedByUserAt: new Date(),
      createdAt: new Date(),
      deletedAt: null,
    };
    documentRepository.saved.push(doc);

    const result = await useCase.execute({
      url: 'https://example.com/already-here',
    });

    expect(result.documentId).toBe('doc-1');
    expect(documentRepository.saved).toHaveLength(1); // No new document saved
    expect(jobProducer.enqueuedIds).toHaveLength(0); // No new job enqueued
  });
});
