import { UpdateImportanceUseCase } from '../update-importance.use-case.js';
import type { DocumentRepository } from '../../../ingestion/domain/document-repository.interface.js';
import type { DocumentEntity } from '../../../ingestion/domain/document.entity.js';
import type { IngestionStatus } from '@repo/shared-types';

// ── Fakes ──

class FakeDocumentRepository implements DocumentRepository {
  private readonly importance: Map<string, number> = new Map();

  save(_document: DocumentEntity): Promise<DocumentEntity> {
    return Promise.resolve(_document);
  }

  findById(_id: string): Promise<DocumentEntity | null> {
    return Promise.resolve(null);
  }

  findAll(): Promise<DocumentEntity[]> {
    return Promise.resolve([]);
  }

  findBySourceUrl(_url: string): Promise<DocumentEntity | null> {
    return Promise.resolve(null);
  }

  updateStatus(_id: string, _status: IngestionStatus): Promise<void> {
    return Promise.resolve();
  }

  updateImportance(id: string, score: number): Promise<void> {
    this.importance.set(id, score);
    return Promise.resolve();
  }

  getImportance(id: string): Promise<number | null> {
    return Promise.resolve(this.importance.get(id) ?? null);
  }
}

// ── Tests ──

describe('UpdateImportanceUseCase', () => {
  let useCase: UpdateImportanceUseCase;
  let documentRepository: FakeDocumentRepository;

  beforeEach(() => {
    documentRepository = new FakeDocumentRepository();
    useCase = new UpdateImportanceUseCase(documentRepository);
  });

  it('should update importance score for valid scores', async () => {
    await useCase.execute({ documentId: 'doc-1', score: 4 });

    const score = await documentRepository.getImportance('doc-1');
    expect(score).toBe(4);
  });

  it('should accept the minimum score of 1', async () => {
    await useCase.execute({ documentId: 'doc-1', score: 1 });

    const score = await documentRepository.getImportance('doc-1');
    expect(score).toBe(1);
  });

  it('should accept the maximum score of 5', async () => {
    await useCase.execute({ documentId: 'doc-1', score: 5 });

    const score = await documentRepository.getImportance('doc-1');
    expect(score).toBe(5);
  });

  it('should throw when score is below 1', async () => {
    await expect(
      useCase.execute({ documentId: 'doc-1', score: 0 }),
    ).rejects.toThrow('Importance score must be between 1 and 5');
  });

  it('should throw when score is above 5', async () => {
    await expect(
      useCase.execute({ documentId: 'doc-1', score: 6 }),
    ).rejects.toThrow('Importance score must be between 1 and 5');
  });
});
