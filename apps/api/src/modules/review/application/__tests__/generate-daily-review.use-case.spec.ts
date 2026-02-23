import { GenerateDailyReviewUseCase } from '../generate-daily-review.use-case.js';
import type {
  ReviewRepository,
  ReviewEntity,
} from '../../domain/review-repository.interface.js';
import type { DocumentRepository } from '../../../ingestion/domain/document-repository.interface.js';
import type { DocumentEntity } from '../../../ingestion/domain/document.entity.js';
import type { IngestionStatus, LearningStatus } from '@repo/shared-types';
import type { TagRepository } from '../../../knowledge/domain/tag-repository.interface.js';
import type { TagEntity } from '../../../knowledge/domain/tag.entity.js';

// ── Fixtures ──

function createReviewFixture(
  overrides: Partial<ReviewEntity> = {},
): ReviewEntity {
  return {
    id: 'review-1',
    documentId: 'doc-1',
    lastReviewedAt: new Date('2020-01-01T00:00:00Z'),
    nextReviewDate: new Date('2020-01-01T00:00:00Z'),
    interval: 0,
    easeFactor: 2.5,
    repetitionCount: 0,
    reviewScore: 0,
    ...overrides,
  };
}

function createDocumentFixture(
  overrides: Partial<DocumentEntity> = {},
): DocumentEntity {
  return {
    id: 'doc-1',
    title: 'TS Guide',
    userId: 'default',
    sourceType: 'TEXT',
    sourceUrl: null,
    rawContent: 'Content about TypeScript',
    status: 'READY',
    learningStatus: 'UPCOMING',
    type: 'ARTICLE',
    author: null,
    publisher: null,
    publishedAt: null,
    language: 'en',
    addedByUserAt: new Date('2025-01-01T00:00:00Z'),
    createdAt: new Date('2025-01-01T00:00:00Z'),
    processingError: null,
    deletedAt: null,
    ...overrides,
  };
}

// ── Fakes ──

class FakeReviewRepository implements ReviewRepository {
  private reviews: ReviewEntity[] = [];

  seed(reviews: ReviewEntity[]): void {
    this.reviews = reviews;
  }

  findByDocumentId(documentId: string): Promise<ReviewEntity | null> {
    return Promise.resolve(
      this.reviews.find((r) => r.documentId === documentId) ?? null,
    );
  }

  save(review: ReviewEntity): Promise<ReviewEntity> {
    const rest = this.reviews.filter((r) => r.id !== review.id);
    this.reviews = [...rest, review];
    return Promise.resolve(review);
  }

  findDueForReview(_limit: number): Promise<ReviewEntity[]> {
    return Promise.resolve(
      this.reviews.filter((r) => r.nextReviewDate <= new Date()),
    );
  }

  findAll(): Promise<ReviewEntity[]> {
    return Promise.resolve(this.reviews);
  }

  async addLog(): Promise<void> {}
}

class FakeDocumentRepository implements DocumentRepository {
  private documents: DocumentEntity[] = [];

  seed(docs: DocumentEntity[]): void {
    this.documents = docs;
  }

  findAll(): Promise<DocumentEntity[]> {
    return Promise.resolve(this.documents);
  }

  findById(id: string): Promise<DocumentEntity | null> {
    return Promise.resolve(this.documents.find((d) => d.id === id) ?? null);
  }

  save(document: DocumentEntity): Promise<DocumentEntity> {
    const rest = this.documents.filter((d) => d.id !== document.id);
    this.documents = [...rest, document];
    return Promise.resolve(document);
  }

  findBySourceUrl(
    url: string,
    _userId: string,
  ): Promise<DocumentEntity | null> {
    return Promise.resolve(
      this.documents.find((d) => d.sourceUrl === url) ?? null,
    );
  }

  updateStatus(id: string, status: IngestionStatus): Promise<void> {
    const doc = this.documents.find((d) => d.id === id);
    if (doc) doc.status = status;
    return Promise.resolve();
  }

  updateProcessingError(
    id: string,
    errorMessage: string | null,
  ): Promise<void> {
    const doc = this.documents.find((d) => d.id === id);
    if (doc) doc.processingError = errorMessage;
    return Promise.resolve();
  }

  updateImportance(_id: string, _score: number): Promise<void> {
    return Promise.resolve();
  }

  getImportance(_id: string): Promise<number | null> {
    return Promise.resolve(null);
  }

  delete(id: string): Promise<void> {
    this.documents = this.documents.filter((d) => d.id !== id);
    return Promise.resolve();
  }

  addStatusHistory(
    _documentId: string,
    _status: IngestionStatus,
    _learningStatus: LearningStatus,
  ): Promise<void> {
    return Promise.resolve();
  }
}

class FakeTagRepository implements TagRepository {
  findOrCreate(name: string): Promise<TagEntity> {
    return Promise.resolve({ id: `tag-${name}`, name });
  }
  addTagToDocument(): Promise<void> {
    return Promise.resolve();
  }
  removeTagFromDocument(): Promise<void> {
    return Promise.resolve();
  }
  findByDocumentId(): Promise<TagEntity[]> {
    return Promise.resolve([]);
  }
}

// ── Tests ──

describe('GenerateDailyReviewUseCase', () => {
  let useCase: GenerateDailyReviewUseCase;
  let reviewRepository: FakeReviewRepository;
  let documentRepository: FakeDocumentRepository;

  beforeEach(() => {
    reviewRepository = new FakeReviewRepository();
    documentRepository = new FakeDocumentRepository();
    const tagRepository = new FakeTagRepository();
    useCase = new GenerateDailyReviewUseCase(
      reviewRepository,
      documentRepository,
      tagRepository,
    );
  });

  it('should select overdue reviews and return enriched items', async () => {
    const longAgo = new Date('2020-01-01T00:00:00Z');
    reviewRepository.seed([
      createReviewFixture({
        id: 'r1',
        documentId: 'doc-1',
        nextReviewDate: longAgo,
      }),
      createReviewFixture({
        id: 'r2',
        documentId: 'doc-2',
        nextReviewDate: longAgo,
      }),
    ]);

    documentRepository.seed([
      createDocumentFixture({ id: 'doc-1', title: 'TS Guide' }),
      createDocumentFixture({
        id: 'doc-2',
        title: 'NestJS Guide',
        rawContent: 'Content about NestJS',
      }),
    ]);

    const result = await useCase.execute(5);

    expect(result.items.length).toBeGreaterThan(0);
    expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

    const first = result.items[0];
    expect(first).toBeDefined();
    expect(first?.content).toBeDefined();
    expect(first?.documentTitle).toBeDefined();
    expect(first?.reason).toContain('days ago');
  });

  it('should return empty items when no reviews are overdue', async () => {
    reviewRepository.seed([
      createReviewFixture({
        documentId: 'doc-1',
        nextReviewDate: new Date(Date.now() + 1000000),
      }),
    ]);

    const result = await useCase.execute(5);

    expect(result.items).toHaveLength(0);
  });
});
