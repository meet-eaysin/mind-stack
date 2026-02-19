import { UpdateImportanceUseCase } from '../update-importance.use-case.js';
import type {
  ChunkRepository,
  ChunkWithMeta,
} from '../../domain/chunk-repository.interface.js';
import type { ChunkEntity } from '../../domain/chunk.entity.js';

// ── Fakes ──

class FakeChunkRepository implements ChunkRepository {
  private readonly importance: Map<string, number> = new Map();

  findByDocumentId(_documentId: string): Promise<ChunkWithMeta[]> {
    return Promise.resolve([]);
  }

  findById(_chunkId: string): Promise<ChunkWithMeta | null> {
    return Promise.resolve(null);
  }

  createMany(
    _documentId: string,
    _chunks: Array<{ content: string; startOffset: number; endOffset: number }>,
  ): Promise<ChunkEntity[]> {
    return Promise.resolve([]);
  }

  updateImportance(chunkId: string, score: number): Promise<void> {
    this.importance.set(chunkId, score);
    return Promise.resolve();
  }

  getImportance(chunkId: string): number | undefined {
    return this.importance.get(chunkId);
  }
}

// ── Tests ──

describe('UpdateImportanceUseCase', () => {
  let useCase: UpdateImportanceUseCase;
  let chunkRepository: FakeChunkRepository;

  beforeEach(() => {
    chunkRepository = new FakeChunkRepository();
    useCase = new UpdateImportanceUseCase(chunkRepository);
  });

  it('should update importance score for valid scores', async () => {
    await useCase.execute({ chunkId: 'chunk-1', score: 4 });

    expect(chunkRepository.getImportance('chunk-1')).toBe(4);
  });

  it('should accept the minimum score of 1', async () => {
    await useCase.execute({ chunkId: 'chunk-1', score: 1 });

    expect(chunkRepository.getImportance('chunk-1')).toBe(1);
  });

  it('should accept the maximum score of 5', async () => {
    await useCase.execute({ chunkId: 'chunk-1', score: 5 });

    expect(chunkRepository.getImportance('chunk-1')).toBe(5);
  });

  it('should throw when score is below 1', async () => {
    await expect(
      useCase.execute({ chunkId: 'chunk-1', score: 0 }),
    ).rejects.toThrow('Importance score must be between 1 and 5');
  });

  it('should throw when score is above 5', async () => {
    await expect(
      useCase.execute({ chunkId: 'chunk-1', score: 6 }),
    ).rejects.toThrow('Importance score must be between 1 and 5');
  });
});
