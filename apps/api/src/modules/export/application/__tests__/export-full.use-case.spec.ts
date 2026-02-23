import { Test, TestingModule } from '@nestjs/testing';
import { ExportFullUseCase } from '../export-full.use-case.js';
import { PrismaService } from '../../../../prisma/prisma.service.js';

describe('ExportFullUseCase', () => {
  let useCase: ExportFullUseCase;

  const mockPrisma = {
    document: { findMany: jest.fn().mockResolvedValue([]) },
    tag: { findMany: jest.fn().mockResolvedValue([]) },
    concept: { findMany: jest.fn().mockResolvedValue([]) },
    conceptRelation: { findMany: jest.fn().mockResolvedValue([]) },
    collection: { findMany: jest.fn().mockResolvedValue([]) },
    collectionItem: { findMany: jest.fn().mockResolvedValue([]) },
    learningGoal: { findMany: jest.fn().mockResolvedValue([]) },
    learningGoalItem: { findMany: jest.fn().mockResolvedValue([]) },
    review: { findMany: jest.fn().mockResolvedValue([]) },
    reviewLog: { findMany: jest.fn().mockResolvedValue([]) },
    annotation: { findMany: jest.fn().mockResolvedValue([]) },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportFullUseCase,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    useCase = module.get<ExportFullUseCase>(ExportFullUseCase);
  });

  it('should export all data correctly', async () => {
    const mockDoc = {
      id: 'd1',
      title: 'Doc 1',
      addedByUserAt: new Date(),
      createdAt: new Date(),
      deletedAt: null,
    };
    mockPrisma.document.findMany.mockResolvedValue([mockDoc]);

    const result = await useCase.execute();

    expect(result.version).toBe('1.0.0');
    expect(result.data.documents).toHaveLength(1);
    expect(result.data.documents[0]?.['title']).toBe('Doc 1');
    expect(result.data.documents[0]?.['createdAt']).toBe(
      mockDoc.createdAt.toISOString(),
    );
    expect(mockPrisma.document.findMany).toHaveBeenCalled();
    expect(result.data.reviews).toBeDefined();
  });
});
