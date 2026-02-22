import { GenerateDailyReviewUseCase } from '../generate-daily-review.use-case.js';
import type {
  ReviewRepository,
  ReviewEntity,
} from '../../domain/review-repository.interface.js';
import type { DocumentRepository } from '../../../ingestion/domain/document-repository.interface.js';
import type { DocumentEntity } from '../../../ingestion/domain/document.entity.js';
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

class FakeDocumentRepository implements Partial<DocumentRepository> {
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
}

class FakeTagRepository implements Partial<TagRepository> {
  async findByDocumentId(): Promise<TagEntity[]> {
    return [];
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
      documentRepository as unknown as DocumentRepository,
      tagRepository as unknown as TagRepository,
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
      {
        id: 'doc-1',
        title: 'TS Guide',
        sourceType: 'TEXT',
        sourceUrl: null,
        rawContent: 'Content about TypeScript',
        status: 'READY',
        learningStatus: 'UPCOMING',
        createdAt: new Date('2025-01-01T00:00:00Z'),
      } as DocumentEntity,
      {
        id: 'doc-2',
        title: 'NestJS Guide',
        sourceType: 'TEXT',
        sourceUrl: null,
        rawContent: 'Content about NestJS',
        status: 'READY',
        learningStatus: 'UPCOMING',
        createdAt: new Date('2025-01-01T00:00:00Z'),
      } as DocumentEntity,
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
