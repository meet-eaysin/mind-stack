import { Test, TestingModule } from '@nestjs/testing';
import { Server } from 'node:http';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { LearningGoalController } from '../learning-goal.controller.js';
import { CreateLearningGoalUseCase } from '../../application/create-learning-goal.use-case.js';
import { ListLearningGoalsUseCase } from '../../application/list-learning-goals.use-case.js';
import { GetLearningGoalUseCase } from '../../application/get-learning-goal.use-case.js';
import { UpdateLearningGoalUseCase } from '../../application/update-learning-goal.use-case.js';
import { DeleteLearningGoalUseCase } from '../../application/delete-learning-goal.use-case.js';
import { AddItemToLearningGoalUseCase } from '../../application/add-item-to-learning-goal.use-case.js';
import { RemoveItemFromLearningGoalUseCase } from '../../application/remove-item-from-learning-goal.use-case.js';

describe('LearningGoalController (e2e)', () => {
  let app: INestApplication<Server>;

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

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  describe('POST /learning-goals', () => {
    it('should create a goal', async () => {
      const dto = { name: 'New Goal' };
      mockCreateGoal.execute.mockResolvedValue({ id: '1', ...dto });

      const response = await request(app.getHttpServer())
        .post('/learning-goals')
        .send(dto);

      expect(response.status).toBe(201);
      expect(response.body.id).toBe('1');
    });
  });

  describe('GET /learning-goals', () => {
    it('should list goals', async () => {
      mockListGoals.execute.mockResolvedValue([]);
      const response = await request(app.getHttpServer()).get(
        '/learning-goals',
      );
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /learning-goals/:id', () => {
    it('should get a goal', async () => {
      mockGetGoal.execute.mockResolvedValue({ id: '1', name: 'Goal 1' });
      const response = await request(app.getHttpServer()).get(
        '/learning-goals/1',
      );
      expect(response.status).toBe(200);
      expect(response.body.id).toBe('1');
    });
  });

  describe('POST /learning-goals/:id/items', () => {
    it('should add item to goal', async () => {
      const goalId = '550e8400-e29b-41d4-a716-446655440003';
      const documentId = '550e8400-e29b-41d4-a716-446655440004';
      mockAddItem.execute.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .post(`/learning-goals/${goalId}/items`)
        .send({ documentId });

      expect(response.status).toBe(201);
      expect(mockAddItem.execute).toHaveBeenCalledWith({
        goalId,
        documentId,
      });
    });
  });
});
