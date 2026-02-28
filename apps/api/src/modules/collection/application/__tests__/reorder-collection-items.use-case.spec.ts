import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ReorderCollectionItemsUseCase } from '@/modules/collection/application/reorder-collection-items.use-case';
import { PrismaCollectionRepository } from '@/modules/collection/infrastructure/prisma-collection.repository';

describe('ReorderCollectionItemsUseCase', () => {
  let useCase: ReorderCollectionItemsUseCase;

  const mockRepository = {
    findWithItems: jest.fn(),
    updateItemOrder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ReorderCollectionItemsUseCase,
          useFactory: (repo: PrismaCollectionRepository) =>
            new ReorderCollectionItemsUseCase(repo),
          inject: [PrismaCollectionRepository],
        },
        {
          provide: PrismaCollectionRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<ReorderCollectionItemsUseCase>(
      ReorderCollectionItemsUseCase,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should reorder items in a collection', async () => {
    mockRepository.findWithItems.mockResolvedValue({
      id: 'c1',
      items: [{ id: 'i1' }, { id: 'i2' }],
    });
    mockRepository.updateItemOrder.mockResolvedValue(undefined);

    await useCase.execute('c1', ['i2', 'i1']);

    expect(mockRepository.findWithItems).toHaveBeenCalledWith('c1');
    expect(mockRepository.updateItemOrder).toHaveBeenCalledWith('i2', 0);
    expect(mockRepository.updateItemOrder).toHaveBeenCalledWith('i1', 1);
  });

  it('should throw NotFoundException when collection not found', async () => {
    mockRepository.findWithItems.mockResolvedValue(null);

    await expect(useCase.execute('invalid', ['i1'])).rejects.toThrow(
      NotFoundException,
    );
  });
});
