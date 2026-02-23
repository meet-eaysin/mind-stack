import { Test, type TestingModule } from '@nestjs/testing';
import { AdminController } from '../admin.controller.js';
import { GetQueueMetricsUseCase } from '../../application/get-queue-metrics.use-case.js';
import { CleanupConceptsUseCase } from '../../application/cleanup-concepts.use-case.js';
import { PrismaService } from '../../../../prisma/prisma.service.js';
import { VECTOR_STORE } from '../../../../common/tokens.js';

describe('AdminController', () => {
  let controller: AdminController;

  const mockGetQueueMetrics = { execute: jest.fn() };
  const mockCleanupConcepts = { execute: jest.fn() };
  const mockPrisma = {
    chunk: { findMany: jest.fn() },
    concept: { findMany: jest.fn() },
    document: { findMany: jest.fn() },
  };
  const mockVectorStore = {
    getByIds: jest.fn(),
    getAllIds: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: GetQueueMetricsUseCase, useValue: mockGetQueueMetrics },
        { provide: CleanupConceptsUseCase, useValue: mockCleanupConcepts },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: VECTOR_STORE, useValue: mockVectorStore },
      ],
    }).compile();

    controller = moduleFixture.get(AdminController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns jobs and cleanup metrics', async () => {
    mockGetQueueMetrics.execute.mockResolvedValue({
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
    });
    mockCleanupConcepts.execute.mockResolvedValue({ deletedCount: 2 });

    await expect(controller.getJobs()).resolves.toEqual({
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
    });
    await expect(controller.runCleanup()).resolves.toEqual({ deletedCount: 2 });
  });

  it('returns missing embeddings report', async () => {
    mockPrisma.chunk.findMany.mockResolvedValue([
      { id: 'c1', documentId: 'd1' },
      { id: 'c2', documentId: 'd2' },
    ]);
    mockVectorStore.getByIds.mockResolvedValue(['c1']);

    await expect(controller.getMissingEmbeddings()).resolves.toEqual({
      chunksWithoutEmbeddings: [{ id: 'c2', documentId: 'd2' }],
    });
  });

  it('returns orphan and failed-document reports', async () => {
    mockVectorStore.getAllIds.mockResolvedValue(['c1', 'c3']);
    mockPrisma.chunk.findMany.mockResolvedValue([{ id: 'c1' }]);
    mockPrisma.concept.findMany.mockResolvedValue([{ id: 'k1', label: 'k' }]);
    mockPrisma.document.findMany.mockResolvedValue([
      { id: 'd1', title: 'Failed', createdAt: new Date('2026-02-23T00:00:00Z') },
    ]);

    await expect(controller.getOrphans()).resolves.toEqual({
      orphanChunks: [],
      orphanConcepts: [{ id: 'k1', label: 'k' }],
      orphanEmbeddings: [{ id: 'c3' }],
    });

    await expect(controller.getFailedDocuments()).resolves.toEqual({
      failedDocuments: [
        {
          id: 'd1',
          title: 'Failed',
          createdAt: '2026-02-23T00:00:00.000Z',
        },
      ],
    });
  });
});
