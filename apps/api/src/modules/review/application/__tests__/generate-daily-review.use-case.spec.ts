import { GenerateDailyReviewUseCase } from '../generate-daily-review.use-case.js';
import type {
  ReviewRepository,
  ReviewEntity,
} from '../../domain/review-repository.interface.js';
import type { DocumentRepository } from '../../../ingestion/domain/document-repository.interface.js';
import type { DocumentEntity } from '../../../ingestion/domain/document.entity.js';

// ── Fixtures ──

function createReviewFixture(
  overrides: Partial<ReviewEntity> = {},
): ReviewEntity {
  return {
    id: 'review-1',
    documentId: 'doc-1',
    lastReviewedAt: new Date('2020-01-01T00:00:00Z'),
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

  upsert(documentId: string, score: number): Promise<ReviewEntity> {
    const existing = this.reviews.find((r) => r.documentId === documentId);
    if (existing) {
      existing.reviewScore = score;
      existing.lastReviewedAt = new Date();
      return Promise.resolve(existing);
    }
    const review: ReviewEntity = {
      id: `review-${String(this.reviews.length + 1)}`,
      documentId,
      lastReviewedAt: new Date(),
      reviewScore: score,
    };
    this.reviews.push(review);
    return Promise.resolve(review);
  }

  findDueForReview(_limit: number): Promise<ReviewEntity[]> {
    return Promise.resolve([]);
  }

  findAll(): Promise<ReviewEntity[]> {
    return Promise.resolve(this.reviews);
  }
}

class FakeDocumentRepository implements Partial<DocumentRepository> {
  private documents: DocumentEntity[] = [];

  seed(docs: DocumentEntity[]): void {
    this.documents = docs;
  }

  findById(id: string): Promise<DocumentEntity | null> {
    return Promise.resolve(this.documents.find((d) => d.id === id) ?? null);
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
    useCase = new GenerateDailyReviewUseCase(
      reviewRepository,
      documentRepository as unknown as DocumentRepository,
    );
  });

  it('should select overdue reviews and return enriched items', async () => {
    const longAgo = new Date('2020-01-01T00:00:00Z');
    reviewRepository.seed([
      createReviewFixture({
        id: 'r1',
        documentId: 'doc-1',
        lastReviewedAt: longAgo,
        reviewScore: 0,
      }),
      createReviewFixture({
        id: 'r2',
        documentId: 'doc-2',
        lastReviewedAt: longAgo,
        reviewScore: 1,
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
        createdAt: new Date('2025-01-01T00:00:00Z'),
      } as DocumentEntity,
      {
        id: 'doc-2',
        title: 'NestJS Guide',
        sourceType: 'TEXT',
        sourceUrl: null,
        rawContent: 'Content about NestJS',
        status: 'READY',
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
        lastReviewedAt: new Date(),
        reviewScore: 0,
      }),
    ]);

    const result = await useCase.execute(5);

    expect(result.items).toHaveLength(0);
  });
});
