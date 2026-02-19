import { FilteredSearchUseCase } from '../filtered-search.use-case.js';
import type { EmbeddingProvider, EmbeddingResult } from '@repo/embeddings';
import type {
  VectorStore,
  VectorDocument,
  VectorSearchResult,
  VectorSearchOptions,
} from '@repo/vector-store';
import type {
  QueryRepository,
  QueryChunkDetail,
} from '../../domain/query-repository.interface.js';

// ── Fakes ──

class FakeEmbeddingProvider implements EmbeddingProvider {
  private readonly fixedEmbedding: number[] = [0.1, 0.2, 0.3];

  embed(_text: string): Promise<EmbeddingResult> {
    return Promise.resolve({
      embedding: this.fixedEmbedding,
      dimensions: this.fixedEmbedding.length,
    });
  }

  embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    return Promise.resolve(
      texts.map(() => ({
        embedding: this.fixedEmbedding,
        dimensions: this.fixedEmbedding.length,
      })),
    );
  }

  getDimensions(): number {
    return this.fixedEmbedding.length;
  }
}

class FakeVectorStore implements VectorStore {
  private results: VectorSearchResult[] = [];

  setResults(results: VectorSearchResult[]): void {
    this.results = results;
  }

  upsert(_documents: VectorDocument[]): Promise<void> {
    return Promise.resolve();
  }

  search(
    _embedding: number[],
    _options: VectorSearchOptions,
  ): Promise<VectorSearchResult[]> {
    return Promise.resolve(this.results);
  }

  delete(_ids: string[]): Promise<void> {
    return Promise.resolve();
  }

  count(): Promise<number> {
    return Promise.resolve(this.results.length);
  }
}

class FakeQueryRepository implements QueryRepository {
  private chunks: QueryChunkDetail[] = [];

  private tagChunkIds: Map<string, string[]> = new Map();
  private dateRangeChunkIds: string[] = [];

  seedChunks(chunks: QueryChunkDetail[]): void {
    this.chunks = chunks;
  }

  seedTagChunkIds(tag: string, chunkIds: string[]): void {
    this.tagChunkIds.set(tag, chunkIds);
  }

  seedDateRangeChunkIds(chunkIds: string[]): void {
    this.dateRangeChunkIds = chunkIds;
  }

  findChunksByIds(chunkIds: string[]): Promise<QueryChunkDetail[]> {
    return Promise.resolve(
      this.chunks.filter((c) => chunkIds.includes(c.chunkId)),
    );
  }

  findChunksByTags(tags: string[]): Promise<string[]> {
    const ids = new Set<string>();
    for (const tag of tags) {
      const chunkIds = this.tagChunkIds.get(tag) ?? [];
      for (const id of chunkIds) {
        ids.add(id);
      }
    }
    return Promise.resolve([...ids]);
  }

  findChunksByDateRange(_from: Date, _to: Date): Promise<string[]> {
    return Promise.resolve(this.dateRangeChunkIds);
  }
}

// ── Tests ──

describe('FilteredSearchUseCase', () => {
  let useCase: FilteredSearchUseCase;
  let embeddingProvider: FakeEmbeddingProvider;
  let vectorStore: FakeVectorStore;
  let queryRepository: FakeQueryRepository;

  beforeEach(() => {
    embeddingProvider = new FakeEmbeddingProvider();
    vectorStore = new FakeVectorStore();
    queryRepository = new FakeQueryRepository();
    useCase = new FilteredSearchUseCase(
      embeddingProvider,
      vectorStore,
      queryRepository,
    );
  });

  it('should filter results by tags', async () => {
    vectorStore.setResults([
      { id: 'chunk-1', score: 0.9, metadata: {}, content: 'content 1' },
      { id: 'chunk-2', score: 0.8, metadata: {}, content: 'content 2' },
      { id: 'chunk-3', score: 0.7, metadata: {}, content: 'content 3' },
    ]);
    queryRepository.seedTagChunkIds('typescript', ['chunk-1', 'chunk-3']);
    queryRepository.seedChunks([
      {
        chunkId: 'chunk-1',
        content: 'TypeScript content',
        documentTitle: 'TS Guide',
        importanceScore: 3,
        tags: ['typescript'],
        createdAt: new Date('2025-01-01T00:00:00Z'),
        hasNote: false,
        reviewCount: 0,
      },
      {
        chunkId: 'chunk-3',
        content: 'More TS content',
        documentTitle: 'TS Docs',
        importanceScore: 2,
        tags: ['typescript'],
        createdAt: new Date('2025-01-01T00:00:00Z'),
        hasNote: false,
        reviewCount: 0,
      },
    ]);

    const result = await useCase.execute({
      query: 'typescript',
      tags: ['typescript'],
    });

    expect(result).toHaveLength(2);
    const chunkIds = result.map((r) => r.chunkId);
    expect(chunkIds).toContain('chunk-1');
    expect(chunkIds).toContain('chunk-3');
    expect(chunkIds).not.toContain('chunk-2');
  });

  it('should filter results by date range', async () => {
    vectorStore.setResults([
      { id: 'chunk-1', score: 0.9, metadata: {}, content: 'content 1' },
      { id: 'chunk-2', score: 0.8, metadata: {}, content: 'content 2' },
    ]);
    queryRepository.seedDateRangeChunkIds(['chunk-2']);
    queryRepository.seedChunks([
      {
        chunkId: 'chunk-2',
        content: 'Recent content',
        documentTitle: 'Doc',
        importanceScore: 3,
        tags: [],
        createdAt: new Date('2025-06-01T00:00:00Z'),
        hasNote: false,
        reviewCount: 0,
      },
    ]);

    const result = await useCase.execute({
      query: 'test',
      fromDate: '2025-05-01',
      toDate: '2025-07-01',
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.chunkId).toBe('chunk-2');
  });

  it('should return empty results when no vectors match the filters', async () => {
    vectorStore.setResults([
      { id: 'chunk-1', score: 0.9, metadata: {}, content: 'content' },
    ]);
    queryRepository.seedTagChunkIds('nonexistent', []);

    const result = await useCase.execute({
      query: 'test',
      tags: ['nonexistent'],
    });

    expect(result).toHaveLength(0);
  });
});
