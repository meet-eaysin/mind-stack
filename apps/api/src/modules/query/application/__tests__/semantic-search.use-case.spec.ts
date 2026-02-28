import { SemanticSearchUseCase } from '@/modules/query/application/semantic-search.use-case';
import { INGESTION_STATUS } from '@repo/shared-types';
import type { EmbeddingProvider, EmbeddingResult } from '@repo/embeddings';
import type { LlmProviderFactoryPort } from '@/modules/settings/application/llm-provider.factory';
import type {
  VectorStore,
  VectorDocument,
  VectorSearchResult,
  VectorSearchOptions,
} from '@repo/vector-store';
import type {
  QueryRepository,
  QueryChunkDetail,
} from '@/modules/query/domain/query-repository.interface';

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

class FakeLlmProviderFactory implements LlmProviderFactoryPort {
  constructor(private readonly embedding: EmbeddingProvider) {}

  async getEmbeddingProvider(_userId: string): Promise<EmbeddingProvider> {
    return this.embedding;
  }

  async getGenerationProvider(): Promise<never> {
    throw new Error('Generation provider not used in this test');
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

describe('SemanticSearchUseCase', () => {
  let useCase: SemanticSearchUseCase;
  let embeddingProvider: FakeEmbeddingProvider;
  let providerFactory: FakeLlmProviderFactory;
  let vectorStore: FakeVectorStore;
  let queryRepository: FakeQueryRepository;

  beforeEach(() => {
    embeddingProvider = new FakeEmbeddingProvider();
    providerFactory = new FakeLlmProviderFactory(embeddingProvider);
    vectorStore = new FakeVectorStore();
    queryRepository = new FakeQueryRepository();
    useCase = new SemanticSearchUseCase(
      providerFactory,
      vectorStore,
      queryRepository,
    );
  });

  it('should embed the query, search vectors, merge with metadata, and return ranked results', async () => {
    vectorStore.setResults([
      { id: 'chunk-1', score: 0.95, metadata: {}, content: 'vector content 1' },
      { id: 'chunk-2', score: 0.8, metadata: {}, content: 'vector content 2' },
    ]);

    queryRepository.seed([
      {
        chunkId: 'chunk-1',
        content: 'detailed content 1',
        documentTitle: 'Doc A',
        author: null,
        publishedAt: null,
        sourceUrl: null,
        importanceScore: 4,
        tags: ['ts'],
        createdAt: new Date('2025-01-01T00:00:00Z'),
        hasNote: false,
        reviewCount: 0,
        documentStatus: INGESTION_STATUS.READY,
        documentId: 'doc-1',
      },
      {
        chunkId: 'chunk-2',
        content: 'detailed content 2',
        documentTitle: 'Doc B',
        author: null,
        publishedAt: null,
        sourceUrl: null,
        importanceScore: 2,
        tags: [],
        createdAt: new Date('2025-01-01T00:00:00Z'),
        hasNote: false,
        reviewCount: 0,
        documentStatus: INGESTION_STATUS.READY,
        documentId: 'doc-1',
      },
    ]);

    const result = await useCase.execute({
      query: 'test query',
      topK: 5,
      userId: 'default',
    });

    expect(result).toHaveLength(2);
    expect(result[0]?.chunkId).toBe('chunk-1');
    expect(result[0]?.content).toBe('detailed content 1');
    expect(result[0]?.documentTitle).toBe('Doc A');
    expect(typeof result[0]?.score).toBe('number');
  });

  it('should return an empty array when vector search returns no results', async () => {
    vectorStore.setResults([]);

    const result = await useCase.execute({
      query: 'unknown',
      topK: 5,
      userId: 'default',
    });

    expect(result).toHaveLength(0);
  });

  it('should default topK to 10 when not provided', async () => {
    const searchSpy = jest.spyOn(vectorStore, 'search');
    vectorStore.setResults([]);

    await useCase.execute({ query: 'test', userId: 'default' });

    expect(searchSpy).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ topK: 10 }),
    );
  });
});
