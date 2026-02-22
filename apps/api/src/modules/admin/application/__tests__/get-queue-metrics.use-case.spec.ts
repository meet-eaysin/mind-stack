import { Test, TestingModule } from '@nestjs/testing';
import { GetQueueMetricsUseCase } from '../get-queue-metrics.use-case.js';
import { getQueueToken } from '@nestjs/bullmq';

describe('GetQueueMetricsUseCase', () => {
  let useCase: GetQueueMetricsUseCase;

  const mockQueue = {
    getJobCounts: jest.fn().mockResolvedValue({
      wait: 5,
      active: 2,
      completed: 10,
      failed: 1,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetQueueMetricsUseCase,
        {
          provide: getQueueToken('ingestion'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    useCase = module.get<GetQueueMetricsUseCase>(GetQueueMetricsUseCase);
  });

  it('should return job counts from the queue', async () => {
    const result = await useCase.execute();

    expect(result).toEqual({
      waiting: 5,
      active: 2,
      completed: 10,
      failed: 1,
    });
    expect(mockQueue.getJobCounts).toHaveBeenCalled();
  });
});
