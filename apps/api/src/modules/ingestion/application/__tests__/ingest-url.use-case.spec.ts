import { IngestUrlUseCase } from '../ingest-url.use-case.js';
import type { DocumentRepository } from '../../domain/document-repository.interface.js';
import type { IngestionJobProducerPort } from '../../domain/ingestion-job-producer.port.js';
import type { DocumentEntity } from '../../domain/document.entity.js';
import type { IngestionStatus } from '@repo/shared-types';

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

  updateStatus(_id: string, _status: IngestionStatus): Promise<void> {
    const doc = this.saved.find((d) => d.id === _id);
    if (doc) {
      doc.status = _status;
    }
    return Promise.resolve();
  }
}

class FakeIngestionJobProducer implements IngestionJobProducerPort {
  readonly enqueuedIds: string[] = [];

  enqueueChunkingJob(documentId: string): Promise<void> {
    this.enqueuedIds.push(documentId);
    return Promise.resolve();
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

  it('should fetch the URL content, save the document, and enqueue a chunking job', async () => {
    const fakeResponse = new Response('fetched content', { status: 200 });
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(fakeResponse);

    const result = await useCase.execute({
      url: 'https://example.com/article',
      title: 'My Article',
    });

    expect(result.documentId).toBeDefined();
    expect(documentRepository.saved).toHaveLength(1);

    const saved = documentRepository.saved[0];
    expect(saved).toBeDefined();
    expect(saved?.rawContent).toBe('fetched content');
    expect(saved?.title).toBe('My Article');
    expect(saved?.sourceType).toBe('URL');
    expect(saved?.sourceUrl).toBe('https://example.com/article');
    expect(saved?.status).toBe('PENDING');

    expect(jobProducer.enqueuedIds).toHaveLength(1);
    expect(jobProducer.enqueuedIds[0]).toBe(result.documentId);
  });

  it('should use the hostname as the title when no title is provided', async () => {
    const fakeResponse = new Response('content', { status: 200 });
    jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(fakeResponse);

    await useCase.execute({ url: 'https://example.com/page' });

    const saved = documentRepository.saved[0];
    expect(saved?.title).toBe('example.com');
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
