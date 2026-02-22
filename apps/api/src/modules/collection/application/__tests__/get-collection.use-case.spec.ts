import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetCollectionUseCase } from '../get-collection.use-case.js';
import { PrismaCollectionRepository } from '../../infrastructure/prisma-collection.repository.js';

describe('GetCollectionUseCase', () => {
  let useCase: GetCollectionUseCase;

  const mockCollection = {
    id: '1',
    name: 'Col 1',
    description: 'Desc 1',
    goal: 'Goal 1',
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      {
        id: 'item1',
        documentId: 'doc1',
        documentTitle: 'Doc 1',
        learningStatus: 'NEW',
        order: 1,
        prerequisiteId: null,
      },
    ],
  };

  const mockRepository = {
    findWithItems: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: GetCollectionUseCase,
          useFactory: (repo: PrismaCollectionRepository) =>
            new GetCollectionUseCase(repo),
          inject: [PrismaCollectionRepository],
        },
        {
          provide: PrismaCollectionRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetCollectionUseCase>(GetCollectionUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return collection details when found', async () => {
    mockRepository.findWithItems.mockResolvedValue(mockCollection);

    const result = await useCase.execute('1');

    expect(result.id).toBe('1');
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.documentId).toBe('doc1');
    expect(mockRepository.findWithItems).toHaveBeenCalledWith('1');
  });

  it('should throw NotFoundException when collection not found', async () => {
    mockRepository.findWithItems.mockResolvedValue(null);

    await expect(useCase.execute('invalid')).rejects.toThrow(NotFoundException);
    expect(mockRepository.findWithItems).toHaveBeenCalledWith('invalid');
  });
});
