import { FilteredSearchUseCase } from '../filtered-search.use-case.js';
import { INGESTION_STATUS } from '@repo/shared-types';
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

  async getByIds(_ids: string[]): Promise<string[]> {
    return [];
  }

  async getAllIds(): Promise<string[]> {
    return [];
  }

  async upsert(_documents: VectorDocument[]): Promise<void> {
    return Promise.resolve();
  }

  async search(
    _embedding: number[],
    _options: VectorSearchOptions,
  ): Promise<VectorSearchResult[]> {
    return Promise.resolve(this.results);
  }

  async delete(_ids: string[]): Promise<void> {
    return Promise.resolve();
  }

  async count(): Promise<number> {
    return Promise.resolve(this.results.length);
  }
}

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
    return Promise.resolve(['chunk-1']);
  }

  findChunksByDateRange(_from: Date, _to: Date): Promise<string[]> {
    return Promise.resolve(['chunk-1']);
  }

  async findChunksByFilters(): Promise<string[]> {
    return ['chunk-1'];
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

  it('should search with filters and return ranked results', async () => {
    vectorStore.setResults([
      { id: 'chunk-1', score: 0.9, metadata: {}, content: 'content' },
    ]);
    queryRepository.seed([
      {
        chunkId: 'chunk-1',
        content: 'detailed content',
        documentTitle: 'Doc',
        author: null,
        publishedAt: null,
        sourceUrl: null,
        importanceScore: 3,
        tags: ['tag1'],
        createdAt: new Date(),
        hasNote: false,
        reviewCount: 0,
        documentStatus: INGESTION_STATUS.READY,
        documentId: 'doc-1',
      },
    ]);

    const result = await useCase.execute({
      query: 'test',
      tags: ['tag1'],
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.chunkId).toBe('chunk-1');
  });

  it('should exclude chunks that belong to non-ready documents', async () => {
    vectorStore.setResults([
      { id: 'chunk-ready', score: 0.95, metadata: {}, content: 'ready' },
      {
        id: 'chunk-processing',
        score: 0.99,
        metadata: {},
        content: 'processing',
      },
    ]);
    queryRepository.seed([
      {
        chunkId: 'chunk-ready',
        content: 'ready content',
        documentTitle: 'Ready doc',
        author: null,
        publishedAt: null,
        sourceUrl: null,
        importanceScore: 3,
        tags: ['tag1'],
        createdAt: new Date(),
        hasNote: false,
        reviewCount: 0,
        documentStatus: INGESTION_STATUS.READY,
        documentId: 'doc-ready',
      },
      {
        chunkId: 'chunk-processing',
        content: 'processing content',
        documentTitle: 'Processing doc',
        author: null,
        publishedAt: null,
        sourceUrl: null,
        importanceScore: 3,
        tags: ['tag1'],
        createdAt: new Date(),
        hasNote: false,
        reviewCount: 0,
        documentStatus: INGESTION_STATUS.INITIALIZING,
        documentId: 'doc-processing',
      },
    ]);

    const result = await useCase.execute({
      query: 'test',
      topK: 5,
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.chunkId).toBe('chunk-ready');
  });
});
