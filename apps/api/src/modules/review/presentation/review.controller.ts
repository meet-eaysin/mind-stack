import { Controller, Get, Post, Body } from '@nestjs/common';
import type { DailyReviewResponse } from '@repo/shared-types';
import { GenerateDailyReviewUseCase } from '@/modules/review/application/generate-daily-review.use-case';
import { SubmitReviewFeedbackUseCase } from '@/modules/review/application/submit-review-feedback.use-case';
import { SubmitReviewFeedbackDto } from '@/modules/review/presentation/review.dtos';

@Controller('review')
export class ReviewController {
  constructor(
    private readonly generateDailyReview: GenerateDailyReviewUseCase,
    private readonly submitFeedback: SubmitReviewFeedbackUseCase,
  ) {}

  @Get('daily')
  async daily(): Promise<DailyReviewResponse> {
    return this.generateDailyReview.execute();
  }

  @Post('feedback')
  async feedback(
    @Body() dto: SubmitReviewFeedbackDto,
  ): Promise<{ success: boolean }> {
    await this.submitFeedback.execute(dto);
    return { success: true };
  }
}
