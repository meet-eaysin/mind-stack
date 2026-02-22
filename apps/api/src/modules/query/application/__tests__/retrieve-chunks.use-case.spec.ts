import { RetrieveChunksUseCase } from '../retrieve-chunks.use-case.js';
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
    _options?: VectorSearchOptions,
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

describe('RetrieveChunksUseCase', () => {
  let useCase: RetrieveChunksUseCase;
  let embeddingProvider: FakeEmbeddingProvider;
  let vectorStore: FakeVectorStore;
  let queryRepository: FakeQueryRepository;

  beforeEach(() => {
    embeddingProvider = new FakeEmbeddingProvider();
    vectorStore = new FakeVectorStore();
    queryRepository = new FakeQueryRepository();
    useCase = new RetrieveChunksUseCase(
      embeddingProvider,
      vectorStore,
      queryRepository,
    );
  });

  it('should return chunks with merged metadata from the repository', async () => {
    vectorStore.setResults([
      { id: 'chunk-1', score: 0.9, metadata: {}, content: 'vector content' },
    ]);
    queryRepository.seed([
      {
        chunkId: 'chunk-1',
        content: 'detailed content',
        documentTitle: 'My Doc',
        author: null,
        publishedAt: null,
        sourceUrl: null,
        importanceScore: 4,
        tags: ['test'],
        createdAt: new Date('2025-01-01T00:00:00Z'),
        hasNote: false,
        reviewCount: 0,
        documentStatus: INGESTION_STATUS.READY,
        documentId: 'doc-1',
      },
    ]);

    const result = await useCase.execute({ query: 'search', topK: 5 });

    expect(result).toHaveLength(1);
    expect(result[0]?.chunkId).toBe('chunk-1');
    expect(result[0]?.content).toBe('detailed content');
    expect(result[0]?.documentTitle).toBe('My Doc');
    expect(result[0]?.score).toBe(0.9);
    expect(result[0]?.tags).toEqual(['test']);
  });

  it('should return an empty array when no vector results are found', async () => {
    vectorStore.setResults([]);

    const result = await useCase.execute({ query: 'nothing' });

    expect(result).toHaveLength(0);
  });

  it('should fallback to vector content when repository has no matching chunk', async () => {
    vectorStore.setResults([
      { id: 'chunk-x', score: 0.85, metadata: {}, content: 'fallback content' },
    ]);
    queryRepository.seed([]);

    const result = await useCase.execute({ query: 'test' });

    expect(result).toHaveLength(1);
    expect(result[0]?.content).toBe('fallback content');
    expect(result[0]?.documentTitle).toBe('');
  });
});
