import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DeleteLearningGoalUseCase } from '@/modules/learning-goal/application/delete-learning-goal.use-case';
import { PrismaLearningGoalRepository } from '@/modules/learning-goal/infrastructure/prisma-learning-goal.repository';

describe('DeleteLearningGoalUseCase', () => {
  let useCase: DeleteLearningGoalUseCase;

  const mockRepository = {
    findById: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: DeleteLearningGoalUseCase,
          useFactory: (repo: PrismaLearningGoalRepository) =>
            new DeleteLearningGoalUseCase(repo),
          inject: [PrismaLearningGoalRepository],
        },
        {
          provide: PrismaLearningGoalRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    useCase = module.get<DeleteLearningGoalUseCase>(DeleteLearningGoalUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should delete a goal when it exists', async () => {
    mockRepository.findById.mockResolvedValue({ id: '1' });
    mockRepository.delete.mockResolvedValue(undefined);

    await useCase.execute('1');

    expect(mockRepository.delete).toHaveBeenCalledWith('1');
  });

  it('should throw NotFoundException when goal not found', async () => {
    mockRepository.findById.mockResolvedValue(null);
    await expect(useCase.execute('invalid')).rejects.toThrow(NotFoundException);
  });
});
