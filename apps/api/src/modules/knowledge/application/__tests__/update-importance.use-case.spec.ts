import { UpdateImportanceUseCase } from '@/modules/knowledge/application/update-importance.use-case';
import type { DocumentRepository } from '@/modules/ingestion/domain/document-repository.interface';
import type { DocumentEntity } from '@/modules/ingestion/domain/document.entity';
import { type IngestionStatus, type LearningStatus } from '@repo/shared-types';

// ── Fakes ──

class FakeDocumentRepository implements DocumentRepository {
  private readonly importance: Map<string, number> = new Map();

  async save(_document: DocumentEntity): Promise<DocumentEntity> {
    return Promise.resolve(_document);
  }

  async findById(_id: string): Promise<DocumentEntity | null> {
    return Promise.resolve(null);
  }

  async findAll(): Promise<DocumentEntity[]> {
    return Promise.resolve([]);
  }

  async findBySourceUrl(
    _url: string,
    _userId: string,
  ): Promise<DocumentEntity | null> {
    return Promise.resolve(null);
  }

  async updateStatus(_id: string, _status: IngestionStatus): Promise<void> {
    return Promise.resolve();
  }

  async updateProcessingError(
    _id: string,
    _errorMessage: string | null,
  ): Promise<void> {
    return Promise.resolve();
  }

  async updateImportance(id: string, score: number): Promise<void> {
    this.importance.set(id, score);
    return Promise.resolve();
  }

  async getImportance(id: string): Promise<number | null> {
    return Promise.resolve(this.importance.get(id) ?? null);
  }

  async addStatusHistory(
    _documentId: string,
    _status: IngestionStatus,
    _learningStatus: LearningStatus,
  ): Promise<void> {
    return Promise.resolve();
  }

  async delete(_id: string): Promise<void> {
    return Promise.resolve();
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
