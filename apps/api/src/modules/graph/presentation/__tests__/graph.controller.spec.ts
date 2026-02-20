import { Test, TestingModule } from '@nestjs/testing';
import { Server } from 'node:http';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { GraphController } from '../graph.controller.js';
import { BuildGraphUseCase } from '../../application/build-graph.use-case.js';
import { QueryGraphUseCase } from '../../application/query-graph.use-case.js';
import { GetNeighborhoodUseCase } from '../../application/get-neighborhood.use-case.js';
import { ConfigService } from '@nestjs/config';

describe('GraphController (e2e)', () => {
  let app: INestApplication<Server>;

  const mockBuildGraph = { execute: jest.fn() };
  const mockQueryGraph = { execute: jest.fn() };
  const mockGetNeighborhood = { execute: jest.fn() };
  const mockConfigService = { get: jest.fn().mockReturnValue(null) };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [GraphController],
      providers: [
        { provide: BuildGraphUseCase, useValue: mockBuildGraph },
        { provide: QueryGraphUseCase, useValue: mockQueryGraph },
        { provide: GetNeighborhoodUseCase, useValue: mockGetNeighborhood },
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

  describe('GET /graph', () => {
    it('should return 200 with graph data', async () => {
      mockQueryGraph.execute.mockResolvedValue({ nodes: [], edges: [] });
      const response = await request(app.getHttpServer()).get('/graph');

      expect(response.status).toBe(200);
      expect(response.body.nodes).toBeDefined();
    });
  });

  describe('POST /graph/build', () => {
    it('should return 201 for valid build request', async () => {
      mockBuildGraph.execute.mockResolvedValue(undefined);
      const response = await request(app.getHttpServer())
        .post('/graph/build')
        .send({ chunkId: 'c1', chunkContent: 'concept A relates to B' });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 when chunkId is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/graph/build')
        .send({ chunkContent: 'content' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /graph/neighborhood', () => {
    it('should return 201 with neighborhood graph', async () => {
      mockGetNeighborhood.execute.mockResolvedValue({
        nodes: [{ id: 'concept-1' }],
        edges: [],
      });
      const response = await request(app.getHttpServer())
        .post('/graph/neighborhood')
        .send({ conceptId: 'concept-1', depth: 2 });

      expect(response.status).toBe(201);
      expect(response.body.nodes).toHaveLength(1);
    });

    it('should return 400 for invalid depth', async () => {
      const response = await request(app.getHttpServer())
        .post('/graph/neighborhood')
        .send({ conceptId: 'c1', depth: 10 });

      expect(response.status).toBe(400);
    });
  });
});
