import { Controller, Get } from '@nestjs/common';
import { GetTopicMasteryUseCase } from '@/modules/analysis/application/get-topic-mastery.use-case';
import { type TopicMasteryData } from '@repo/shared-types';

@Controller('analysis')
export class AnalysisController {
  constructor(private readonly getTopicMastery: GetTopicMasteryUseCase) {}

  @Get('mastery')
  async getMastery(): Promise<TopicMasteryData> {
    return this.getTopicMastery.execute();
  }
}
