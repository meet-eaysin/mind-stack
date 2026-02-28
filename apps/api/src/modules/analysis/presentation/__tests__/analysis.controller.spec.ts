import { Test, type TestingModule } from '@nestjs/testing';
import { AnalysisController } from '@/modules/analysis/presentation/analysis.controller';
import { GetTopicMasteryUseCase } from '@/modules/analysis/application/get-topic-mastery.use-case';

describe('AnalysisController', () => {
  let controller: AnalysisController;

  const mockGetTopicMastery = { execute: jest.fn() };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AnalysisController],
      providers: [
        { provide: GetTopicMasteryUseCase, useValue: mockGetTopicMastery },
      ],
    }).compile();

    controller = moduleFixture.get(AnalysisController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns mastery data', async () => {
    const expected = {
      coverage: { totalConcepts: 0, reviewedConcepts: 0, percent: 0 },
      levels: { mastered: 0, consolidating: 0, learning: 0, unseen: 0 },
      weakAreas: [],
      learningStatusDistribution: {},
    };

    mockGetTopicMastery.execute.mockResolvedValue(expected);

    await expect(controller.getMastery()).resolves.toEqual(expected);
  });
});
