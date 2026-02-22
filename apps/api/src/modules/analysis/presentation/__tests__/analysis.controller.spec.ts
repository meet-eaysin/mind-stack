import { Test, TestingModule } from '@nestjs/testing';
import { Server } from 'node:http';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AnalysisController } from '../analysis.controller.js';
import { GetTopicMasteryUseCase } from '../../application/get-topic-mastery.use-case.js';

describe('AnalysisController (e2e)', () => {
  let app: INestApplication<Server>;

  const mockGetTopicMastery = { execute: jest.fn() };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AnalysisController],
      providers: [
        { provide: GetTopicMasteryUseCase, useValue: mockGetTopicMastery },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  describe('GET /analysis/mastery', () => {
    it('should return 200 with mastery data', async () => {
      const mockResult = {
        coverage: { totalConcepts: 0, reviewedConcepts: 0, percent: 0 },
        levels: { mastered: 0, consolidating: 0, learning: 0, unseen: 0 },
        weakAreas: [],
        learningStatusDistribution: {},
      };
      mockGetTopicMastery.execute.mockResolvedValue(mockResult);

      const response = await request(app.getHttpServer()).get(
        '/analysis/mastery',
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockResult);
    });
  });
});
