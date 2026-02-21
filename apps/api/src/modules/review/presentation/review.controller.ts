import { Controller, Get, Post, Body } from '@nestjs/common';
import type { DailyReviewResponse } from '@repo/shared-types';
import { GenerateDailyReviewUseCase } from '../application/generate-daily-review.use-case.js';
import { SubmitReviewFeedbackUseCase } from '../application/submit-review-feedback.use-case.js';
import { SubmitReviewFeedbackDto } from './review.dtos.js';

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
