import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RemoveDocumentFromCollectionUseCase } from '../remove-document-from-collection.use-case.js';
import { PrismaCollectionRepository } from '../../infrastructure/prisma-collection.repository.js';

describe('RemoveDocumentFromCollectionUseCase', () => {
  let useCase: RemoveDocumentFromCollectionUseCase;

  const mockRepository = {
    findItemByCollectionAndDocument: jest.fn(),
    removeItem: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: RemoveDocumentFromCollectionUseCase,
          useFactory: (repo: PrismaCollectionRepository) =>
            new RemoveDocumentFromCollectionUseCase(repo),
          inject: [PrismaCollectionRepository],
        },
        {
          provide: PrismaCollectionRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<RemoveDocumentFromCollectionUseCase>(
      RemoveDocumentFromCollectionUseCase,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should remove a document from a collection when it exists', async () => {
    mockRepository.findItemByCollectionAndDocument.mockResolvedValue({
      id: 'item1',
    });
    mockRepository.removeItem.mockResolvedValue(undefined);

    await useCase.execute('c1', 'd1');

    expect(mockRepository.findItemByCollectionAndDocument).toHaveBeenCalledWith(
      'c1',
      'd1',
    );
    expect(mockRepository.removeItem).toHaveBeenCalledWith('item1');
  });

  it('should throw NotFoundException when document is not in collection', async () => {
    mockRepository.findItemByCollectionAndDocument.mockResolvedValue(null);

    await expect(useCase.execute('c1', 'd1')).rejects.toThrow(
      NotFoundException,
    );
    expect(mockRepository.removeItem).not.toHaveBeenCalled();
  });
});
