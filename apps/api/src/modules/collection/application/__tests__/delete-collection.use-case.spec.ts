import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DeleteCollectionUseCase } from '../delete-collection.use-case.js';
import { PrismaCollectionRepository } from '../../infrastructure/prisma-collection.repository.js';

describe('DeleteCollectionUseCase', () => {
  let useCase: DeleteCollectionUseCase;

  const mockRepository = {
    findById: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: DeleteCollectionUseCase,
          useFactory: (repo: PrismaCollectionRepository) =>
            new DeleteCollectionUseCase(repo),
          inject: [PrismaCollectionRepository],
        },
        {
          provide: PrismaCollectionRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<DeleteCollectionUseCase>(DeleteCollectionUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should delete a collection when it exists', async () => {
    mockRepository.findById.mockResolvedValue({ id: '1' });
    mockRepository.delete.mockResolvedValue(undefined);

    await useCase.execute('1');

    expect(mockRepository.findById).toHaveBeenCalledWith('1');
    expect(mockRepository.delete).toHaveBeenCalledWith('1');
  });

  it('should throw NotFoundException when collection not found', async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute('invalid')).rejects.toThrow(NotFoundException);
    expect(mockRepository.delete).not.toHaveBeenCalled();
  });
});
