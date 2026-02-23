import { Test, type TestingModule } from '@nestjs/testing';
import { ReviewController } from '../review.controller.js';
import { GenerateDailyReviewUseCase } from '../../application/generate-daily-review.use-case.js';
import { SubmitReviewFeedbackUseCase } from '../../application/submit-review-feedback.use-case.js';

describe('ReviewController', () => {
  let controller: ReviewController;

  const mockGenerateDailyReview = { execute: jest.fn() };
  const mockSubmitFeedback = { execute: jest.fn() };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ReviewController],
      providers: [
        {
          provide: GenerateDailyReviewUseCase,
          useValue: mockGenerateDailyReview,
        },
        {
          provide: SubmitReviewFeedbackUseCase,
          useValue: mockSubmitFeedback,
        },
      ],
    }).compile();

    controller = moduleFixture.get(ReviewController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns daily review payload', async () => {
    const payload = {
      date: '2026-02-23',
      items: [],
    };
    mockGenerateDailyReview.execute.mockResolvedValue(payload);

    await expect(controller.daily()).resolves.toEqual(payload);
  });

  it('submits feedback', async () => {
    mockSubmitFeedback.execute.mockResolvedValue(undefined);

    await expect(
      controller.feedback({ documentId: 'doc-1', score: 4 }),
    ).resolves.toEqual({ success: true });

    expect(mockSubmitFeedback.execute).toHaveBeenCalledWith({
      documentId: 'doc-1',
      score: 4,
    });
  });
});
