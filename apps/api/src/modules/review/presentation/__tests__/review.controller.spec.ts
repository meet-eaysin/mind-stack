import { Test, TestingModule } from '@nestjs/testing';
import { Server } from 'node:http';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { ReviewController } from '../review.controller.js';
import { GenerateDailyReviewUseCase } from '../../application/generate-daily-review.use-case.js';
import { SubmitReviewFeedbackUseCase } from '../../application/submit-review-feedback.use-case.js';
import { UpdateReviewScoreUseCase } from '../../application/update-review-score.use-case.js';
import { ConfigService } from '@nestjs/config';

describe('ReviewController (e2e)', () => {
  let app: INestApplication<Server>;

  const mockGenerateDailyReview = { execute: jest.fn() };
  const mockSubmitFeedback = { execute: jest.fn() };
  const mockUpdateScore = { execute: jest.fn() };
  const mockConfigService = { get: jest.fn().mockReturnValue(null) };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ReviewController],
      providers: [
        {
          provide: GenerateDailyReviewUseCase,
          useValue: mockGenerateDailyReview,
        },
        { provide: SubmitReviewFeedbackUseCase, useValue: mockSubmitFeedback },
        { provide: UpdateReviewScoreUseCase, useValue: mockUpdateScore },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  describe('GET /review/daily', () => {
    it('should return 200 with review content', async () => {
      mockGenerateDailyReview.execute.mockResolvedValue({
        reviewId: 'r1',
        topics: ['A', 'B'],
      });
      const response = await request(app.getHttpServer()).get('/review/daily');

      expect(response.status).toBe(200);
      expect(response.body.reviewId).toBe('r1');
    });
  });

  describe('POST /review/feedback', () => {
    it('should return 201 for valid feedback', async () => {
      mockSubmitFeedback.execute.mockResolvedValue(undefined);
      const response = await request(app.getHttpServer())
        .post('/review/feedback')
        .send({ chunkId: 'c1', score: 4 });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 for invalid score', async () => {
      const response = await request(app.getHttpServer())
        .post('/review/feedback')
        .send({ chunkId: 'c1', score: 10 });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /review/score', () => {
    it('should return 201 for valid score update', async () => {
      mockUpdateScore.execute.mockResolvedValue(undefined);
      const response = await request(app.getHttpServer())
        .post('/review/score')
        .send({ chunkId: 'c1', score: 2 });

      expect(response.status).toBe(201);
    });
  });

  describe('Error Handling', () => {
    it('should return 500 when generation fails', async () => {
      mockGenerateDailyReview.execute.mockRejectedValue(new Error('Failed'));
      const response = await request(app.getHttpServer()).get('/review/daily');
      expect(response.status).toBe(500);
    });
  });
});
