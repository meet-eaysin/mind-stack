import { IngestYoutubeUseCase } from '../ingest-youtube.use-case.js';
import type { DocumentRepository } from '../../domain/document-repository.interface.js';
import type { IngestionJobProducerPort } from '../../domain/ingestion-job-producer.port.js';
import type { DocumentEntity } from '../../domain/document.entity.js';
import { type IngestionStatus, type LearningStatus } from '@repo/shared-types';

// ── Fakes ──

class FakeDocumentRepository implements DocumentRepository {
  saved: DocumentEntity[] = [];

  async save(document: DocumentEntity): Promise<DocumentEntity> {
    this.saved.push(document);
    return Promise.resolve(document);
  }

  async findById(id: string): Promise<DocumentEntity | null> {
    return Promise.resolve(this.saved.find((d) => d.id === id) ?? null);
  }

  async findAll(): Promise<DocumentEntity[]> {
    return Promise.resolve(this.saved);
  }

  async findBySourceUrl(
    url: string,
    _userId: string,
  ): Promise<DocumentEntity | null> {
    return Promise.resolve(this.saved.find((d) => d.sourceUrl === url) ?? null);
  }

  async updateStatus(_id: string, _status: IngestionStatus): Promise<void> {
    const doc = this.saved.find((d) => d.id === _id);
    if (doc) {
      doc.status = _status;
    }
    return Promise.resolve();
  }
  async updateProcessingError(
    _id: string,
    _errorMessage: string | null,
  ): Promise<void> {
    const doc = this.saved.find((d) => d.id === _id);
    if (doc) {
      doc.processingError = _errorMessage;
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

  async enqueueUrlExtractionJob(_documentId: string): Promise<string> {
    return 'mock-job-id';
  }

  async enqueueChunkingJob(documentId: string): Promise<string> {
    this.enqueuedIds.push(documentId);
    return 'mock-job-id';
  }

  async enqueueEmbeddingJob(_documentId: string): Promise<string> {
    return 'mock-job-id';
  }
  async enqueueConceptExtractionJob(_documentId: string): Promise<string> {
    return 'mock-job-id';
  }
}

// ── Helpers ──

function buildYoutubePageHtml(captionUrl: string): string {
  const escapedUrl = captionUrl.replace(/&/g, '\\u0026');
  return `<html><body><script>"captionTracks":[{"baseUrl":"${escapedUrl}"}]</script></body></html>`;
}

function buildCaptionXml(texts: string[]): string {
  const entries = texts
    .map((t) => `<text start="0" dur="1">${t}</text>`)
    .join('');
  return `<?xml version="1.0"?><transcript>${entries}</transcript>`;
}

// ── Tests ──

describe('IngestYoutubeUseCase', () => {
  let useCase: IngestYoutubeUseCase;
  let documentRepository: FakeDocumentRepository;
  let jobProducer: FakeIngestionJobProducer;

  beforeEach(() => {
    documentRepository = new FakeDocumentRepository();
    jobProducer = new FakeIngestionJobProducer();
    useCase = new IngestYoutubeUseCase(documentRepository, jobProducer);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should extract the transcript, save a YOUTUBE document, and enqueue a job', async () => {
    const captionUrl = 'https://captions.example.com/en';
    const pageHtml = buildYoutubePageHtml(captionUrl);
    const captionXml = buildCaptionXml(['Hello', 'World']);

    const fetchSpy = jest.spyOn(globalThis, 'fetch');
    fetchSpy.mockResolvedValueOnce(new Response(pageHtml, { status: 200 }));
    fetchSpy.mockResolvedValueOnce(new Response(captionXml, { status: 200 }));

    const result = await useCase.execute({
      url: 'https://www.youtube.com/watch?v=abc123',
      title: 'My Video',
      userId: 'default',
    });

    expect(result.documentId).toBeDefined();
    expect(documentRepository.saved).toHaveLength(1);

    const saved = documentRepository.saved[0];
    expect(saved).toBeDefined();
    expect(saved?.title).toBe('My Video');
    expect(saved?.sourceType).toBe('YOUTUBE');
    expect(saved?.sourceUrl).toBe('https://www.youtube.com/watch?v=abc123');
    expect(saved?.rawContent).toBe('Hello World');

    expect(jobProducer.enqueuedIds).toHaveLength(1);
  });

  it('should throw when the YouTube page fetch fails', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('Error', { status: 500 }));

    await expect(
      useCase.execute({
        url: 'https://www.youtube.com/watch?v=abc123',
        userId: 'default',
      }),
    ).rejects.toThrow('Failed to fetch YouTube page: 500');
  });
});
