import { Test, TestingModule } from '@nestjs/testing';
import { CreateLearningGoalUseCase } from '../create-learning-goal.use-case.js';

import { PrismaLearningGoalRepository } from '../../infrastructure/prisma-learning-goal.repository.js';

describe('CreateLearningGoalUseCase', () => {
  let useCase: CreateLearningGoalUseCase;

  const mockRepository = {
    save: jest.fn().mockImplementation((goal) => Promise.resolve(goal)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: CreateLearningGoalUseCase,
          useFactory: (repo: PrismaLearningGoalRepository) =>
            new CreateLearningGoalUseCase(repo),
          inject: [PrismaLearningGoalRepository],
        },
        {
          provide: PrismaLearningGoalRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<CreateLearningGoalUseCase>(CreateLearningGoalUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a learning goal with provided data', async () => {
    const input = {
      name: 'Learn AI',
      deadline: '2026-12-31',
    };

    const result = await useCase.execute(input);

    expect(result.id).toBeDefined();
    expect(result.name).toBe(input.name);
    expect(result.deadline).toEqual(new Date(input.deadline!));
    expect(mockRepository.save).toHaveBeenCalled();
  });

  it('should create a goal with no deadline if not provided', async () => {
    const input = { name: 'Learn AI' };
    const result = await useCase.execute(input);
    expect(result.deadline).toBeNull();
  });
});
