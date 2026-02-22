import { Test, TestingModule } from '@nestjs/testing';
import { Server } from 'node:http';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AdminController } from '../admin.controller.js';
import { GetQueueMetricsUseCase } from '../../application/get-queue-metrics.use-case.js';
import { CleanupConceptsUseCase } from '../../application/cleanup-concepts.use-case.js';
import { PrismaService } from '../../../../prisma/prisma.service.js';

describe('AdminController (e2e)', () => {
  let app: INestApplication<Server>;

  const mockGetQueueMetrics = { execute: jest.fn() };
  const mockCleanupConcepts = { execute: jest.fn() };
  const mockPrisma = {
    $queryRaw: jest.fn(),
    document: { findMany: jest.fn() },
    concept: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: GetQueueMetricsUseCase, useValue: mockGetQueueMetrics },
        { provide: CleanupConceptsUseCase, useValue: mockCleanupConcepts },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  describe('GET /admin/jobs', () => {
    it('should return 200 with queue metrics', async () => {
      mockGetQueueMetrics.execute.mockResolvedValue({
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
      });
      const response = await request(app.getHttpServer()).get('/admin/jobs');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('waiting');
    });
  });

  describe('POST /admin/cleanup', () => {
    it('should return 201 with cleanup results', async () => {
      mockCleanupConcepts.execute.mockResolvedValue({ deletedCount: 5 });
      const response = await request(app.getHttpServer()).post(
        '/admin/cleanup',
      );
      expect(response.status).toBe(201);
      expect(response.body.deletedCount).toBe(5);
    });
  });

  describe('GET /admin/health/missing-embeddings', () => {
    it('should return missing embeddings', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);
      const response = await request(app.getHttpServer()).get(
        '/admin/health/missing-embeddings',
      );
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('chunksWithoutEmbeddings');
    });
  });

  describe('GET /admin/health/failed-documents', () => {
    it('should return failed documents', async () => {
      mockPrisma.document.findMany.mockResolvedValue([]);
      const response = await request(app.getHttpServer()).get(
        '/admin/health/failed-documents',
      );
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('failedDocuments');
    });
  });
});
