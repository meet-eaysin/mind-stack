import { Test, TestingModule } from '@nestjs/testing';
import { RemoveItemFromLearningGoalUseCase } from '../remove-item-from-learning-goal.use-case.js';
import { PrismaLearningGoalRepository } from '../../infrastructure/prisma-learning-goal.repository.js';

describe('RemoveItemFromLearningGoalUseCase', () => {
  let useCase: RemoveItemFromLearningGoalUseCase;

  const mockRepository = {
    removeItem: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: RemoveItemFromLearningGoalUseCase,
          useFactory: (repo: PrismaLearningGoalRepository) =>
            new RemoveItemFromLearningGoalUseCase(repo),
          inject: [PrismaLearningGoalRepository],
        },
        {
          provide: PrismaLearningGoalRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<RemoveItemFromLearningGoalUseCase>(
      RemoveItemFromLearningGoalUseCase,
    );
  });

  it('should remove an item from a goal', async () => {
    await useCase.execute('item1');
    expect(mockRepository.removeItem).toHaveBeenCalledWith('item1');
  });
});
