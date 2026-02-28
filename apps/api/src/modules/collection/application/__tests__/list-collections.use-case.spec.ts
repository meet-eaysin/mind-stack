import { Test, TestingModule } from '@nestjs/testing';
import { ListCollectionsUseCase } from '@/modules/collection/application/list-collections.use-case';
import { PrismaCollectionRepository } from '@/modules/collection/infrastructure/prisma-collection.repository';

describe('ListCollectionsUseCase', () => {
  let useCase: ListCollectionsUseCase;

  const mockCollections = [
    {
      id: '1',
      name: 'Collection 1',
      description: 'Desc 1',
      itemCount: 5,
      progress: 50,
      createdAt: new Date(),
      deletedAt: null,
      updatedAt: new Date(),
    },
    {
      id: '2',
      name: 'Collection 2',
      description: 'Desc 2',
      itemCount: 3,
      progress: 20,
      createdAt: new Date(),
      deletedAt: null,
      updatedAt: new Date(),
    },
  ];

  const mockRepository = {
    findAll: jest.fn().mockResolvedValue(mockCollections),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ListCollectionsUseCase,
          useFactory: (repo: PrismaCollectionRepository) =>
            new ListCollectionsUseCase(repo),
          inject: [PrismaCollectionRepository],
        },
        {
          provide: PrismaCollectionRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<ListCollectionsUseCase>(ListCollectionsUseCase);
  });

  it('should return a list of formatted collections', async () => {
    const result = await useCase.execute();

    expect(result).toHaveLength(2);
    expect(result[0]!.id).toBe('1');
    expect(result[0]!.name).toBe('Collection 1');
    expect(result[0]!.itemCount).toBe(5);
    expect(result[0]!.progress).toBe(50);
    expect(typeof result[0]!.createdAt).toBe('string');
    expect(result[1]!.id).toBe('2');
    expect(mockRepository.findAll).toHaveBeenCalled();
  });
});
