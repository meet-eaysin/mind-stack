import { Test, TestingModule } from '@nestjs/testing';
import { GetTopicMasteryUseCase } from '../get-topic-mastery.use-case.js';
import { PrismaService } from '../../../../prisma/prisma.service.js';

describe('GetTopicMasteryUseCase', () => {
  let useCase: GetTopicMasteryUseCase;

  const mockPrisma = {
    concept: { count: jest.fn() },
    review: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    conceptChunk: { findFirst: jest.fn() },
    document: { groupBy: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetTopicMasteryUseCase,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    useCase = module.get<GetTopicMasteryUseCase>(GetTopicMasteryUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should calculate topic mastery metrics correctly', async () => {
    mockPrisma.concept.count.mockResolvedValue(10);
    mockPrisma.review.count.mockResolvedValue(5);
    mockPrisma.review.findMany
      .mockResolvedValueOnce([
        { interval: 31, repetitionCount: 5, documentId: 'd1' }, // Mastered
        { interval: 10, repetitionCount: 2, documentId: 'd2' }, // Consolidating
      ]) // For general metrics
      .mockResolvedValueOnce([
        { easeFactor: 1.5, interval: 2, documentId: 'd3' }, // Weak area
      ]); // For weak areas

    mockPrisma.conceptChunk.findFirst.mockResolvedValue({
      concept: { id: 'c1', label: 'Weak Concept' },
    });

    mockPrisma.document.groupBy.mockResolvedValue([
      { learningStatus: 'LEARNING', _count: { id: 3 } },
      { learningStatus: 'NEW', _count: { id: 7 } },
    ]);

    const result = await useCase.execute();

    expect(result.coverage.totalConcepts).toBe(10);
    expect(result.coverage.reviewedConcepts).toBe(5);
    expect(result.coverage.percent).toBe(50);
    expect(result.levels.mastered).toBe(1);
    expect(result.levels.consolidating).toBe(1);
    expect(result.weakAreas).toHaveLength(1);
    expect(result.weakAreas[0]!.id).toBe('c1');
    expect(result.learningStatusDistribution['NEW']).toBe(7);
  });
});
