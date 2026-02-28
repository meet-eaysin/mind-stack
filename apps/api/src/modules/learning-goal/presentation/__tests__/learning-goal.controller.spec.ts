import { Test, type TestingModule } from '@nestjs/testing';
import { LearningGoalController } from '@/modules/learning-goal/presentation/learning-goal.controller';
import { CreateLearningGoalUseCase } from '@/modules/learning-goal/application/create-learning-goal.use-case';
import { ListLearningGoalsUseCase } from '@/modules/learning-goal/application/list-learning-goals.use-case';
import { GetLearningGoalUseCase } from '@/modules/learning-goal/application/get-learning-goal.use-case';
import { UpdateLearningGoalUseCase } from '@/modules/learning-goal/application/update-learning-goal.use-case';
import { DeleteLearningGoalUseCase } from '@/modules/learning-goal/application/delete-learning-goal.use-case';
import { AddItemToLearningGoalUseCase } from '@/modules/learning-goal/application/add-item-to-learning-goal.use-case';
import { RemoveItemFromLearningGoalUseCase } from '@/modules/learning-goal/application/remove-item-from-learning-goal.use-case';

describe('LearningGoalController', () => {
  let controller: LearningGoalController;

  const mockCreateGoal = { execute: jest.fn() };
  const mockListGoals = { execute: jest.fn() };
  const mockGetGoal = { execute: jest.fn() };
  const mockUpdateGoal = { execute: jest.fn() };
  const mockDeleteGoal = { execute: jest.fn() };
  const mockAddItem = { execute: jest.fn() };
  const mockRemoveItem = { execute: jest.fn() };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [LearningGoalController],
      providers: [
        { provide: CreateLearningGoalUseCase, useValue: mockCreateGoal },
        { provide: ListLearningGoalsUseCase, useValue: mockListGoals },
        { provide: GetLearningGoalUseCase, useValue: mockGetGoal },
        { provide: UpdateLearningGoalUseCase, useValue: mockUpdateGoal },
        { provide: DeleteLearningGoalUseCase, useValue: mockDeleteGoal },
        { provide: AddItemToLearningGoalUseCase, useValue: mockAddItem },
        {
          provide: RemoveItemFromLearningGoalUseCase,
          useValue: mockRemoveItem,
        },
      ],
    }).compile();

    controller = moduleFixture.get(LearningGoalController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates, lists and gets goals', async () => {
    const goal = { id: 'goal-1', name: 'New Goal' };
    mockCreateGoal.execute.mockResolvedValue(goal);
    mockListGoals.execute.mockResolvedValue([goal]);
    mockGetGoal.execute.mockResolvedValue(goal);

    await expect(controller.create({ name: 'New Goal' })).resolves.toEqual(
      goal,
    );
    await expect(controller.list()).resolves.toEqual([goal]);
    await expect(controller.get('goal-1')).resolves.toEqual(goal);
  });

  it('updates, deletes and manages goal items', async () => {
    mockUpdateGoal.execute.mockResolvedValue({ id: 'goal-1', name: 'Updated' });
    mockDeleteGoal.execute.mockResolvedValue(undefined);
    mockAddItem.execute.mockResolvedValue(undefined);
    mockRemoveItem.execute.mockResolvedValue(undefined);

    await controller.update('goal-1', { name: 'Updated' });
    await controller.delete('goal-1');
    await controller.addItemToGoal('goal-1', { documentId: 'doc-1' });
    await controller.removeItemFromGoal('item-1');

    expect(mockAddItem.execute).toHaveBeenCalledWith({
      goalId: 'goal-1',
      documentId: 'doc-1',
    });
    expect(mockRemoveItem.execute).toHaveBeenCalledWith('item-1');
  });
});
