import { ExportMarkdownUseCase } from '@/modules/export/application/export-markdown.use-case';
import { INGESTION_STATUS } from '@repo/shared-types';
import type {
  QueryRepository,
  QueryChunkDetail,
} from '@/modules/query/domain/query-repository.interface';

// ── Fakes ──

class FakeQueryRepository implements QueryRepository {
  private chunks: QueryChunkDetail[] = [];

  seed(chunks: QueryChunkDetail[]): void {
    this.chunks = chunks;
  }

  findChunksByIds(chunkIds: string[]): Promise<QueryChunkDetail[]> {
    return Promise.resolve(
      this.chunks.filter((c) => chunkIds.includes(c.chunkId)),
    );
  }

  findChunksByTags(_tags: string[]): Promise<string[]> {
    return Promise.resolve([]);
  }

  findChunksByDateRange(_from: Date, _to: Date): Promise<string[]> {
    return Promise.resolve([]);
  }

  async findChunksByFilters(): Promise<string[]> {
    return [];
  }
}

// ── Tests ──

describe('ExportMarkdownUseCase', () => {
  let useCase: ExportMarkdownUseCase;
  let queryRepository: FakeQueryRepository;

  beforeEach(() => {
    queryRepository = new FakeQueryRepository();
    useCase = new ExportMarkdownUseCase(queryRepository);
  });

  it('should fetch chunks and return formatted markdown', async () => {
    queryRepository.seed([
      {
        chunkId: 'chunk-1',
        content: 'TypeScript is great',
        documentTitle: 'TS Guide',
        author: null,
        publishedAt: null,
        sourceUrl: null,
        importanceScore: 3,
        tags: ['typescript', 'guide'],
        createdAt: new Date('2025-01-01T00:00:00Z'),
        hasNote: false,
        reviewCount: 0,
        documentStatus: INGESTION_STATUS.READY,
        documentId: 'doc-1',
      },
    ]);

    const result = await useCase.execute(['chunk-1']);

    expect(result).toContain('# Exported Knowledge');
    expect(result).toContain('## TS Guide');
    expect(result).toContain('TypeScript is great');
    expect(result).toContain('**Tags:** typescript, guide');
  });

  it('should return a header-only markdown when no chunks match', async () => {
    queryRepository.seed([]);

    const result = await useCase.execute(['nonexistent']);

    expect(result).toContain('# Exported Knowledge');
    expect(result).not.toContain('##');
  });
});
