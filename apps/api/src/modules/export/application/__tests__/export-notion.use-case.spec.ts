import { ExportNotionUseCase } from '../export-notion.use-case.js';
import type { QueryRepository } from '../../../query/domain/query-repository.interface.js';

// ── Fakes ──

class FakeQueryRepository implements QueryRepository {
  private chunks: Array<{
    chunkId: string;
    content: string;
    documentTitle: string;
    importanceScore: number | null;
    tags: string[];
    createdAt: Date;
  }> = [];

  seed(
    chunks: Array<{
      chunkId: string;
      content: string;
      documentTitle: string;
      importanceScore: number | null;
      tags: string[];
      createdAt: Date;
    }>,
  ): void {
    this.chunks = chunks;
  }

  findChunksByIds(chunkIds: string[]): Promise<
    Array<{
      chunkId: string;
      content: string;
      documentTitle: string;
      importanceScore: number | null;
      tags: string[];
      createdAt: Date;
    }>
  > {
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
}

// ── Tests ──

describe('ExportNotionUseCase', () => {
  let useCase: ExportNotionUseCase;
  let queryRepository: FakeQueryRepository;

  beforeEach(() => {
    queryRepository = new FakeQueryRepository();
    useCase = new ExportNotionUseCase(queryRepository);
  });

  it('should fetch chunks and return Notion blocks', async () => {
    queryRepository.seed([
      {
        chunkId: 'chunk-1',
        content: 'NestJS is a framework',
        documentTitle: 'NestJS Docs',
        importanceScore: 4,
        tags: ['nestjs'],
        createdAt: new Date('2025-01-01T00:00:00Z'),
      },
    ]);

    const result = await useCase.execute(['chunk-1']);

    const heading1 = result.find((b) => b.type === 'heading_1');
    expect(heading1?.content).toBe('Exported Knowledge');

    const heading2 = result.find((b) => b.type === 'heading_2');
    expect(heading2?.content).toBe('NestJS Docs');

    const paragraph = result.find((b) => b.type === 'paragraph');
    expect(paragraph?.content).toBe('NestJS is a framework');

    const callout = result.find((b) => b.type === 'callout');
    expect(callout?.content).toContain('nestjs');
  });

  it('should return only the heading block when no chunks match', async () => {
    queryRepository.seed([]);

    const result = await useCase.execute(['nonexistent']);

    expect(result).toHaveLength(1);
    expect(result[0]?.type).toBe('heading_1');
  });
});
