import { Test, type TestingModule } from '@nestjs/testing';
import { ReviewController } from '@/modules/review/presentation/review.controller';
import { GenerateDailyReviewUseCase } from '@/modules/review/application/generate-daily-review.use-case';
import { SubmitReviewFeedbackUseCase } from '@/modules/review/application/submit-review-feedback.use-case';

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
