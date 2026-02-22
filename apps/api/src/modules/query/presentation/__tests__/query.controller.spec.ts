import { Test, TestingModule } from '@nestjs/testing';
import { Server } from 'node:http';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { QueryController } from '../query.controller.js';
import { SemanticSearchUseCase } from '../../application/semantic-search.use-case.js';
import { FilteredSearchUseCase } from '../../application/filtered-search.use-case.js';
import { AskQuestionUseCase } from '../../application/ask-question.use-case.js';
import { RetrieveChunksUseCase } from '../../application/retrieve-chunks.use-case.js';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';

describe('QueryController (e2e)', () => {
  let app: INestApplication<Server>;

  const mockSemanticSearch = { execute: jest.fn() };
  const mockFilteredSearch = { execute: jest.fn() };
  const mockAskQuestion = { execute: jest.fn(), executeStream: jest.fn() };
  const mockRetrieveChunks = { execute: jest.fn() };
  const mockConfigService = { get: jest.fn().mockReturnValue(null) };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [QueryController],
      providers: [
        { provide: SemanticSearchUseCase, useValue: mockSemanticSearch },
        { provide: FilteredSearchUseCase, useValue: mockFilteredSearch },
        { provide: AskQuestionUseCase, useValue: mockAskQuestion },
        { provide: RetrieveChunksUseCase, useValue: mockRetrieveChunks },
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

  describe('POST /query/search', () => {
    it('should return 200 with chunks for valid query', async () => {
      mockSemanticSearch.execute.mockResolvedValue([
        { id: '1', content: 'test' },
      ]);
      const response = await request(app.getHttpServer())
        .post('/query/search')
        .send({ query: 'hello', topK: 5 });

      expect(response.status).toBe(201); // NestJS default for POST is 201
      expect(response.body.documents).toHaveLength(1);
    });

    it('should return 400 when topK is too large', async () => {
      const response = await request(app.getHttpServer())
        .post('/query/search')
        .send({ query: 'hello', topK: 100 });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain(
        'topK must not be greater than 50',
      );
    });

    it('should return 400 when query is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/query/search')
        .send({ topK: 5 });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /query/ask', () => {
    it('should return 201 with answer', async () => {
      mockAskQuestion.execute.mockResolvedValue({
        answer: 'The sky is blue',
        sources: [],
      });
      const response = await request(app.getHttpServer())
        .post('/query/ask')
        .send({ question: 'What color is the sky?' });

      expect(response.status).toBe(201);
      expect(response.body.answer).toBe('The sky is blue');
    });
  });

  describe('GET /query/ask/stream', () => {
    it('should setup SSE for streaming answer', async () => {
      mockAskQuestion.executeStream.mockReturnValue(of('Hel', 'lo'));
      const response = await request(app.getHttpServer())
        .get('/query/ask/stream')
        .query({ question: 'Hi' });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/event-stream');
    });
  });

  describe('POST /query/retrieve', () => {
    it('should return 201 with retrieved chunks', async () => {
      mockRetrieveChunks.execute.mockResolvedValue([{ id: 'c1' }]);
      const response = await request(app.getHttpServer())
        .post('/query/retrieve')
        .send({ query: 'find me anything' });

      expect(response.status).toBe(201);
      expect(response.body.chunks).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should return 500 when use case fails', async () => {
      mockSemanticSearch.execute.mockRejectedValue(new Error('Search failed'));
      const response = await request(app.getHttpServer())
        .post('/query/search')
        .send({ query: 'fail' });

      expect(response.status).toBe(500);
    });
  });
});
