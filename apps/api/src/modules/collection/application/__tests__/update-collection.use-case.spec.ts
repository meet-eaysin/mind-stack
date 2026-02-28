import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UpdateCollectionUseCase } from '@/modules/collection/application/update-collection.use-case';
import { PrismaCollectionRepository } from '@/modules/collection/infrastructure/prisma-collection.repository';

describe('UpdateCollectionUseCase', () => {
  let useCase: UpdateCollectionUseCase;

  const mockCollection = {
    id: '1',
    name: 'Collection 1',
    description: 'Desc 1',
    goal: 'Goal 1',
    createdAt: new Date(),
    deletedAt: null,
    updatedAt: new Date(),
  };

  const mockRepository = {
    findById: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: UpdateCollectionUseCase,
          useFactory: (repo: PrismaCollectionRepository) =>
            new UpdateCollectionUseCase(repo),
          inject: [PrismaCollectionRepository],
        },
        {
          provide: PrismaCollectionRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<UpdateCollectionUseCase>(UpdateCollectionUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should update a collection when it exists', async () => {
    const input = { name: 'Updated Name' };
    mockRepository.findById.mockResolvedValue(mockCollection);
    mockRepository.update.mockResolvedValue({ ...mockCollection, ...input });

    const result = await useCase.execute('1', input);

    expect(result.name).toBe('Updated Name');
    expect(mockRepository.findById).toHaveBeenCalledWith('1');
    expect(mockRepository.update).toHaveBeenCalledWith('1', input);
  });

  it('should throw NotFoundException when collection not found', async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('invalid', { name: 'foo' })).rejects.toThrow(
      NotFoundException,
    );
  });
});
