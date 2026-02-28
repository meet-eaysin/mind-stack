import { Test, TestingModule } from '@nestjs/testing';
import { CreateCollectionUseCase } from '@/modules/collection/application/create-collection.use-case';
import { PrismaCollectionRepository } from '@/modules/collection/infrastructure/prisma-collection.repository';

describe('CreateCollectionUseCase', () => {
  let useCase: CreateCollectionUseCase;

  const mockRepository = {
    save: jest
      .fn()
      .mockImplementation((collection) => Promise.resolve(collection)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: CreateCollectionUseCase,
          useFactory: (repo: PrismaCollectionRepository) =>
            new CreateCollectionUseCase(repo),
          inject: [PrismaCollectionRepository],
        },
        {
          provide: PrismaCollectionRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateCollectionUseCase>(CreateCollectionUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a collection with provided data', async () => {
    const input = {
      name: 'Test Collection',
      description: 'Test Description',
      goal: 'Test Goal',
    };

    const result = await useCase.execute(input);

    expect(result.id).toBeDefined();
    expect(result.name).toBe(input.name);
    expect(result.description).toBe(input.description);
    expect(result.goal).toBe(input.goal);
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
    expect(mockRepository.save).toHaveBeenCalledWith(result);
  });

  it('should create a collection with null description and goal if not provided', async () => {
    const input = {
      name: 'Test Collection',
    };

    const result = await useCase.execute(input);

    expect(result.description).toBeNull();
    expect(result.goal).toBeNull();
  });
});
