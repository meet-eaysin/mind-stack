import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetLearningGoalUseCase } from '../get-learning-goal.use-case.js';
import { PrismaLearningGoalRepository } from '../../infrastructure/prisma-learning-goal.repository.js';

describe('GetLearningGoalUseCase', () => {
  let useCase: GetLearningGoalUseCase;

  const mockGoal = {
    id: '1',
    name: 'Goal 1',
    deadline: new Date(),
    progress: 50,
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [
      {
        id: 'item-1',
        collectionId: 'c1',
        collectionName: 'Col 1',
        documentId: null,
        documentTitle: null,
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
          provide: GetLearningGoalUseCase,
          useFactory: (repo: PrismaLearningGoalRepository) =>
            new GetLearningGoalUseCase(repo),
          inject: [PrismaLearningGoalRepository],
        },
        {
          provide: PrismaLearningGoalRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<GetLearningGoalUseCase>(GetLearningGoalUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return goal detail when found', async () => {
    mockRepository.findWithItems.mockResolvedValue(mockGoal);
    const result = await useCase.execute('1');
    expect(result.id).toBe('1');
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.collectionName).toBe('Col 1');
  });

  it('should throw NotFoundException when not found', async () => {
    mockRepository.findWithItems.mockResolvedValue(null);
    await expect(useCase.execute('invalid')).rejects.toThrow(NotFoundException);
  });
});
