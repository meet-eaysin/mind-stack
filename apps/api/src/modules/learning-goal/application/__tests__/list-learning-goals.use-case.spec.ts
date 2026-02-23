import { Test, TestingModule } from '@nestjs/testing';
import { ListLearningGoalsUseCase } from '../list-learning-goals.use-case.js';
import { PrismaLearningGoalRepository } from '../../infrastructure/prisma-learning-goal.repository.js';

describe('ListLearningGoalsUseCase', () => {
  let useCase: ListLearningGoalsUseCase;

  const mockGoals = [
    {
      id: '1',
      name: 'Goal 1',
      deadline: new Date(),
      progress: 50,
      itemCount: 2,
      createdAt: new Date(),
      deletedAt: null,
      updatedAt: new Date(),
    },
  ];

  const mockRepository = {
    findAll: jest.fn().mockResolvedValue(mockGoals),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: ListLearningGoalsUseCase,
          useFactory: (repo: PrismaLearningGoalRepository) =>
            new ListLearningGoalsUseCase(repo),
          inject: [PrismaLearningGoalRepository],
        },
        {
          provide: PrismaLearningGoalRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<ListLearningGoalsUseCase>(ListLearningGoalsUseCase);
  });

  it('should return formatted learning goals', async () => {
    const result = await useCase.execute();
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('1');
    expect(result[0]!.deadline).toBe(mockGoals[0]!.deadline.toISOString());
    expect(mockRepository.findAll).toHaveBeenCalled();
  });
});
