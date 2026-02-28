import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UpdateLearningGoalUseCase } from '@/modules/learning-goal/application/update-learning-goal.use-case';
import { PrismaLearningGoalRepository } from '@/modules/learning-goal/infrastructure/prisma-learning-goal.repository';

describe('UpdateLearningGoalUseCase', () => {
  let useCase: UpdateLearningGoalUseCase;

  const mockGoal = {
    id: '1',
    name: 'Goal 1',
    deadline: new Date(),
    progress: 50,
  };

  const mockRepository = {
    findById: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: UpdateLearningGoalUseCase,
          useFactory: (repo: PrismaLearningGoalRepository) =>
            new UpdateLearningGoalUseCase(repo),
          inject: [PrismaLearningGoalRepository],
        },
        {
          provide: PrismaLearningGoalRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<UpdateLearningGoalUseCase>(UpdateLearningGoalUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should update a goal when it exists', async () => {
    const input = { name: 'Updated Goal', progress: 75 };
    mockRepository.findById.mockResolvedValue(mockGoal);
    mockRepository.update.mockResolvedValue({ ...mockGoal, ...input });

    const result = await useCase.execute('1', input);

    expect(result.name).toBe('Updated Goal');
    expect(mockRepository.update).toHaveBeenCalledWith(
      '1',
      expect.objectContaining({
        name: 'Updated Goal',
        progress: 75,
      }),
    );
  });

  it('should throw NotFoundException when goal not found', async () => {
    mockRepository.findById.mockResolvedValue(null);
    await expect(useCase.execute('invalid', { name: 'foo' })).rejects.toThrow(
      NotFoundException,
    );
  });
});
